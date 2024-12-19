// utils/userIdentification.ts
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabaseClient";

// 디바이스 정보 수집 함수
const getDeviceInfo = () => {
  const info = {
    userAgent: window.navigator.userAgent,
    platform: window.navigator.platform,
    language: window.navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  // base64로 인코딩하여 단일 문자열로 변환
  return btoa(JSON.stringify(info));
};

// localStorage 키 관리
const getLocalStorageKey = () => {
  const KEY_NAME = "carol_user_key";
  let key = localStorage.getItem(KEY_NAME);

  if (!key) {
    key = uuidv4();
    localStorage.setItem(KEY_NAME, key);
  }

  return key;
};

// Fingerprint 생성
const getFingerprint = async () => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId;
};

// 사용자 식별 및 데이터베이스 처리
export const identifyUser = async () => {
  try {
    const deviceId = getDeviceInfo();
    const localStorageKey = getLocalStorageKey();
    const fingerprint = await getFingerprint();

    console.log("Collected identifiers:", {
      deviceId: deviceId.slice(0, 20) + "...",
      localStorageKey,
      fingerprint,
    });

    // OR 조건을 in 연산자로 변경
    const { data: existingUser, error: searchError } = await supabase
      .from("users")
      .select("*")
      .eq("fingerprint", fingerprint)
      .maybeSingle();

    if (searchError) {
      console.error("Error searching by fingerprint:", searchError);

      // fingerprint로 못찾았으면 localStorage key로 한번 더 시도
      const { data: userByStorage } = await supabase
        .from("users")
        .select("*")
        .eq("local_storage_key", localStorageKey)
        .maybeSingle();

      if (userByStorage) return userByStorage;
    }

    if (existingUser) {
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          device_id: deviceId,
          local_storage_key: localStorageKey,
        })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating user:", updateError);
        return existingUser;
      }

      return updatedUser;
    }

    // 새 사용자 생성 시 UUID 명시적 지정
    const newUserId = uuidv4();
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        id: newUserId, // UUID 명시적 지정
        fingerprint,
        device_id: deviceId,
        local_storage_key: localStorageKey,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating new user:", createError);
      return null;
    }

    console.log("Created new user:", newUser);
    return newUser;
  } catch (error) {
    console.error("Unexpected error in identifyUser:", error);
    return null;
  }
};

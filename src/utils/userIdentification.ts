import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabaseClient";
import type { User } from "../types/schema";

// 에러 발생 시 페이지 새로고침
const handleError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  // 짧은 지연 후 새로고침 (사용자가 에러 로그를 볼 수 있도록)
  setTimeout(() => {
    window.location.reload();
  }, 1000);
  return null;
};

// 디바이스 정보 수집 함수
const getDeviceInfo = () => {
  try {
    const info = {
      userAgent: window.navigator.userAgent,
      platform: window.navigator.platform,
      language: window.navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    return btoa(JSON.stringify(info));
  } catch (error) {
    return handleError(error, "getDeviceInfo");
  }
};

// localStorage 키 관리
const getLocalStorageKey = () => {
  try {
    const KEY_NAME = "carol_user_key";
    let key = localStorage.getItem(KEY_NAME);

    if (!key) {
      key = uuidv4();
      localStorage.setItem(KEY_NAME, key);
    }

    return key;
  } catch (error) {
    return handleError(error, "getLocalStorageKey");
  }
};

// Fingerprint 생성
const getFingerprint = async () => {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    return handleError(error, "getFingerprint");
  }
};

// 사용자 식별 및 데이터베이스 처리
export const identifyUser = async (): Promise<User | null> => {
  try {
    const deviceId = getDeviceInfo();
    if (!deviceId) return null;

    const localStorageKey = getLocalStorageKey();
    if (!localStorageKey) return null;

    const fingerprint = await getFingerprint();
    if (!fingerprint) return null;

    console.log("Collected identifiers:", {
      deviceId: deviceId.slice(0, 20) + "...",
      localStorageKey,
      fingerprint,
    });

    // 먼저 fingerprint로 사용자 검색
    const { data: existingUserByFingerprint, error: fingerprintError } =
      await supabase
        .from("users")
        .select("*")
        .eq("fingerprint", fingerprint)
        .maybeSingle();

    if (fingerprintError) {
      return handleError(fingerprintError, "fingerprint search");
    }

    // fingerprint로 찾은 사용자가 있으면 업데이트 후 반환
    if (existingUserByFingerprint) {
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          device_id: deviceId,
          local_storage_key: localStorageKey,
        })
        .eq("id", existingUserByFingerprint.id)
        .select()
        .single();

      if (updateError) {
        return handleError(updateError, "update existing user");
      }

      return updatedUser;
    }

    // fingerprint로 못찾았으면 localStorage key로 검색
    const { data: existingUserByStorage, error: storageError } = await supabase
      .from("users")
      .select("*")
      .eq("local_storage_key", localStorageKey)
      .maybeSingle();

    if (storageError) {
      return handleError(storageError, "localStorage key search");
    }

    // localStorage key로 찾은 사용자가 있으면 업데이트 후 반환
    if (existingUserByStorage) {
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          device_id: deviceId,
          fingerprint: fingerprint,
        })
        .eq("id", existingUserByStorage.id)
        .select()
        .single();

      if (updateError) {
        return handleError(updateError, "update user by storage");
      }

      return updatedUser;
    }

    // 마지막으로 한번 더 fingerprint 체크 (race condition 방지)
    const { data: finalFingerprintCheck, error: finalCheckError } =
      await supabase
        .from("users")
        .select("*")
        .eq("fingerprint", fingerprint)
        .maybeSingle();

    if (finalCheckError) {
      return handleError(finalCheckError, "final fingerprint check");
    }

    if (finalFingerprintCheck) {
      return finalFingerprintCheck;
    }

    // 새 사용자 생성
    const newUserId = uuidv4();
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        id: newUserId,
        fingerprint,
        device_id: deviceId,
        local_storage_key: localStorageKey,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      // 생성 실패 시 마지막으로 한번 더 fingerprint로 검색
      const { data: existingUser, error: lastCheckError } = await supabase
        .from("users")
        .select("*")
        .eq("fingerprint", fingerprint)
        .maybeSingle();

      if (lastCheckError) {
        return handleError(lastCheckError, "last existence check");
      }

      if (existingUser) {
        console.warn(
          "User already exists, returning existing user:",
          existingUser
        );
        return existingUser;
      }

      return handleError(createError, "create new user");
    }

    console.log("Created new user:", newUser);
    return newUser;
  } catch (error) {
    return handleError(error, "identifyUser");
  }
};

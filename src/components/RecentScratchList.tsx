import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";

// 재미있는 랜덤 이름 생성을 위한 단어 리스트
const adjectives = [
  "춤추는",
  "졸린",
  "열정적인",
  "배고픈",
  "행복한",
  "낭만적인",
  "수줍은",
  "덤벙대는",
  "똑똑한",
  "현명한",
  "엉뚱한",
  "친절한",
  "포근한",
  "깜찍한",
  "발랄한",
  "귀여운",
  "씩씩한",
  "용감한",
  "활발한",
  "신비한",
  "꿈꾸는",
  "소심한",
  "유쾌한",
  "즐거운",
  "따뜻한",
  "차분한",
  "다정한",
  "재치있는",
  "멋진",
  "우아한",
  "싱그러운",
  "향기로운",
  "재미있는",
  "사려깊은",
  "상냥한",
  "조용한",
  "시원한",
  "앙증맞은",
  "기특한",
  "예쁜",
  "든든한",
  "영리한",
  "소중한",
  "귀염둥이",
  "씩씩이",
  "반짝이는",
  "빛나는",
  "아기자기한",
];

const nouns = [
  "산타",
  "루돌프",
  "천사",
  "요정",
  "눈사람",
  "눈토끼",
  "사슴",
  "종",
  "트리",
  "별",
  "선물",
  "양말",
  "리본",
  "솔방울",
  "방울",
  "초",
  "순록",
  "썰매",
  "지팡이",
  "쿠키",
  "눈꽃",
  "캔디",
  "진저맨",
  "랜턴",
  "우유",
  "케이크",
  "팽귄",
  "곰돌이",
  "북극곰",
  "순무",
  "당근",
  "딸기",
  "초콜릿",
  "캐롤",
  "방울",
  "방울새",
  "밤송이",
  "도토리",
  "솔방울",
  "토끼",
  "호랑이",
  "사자",
  "코알라",
  "판다",
  "고양이",
  "강아지",
  "다람쥐",
  "기린",
];
interface RecentScratch {
  id: number;
  scratched_at: string;
  user_id: string;
  song: {
    id: number;
    image_url: string;
    artist_name: string;
    song_title: string;
  };
}

const useConsistentRandomName = () => {
  const nameMap = useMemo(() => new Map<string, string>(), []);

  return (userId: string) => {
    if (nameMap.has(userId)) {
      return nameMap.get(userId)!;
    }

    const hash = userId.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const adjIndex = Math.abs(hash % adjectives.length);
    const nounIndex = Math.abs((hash >> 8) % nouns.length);
    const newName = `${adjectives[adjIndex]} ${nouns[nounIndex]}`;

    nameMap.set(userId, newName);
    return newName;
  };
};
const RecentScratchLog: React.FC<{
  scratch: RecentScratch;
  getRandomName: (userId: string) => string;
}> = ({ scratch, getRandomName }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "방금";
    if (diffInMinutes < 60) return `${diffInMinutes}분`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간`;
    return new Intl.DateTimeFormat("ko-KR", {
      month: "numeric",
      day: "numeric",
    }).format(date);
  };

  const userName = getRandomName(scratch.user_id);

  const messages = [
    `님이 크리스마스 선물을 받았어요`,
    `님의 선물상자가 열렸어요`,
    `님이 특별한 선물을 발견했어요`,
    `님의 캐롤이 울려퍼져요`,
    `님이 새로운 캐롤을 들려줘요`,
  ];

  // userId를 시드로 사용하여 일관된 메시지 선택
  const messageIndex = Math.abs(
    scratch.user_id.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0) % messages.length
  );

  return (
    <div className="flex items-center space-x-2 py-2 hover:bg-white/5 transition-colors px-1 -mx-1 rounded group">
      {/* 흐린 이미지 */}
      <div className="relative w-6 h-6 flex-shrink-0 mt-0.5">
        <div className="absolute inset-0 backdrop-blur-xl rounded-full" />
        <img
          src={scratch.song.image_url}
          alt=""
          className="w-full h-full object-cover rounded-full opacity-30"
        />
      </div>

      {/* 메시지와 곡 정보 */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* 첫 번째 줄: 유저 메시지 */}
        <div className="flex items-center gap-x-1">
          <span className="text-xs font-medium text-white/90">{userName}</span>
          <span className="text-xs text-blue-200/90">
            {messages[messageIndex]}
          </span>
        </div>

        {/* 두 번째 줄: 곡 정보 */}
        <div className="text-xs text-blue-200/80">
          <span className="font-medium text-white/80">
            {scratch.song.artist_name}
          </span>
          <span className="mx-1 text-blue-200/60">-</span>
          <span className="font-medium text-white/80">
            {scratch.song.song_title}
          </span>
        </div>
      </div>

      {/* 타임스탬프 */}
      <div className="text-[10px] text-blue-200/60 flex-shrink-0 mt-1">
        {formatDate(scratch.scratched_at)}
      </div>
    </div>
  );
};

const RecentScratchList: React.FC = () => {
  const [recentScratches, setRecentScratches] = useState<RecentScratch[]>([]);
  const [loading, setLoading] = useState(true);
  const getRandomName = useConsistentRandomName();

  useEffect(() => {
    const fetchRecentScratches = async () => {
      try {
        const { data: rawData, error } = await supabase
          .from("scratches")
          .select(
            `
            id,
            scratched_at,
            user_id,
            songs (
              id,
              image_url,
              artist_name,
              song_title
            )
          `
          )
          .order("scratched_at", { ascending: false })
          .limit(5);

        if (error) throw error;

        const formattedScratches: RecentScratch[] = (rawData || []).map(
          (item: any) => ({
            id: item.id,
            scratched_at: item.scratched_at,
            user_id: item.user_id,
            song: {
              id: item.songs.id,
              image_url: item.songs.image_url,
              artist_name: item.songs.artist_name,
              song_title: item.songs.song_title,
            },
          })
        );

        setRecentScratches(formattedScratches);
      } catch (error) {
        console.error("Error fetching recent scratches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentScratches();
    const interval = setInterval(fetchRecentScratches, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center text-blue-200/60 py-1 text-xs">로딩중...</div>
    );
  }

  if (recentScratches.length === 0) {
    return (
      <div className="text-center text-blue-200/60 py-1 text-xs">
        아직 선물이 없어요!
      </div>
    );
  }

  return (
    <div className="w-full max-w-md px-4">
      <h2 className="text-xs font-medium text-white/70 mb-2">최근 선물 소식</h2>
      <div className="divide-y divide-white/5">
        {recentScratches.map((scratch) => (
          <RecentScratchLog
            key={scratch.id}
            scratch={scratch}
            getRandomName={getRandomName}
          />
        ))}
      </div>
    </div>
  );
};
export default RecentScratchList;

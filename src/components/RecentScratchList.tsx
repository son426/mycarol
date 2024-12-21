import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { ChevronRightIcon } from "lucide-react";
import { ADJECTIVES, NOUNS } from "../constants";

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

    const adjIndex = Math.abs(hash % ADJECTIVES.length);
    const nounIndex = Math.abs((hash >> 8) % NOUNS.length);
    const newName = `${ADJECTIVES[adjIndex]} ${NOUNS[nounIndex]}`;

    nameMap.set(userId, newName);
    return newName;
  };
};
const RecentScratchLog: React.FC<{
  scratch: RecentScratch;
  getRandomName: (userId: string) => string;
  onItemClick: (scratch: RecentScratch) => void;
}> = ({ scratch, getRandomName, onItemClick }) => {
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
    "님이 크리스마스 선물을 받았어요",
    "님의 선물상자가 열렸어요",
    "님이 캐롤을 듣고 있어요",
    "님의 캐롤이 울려퍼져요",
  ];

  const messageIndex = Math.abs(
    scratch.user_id.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0) % messages.length
  );

  return (
    <div
      className="flex items-center space-x-2 py-2 hover:bg-white/5 transition-colors px-1 -mx-1 rounded group cursor-pointer"
      onClick={() => onItemClick(scratch)}
    >
      <div className="relative w-6 h-6 flex-shrink-0 mt-0.5">
        <div className="absolute inset-0 backdrop-blur-xl rounded-full" />
        <img
          src={scratch.song.image_url}
          alt=""
          className="w-full h-full object-cover rounded-full opacity-30"
        />
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-x-1">
          <span className="text-xs font-medium text-white/90">{userName}</span>
          <span className="text-xs text-blue-200/90">
            {messages[messageIndex]}
          </span>
        </div>

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

      <div className="text-[10px] text-blue-200/60 flex-shrink-0 mt-1">
        {formatDate(scratch.scratched_at)}
      </div>
    </div>
  );
};

const AllScratchesModal: React.FC<{
  open: boolean;
  onClose: () => void;
  getRandomName: (userId: string) => string;
}> = ({ open, onClose, getRandomName }) => {
  const [scratches, setScratches] = useState<RecentScratch[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedScratch, setSelectedScratch] = useState<RecentScratch | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [page, setPage] = useState(0);
  const MAX_ITEMS = 100;
  const PAGE_SIZE = 20;

  const loadMoreScratches = async () => {
    if (loading || !hasMore || scratches.length >= MAX_ITEMS) return;

    setLoading(true);
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
        .range(
          page * PAGE_SIZE,
          Math.min((page + 1) * PAGE_SIZE - 1, MAX_ITEMS - 1)
        );

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

      setScratches((prev) => {
        const newScratches = [...prev, ...formattedScratches];
        const hasMoreItems =
          formattedScratches.length === PAGE_SIZE &&
          newScratches.length < MAX_ITEMS;
        setHasMore(hasMoreItems);
        return newScratches;
      });
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error("Error fetching scratches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setScratches([]);
      setHasMore(true);
      setPage(0);
      loadMoreScratches();
    }
  }, [open]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadMoreScratches();
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            backgroundColor: "#1a365d",
            color: "white",
            backgroundImage: "linear-gradient(to bottom, #1a365d, #2d3748)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
            height: "80vh",
            maxWidth: "480px",
            margin: "16px",
            width: "calc(100% - 32px)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            padding: "16px 20px",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">모든 선물 소식</span>
            <span className="text-sm text-blue-200/80">
              {scratches.length}개의 선물
            </span>
          </div>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 0,
            overflowX: "hidden",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "rgba(255,255,255,0.05)",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(255,255,255,0.1)",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "rgba(255,255,255,0.15)",
            },
          }}
          onScroll={handleScroll}
        >
          <div className="divide-y divide-white/5 px-3">
            {scratches.map((scratch) => (
              <RecentScratchLog
                key={scratch.id}
                scratch={scratch}
                getRandomName={getRandomName}
                onItemClick={(scratch) => {
                  setSelectedScratch(scratch);
                  setIsDetailModalOpen(true);
                }}
              />
            ))}
          </div>
          {loading && (
            <div className="text-center text-blue-200/60 py-6 text-xs">
              <div className="inline-block animate-spin mr-2">⏳</div>
              선물을 더 가져오는 중...
            </div>
          )}
          {!loading && !hasMore && scratches.length > 0 && (
            <div className="text-center text-blue-200/60 py-6 text-xs">
              100개까지 확인할 수 있어요! 🎁
            </div>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            padding: "12px 20px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              color: "white",
              fontSize: "0.875rem",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            backgroundColor: "#1a365d",
            color: "white",
            backgroundImage: "linear-gradient(to bottom, #1a365d, #2d3748)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
            pt: 4,
          }}
        >
          마이 크리스마스 캐롤 🎄
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              color: "rgb(191 219 254)",
              textAlign: "center",
              my: 2,
            }}
          >
            <div>많은 크리스마스 캐롤이 있답니다.</div>
            <div>소중한 사람에게 마음을 전해보세요</div>
            <div className="mt-4 flex flex-col">
              <div className="text-white font-medium">
                {selectedScratch?.song.artist_name} -{" "}
                {selectedScratch?.song.song_title}
              </div>
              <div className="mt-1">아래 버튼을 눌러 들어보세요!</div>
            </div>
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "stretch",
            padding: "16px 24px",
            gap: 2,
          }}
        >
          <Button
            onClick={() => setIsDetailModalOpen(false)}
            fullWidth
            sx={{
              color: "white",
              borderRadius: "12px",
              py: 1.5,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              "&:hover": {
                border: "1px solid rgba(255, 255, 255, 0.3)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            닫기
          </Button>
          <Button
            onClick={() => {
              window.location.href = `http://homebrewmusic.web.app/mycarol/${
                selectedScratch?.song.id
              }?songTitle=${selectedScratch?.song.song_title}&artistName=${
                selectedScratch?.song.artist_name
              }&userName=${getRandomName(
                selectedScratch?.user_id || "1234"
              )}&audioProgress=0`;
            }}
            fullWidth
            sx={{
              backgroundColor: "#2F9B4E",
              color: "white",
              borderRadius: "12px",
              py: 1.5,
              "&:hover": {
                backgroundColor: "#268642",
              },
            }}
          >
            바로가기
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const RecentScratchList: React.FC = () => {
  const [recentScratches, setRecentScratches] = useState<RecentScratch[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScratch, setSelectedScratch] = useState<RecentScratch | null>(
    null
  );
  const [isAllScratchesModalOpen, setIsAllScratchesModalOpen] = useState(false);
  const getRandomName = useConsistentRandomName();

  useEffect(() => {
    const fetchRecentScratches = async () => {
      try {
        const { count } = await supabase
          .from("scratches")
          .select("*", { count: "exact", head: true });

        setTotalCount(count || 0);

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
          .limit(4);

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

  const handleItemClick = (scratch: RecentScratch) => {
    setSelectedScratch(scratch);
    setIsModalOpen(true);
  };

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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-white">최근 선물 소식</h2>
        <button
          onClick={() => setIsAllScratchesModalOpen(true)}
          className="flex items-center gap-x-1.5 text-xs text-blue-200/80 hover:text-blue-200 transition-colors group"
        >
          <span>{totalCount.toLocaleString()}명이 선물받았어요!</span>
          <ChevronRightIcon className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="divide-y divide-white/5">
        {recentScratches.map((scratch) => (
          <RecentScratchLog
            key={scratch.id}
            scratch={scratch}
            getRandomName={getRandomName}
            onItemClick={handleItemClick}
          />
        ))}
      </div>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            backgroundColor: "#1a365d",
            color: "white",
            backgroundImage: "linear-gradient(to bottom, #1a365d, #2d3748)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
            pt: 4,
          }}
        >
          마이 크리스마스 캐롤 🎄
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              color: "rgb(191 219 254)",
              textAlign: "center",
              my: 2,
            }}
          >
            <div>많은 크리스마스 캐롤이 있답니다.</div>
            <div>소중한 사람에게 마음을 전해보세요</div>
            <div className="mt-4 flex flex-col">
              <div className="text-white font-medium">
                {selectedScratch?.song.artist_name} -{" "}
                {selectedScratch?.song.song_title}
              </div>
              <div className="mt-1">아래 버튼을 눌러 들어보세요!</div>
            </div>
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "stretch",
            padding: "16px 24px",
            gap: 2,
          }}
        >
          <Button
            onClick={() => setIsModalOpen(false)}
            fullWidth
            sx={{
              color: "white",
              borderRadius: "12px",
              py: 1.5,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              "&:hover": {
                border: "1px solid rgba(255, 255, 255, 0.3)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            닫기
          </Button>
          <Button
            onClick={() => {
              window.location.href = `http://homebrewmusic.web.app/mycarol/${
                selectedScratch?.song.id
              }?songTitle=${selectedScratch?.song.song_title}&artistName=${
                selectedScratch?.song.artist_name
              }&userName=${getRandomName(
                selectedScratch?.user_id || "1234"
              )}&audioProgress=0`;
            }}
            fullWidth
            sx={{
              backgroundColor: "#2F9B4E",
              color: "white",
              borderRadius: "12px",
              py: 1.5,
              "&:hover": {
                backgroundColor: "#268642",
              },
            }}
          >
            바로가기
          </Button>
        </DialogActions>
      </Dialog>

      <AllScratchesModal
        open={isAllScratchesModalOpen}
        onClose={() => setIsAllScratchesModalOpen(false)}
        getRandomName={getRandomName}
      />
    </div>
  );
};

export default RecentScratchList;

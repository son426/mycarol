import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScratchCard from "./components/ScratchCard";
import { useScratchStore } from "./stores/useScratchStore";
import { Snowflake } from "lucide-react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { supabase } from "./lib/supabaseClient";
import { identifyUser } from "./utils/userIdentification";
import { User } from "./types/schema";
import ScratchHistoryComponent from "./components/ScratchHistory";
import { ScratchHistory } from "./types/customType";
interface SongData {
  id: number;
  audio_url: string;
  image_url: string;
  artists: {
    name: string;
  };
  original_songs: {
    title: string;
  };
}

const App = () => {
  const { isStarted, isRevealed, confirmWin } = useScratchStore();
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [song, setSong] = useState<SongData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoding] = useState(true);
  const [scratchHistory, setScratchHistory] = useState<ScratchHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const fetchScratchHistory = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("scratches")
          .select(
            `
            id,
            scratched_at,
            song:songs (
              id,
              image_url,
              artists (
                name
              ),
              original_songs (
                title
              )
            )
          `
          )
          .eq("user_id", userId)
          .order("scratched_at", { ascending: false });

        if (error) throw error;

        setScratchHistory(data || []);
      } catch (error) {
        console.error("Error fetching scratch history:", error);
      } finally {
        setHistoryLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchScratchHistory(currentUser.id);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await identifyUser();
        console.log("Identified user:", user);
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to identify user:", error);
      } finally {
        setUserLoding(false);
      }
    };

    initUser();
  }, []);

  const { playAudio } = useAudioPlayer(song?.audio_url || "");

  useEffect(() => {
    const fetchRandomSong = async () => {
      try {
        const { data, error } = await supabase
          .from("songs")
          .select(
            `
            id,
            audio_url,
            image_url,
            artists (
              name
            ),
            original_songs (
              title
            )
          `
          )
          .order("id", { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          const formattedSong: any = {
            id: data.id,
            audio_url: data.audio_url,
            image_url: data.image_url,
            artists: data.artists,
            original_songs: data.original_songs,
          };

          setSong(formattedSong);
        }
      } catch (err) {
        console.error("Error details:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch song");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRandomSong();
  }, []);

  useEffect(() => {
    if (isRevealed && song) {
      setOverlayOpacity(0);
      playAudio().catch((error: Error) => {
        console.error("오디오 재생 중 에러 발생:", error);
      });
    }
  }, [isRevealed, playAudio, song]);

  useEffect(() => {
    if (isStarted) {
      setOverlayOpacity(0.5);
    } else if (isRevealed) {
      setOverlayOpacity(0);
    } else {
      setOverlayOpacity(0);
    }
  }, [isStarted, isRevealed]);

  const handleShare = async () => {
    if (!song) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "크리스마스 캐롤 찾기",
          text: `내가 찾은 크리스마스 캐롤: ${song.original_songs.title} - ${song.artists.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("공유 실패:", error);
      }
    } else {
      console.log("Web Share API를 지원하지 않는 브라우저입니다.");
    }
    setOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#1a365d] to-[#2d3748]">
        <div className="text-white">노래 로딩중...</div>
      </div>
    );
  }

  if (userLoading || !currentUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#1a365d] to-[#2d3748]">
        <div className="text-white">유저 식별중...</div>
      </div>
    );
  }

  if (historyLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#1a365d] to-[#2d3748]">
        <div className="text-white">히스토리 로딩중</div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#1a365d] to-[#2d3748]">
        <div className="text-white">Error: {error || "No song found"}</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#1a365d] to-[#2d3748]">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <Snowflake className="absolute top-10 left-[10%] text-white/20 w-8 h-8" />
        <Snowflake className="absolute top-20 right-[15%] text-white/20 w-6 h-6" />
        <Snowflake className="absolute bottom-20 left-[20%] text-white/20 w-10 h-10" />
        <Snowflake className="absolute bottom-40 right-[25%] text-white/20 w-8 h-8" />
      </div>

      {/* Debug 정보 표시 - 개발 중에만 사용 */}
      <div className="absolute top-4 right-4 bg-black/50 text-white p-4 rounded-lg text-sm">
        <p>User ID: {currentUser?.id}</p>
        <p>Fingerprint: {currentUser?.fingerprint?.slice(0, 8)}...</p>
        <p>
          Created: {new Date(currentUser?.created_at || 0).toLocaleString()}
        </p>
      </div>

      <motion.div
        className="fixed inset-0 bg-[#1a365d] pointer-events-none"
        animate={{ opacity: overlayOpacity }}
        transition={{ duration: 0.8 }}
      />

      <div className="relative w-full max-w-lg mx-auto px-4 py-8 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {(!isStarted || isRevealed) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl font-bold mb-2 text-white">
                {!isRevealed ? "선물이 도착했어요!" : "메리 크리스마스! 🎄"}
              </h1>
              <>
                {!isRevealed ? (
                  <p className="text-blue-200">
                    포장지를 뜯어서 나만의 캐롤을 뽑아보세요!
                  </p>
                ) : (
                  <>
                    <p className="text-blue-200">
                      {`'${song.original_songs.title} - ${song.artists.name}'`}
                    </p>
                    <p className="text-blue-200">
                      나만의 크리스마스 캐롤이 완성됐어요!
                    </p>
                  </>
                )}
              </>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ scale: 1 }}
          animate={{
            scale: isStarted && !isRevealed ? 1.02 : 1,
            y: isStarted && !isRevealed ? -10 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <div className="relative w-[260px] md:w-[400px] lg:w-[500px] mx-auto">
            <ScratchCard
              width={
                typeof window !== "undefined" && window.innerWidth < 768
                  ? 260
                  : typeof window !== "undefined" && window.innerWidth < 1024
                  ? 320
                  : 400
              }
              height={
                typeof window !== "undefined" && window.innerWidth < 768
                  ? 260
                  : typeof window !== "undefined" && window.innerWidth < 1024
                  ? 320
                  : 400
              }
              imageUrl={song.image_url}
              threshold={20}
              songId={song.id}
              userId={currentUser.id}
            />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {(!isStarted || isRevealed) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.5,
                delay: isRevealed ? 0.3 : 0,
              }}
              className="mt-8 text-center w-full px-4"
            >
              <Button
                variant="text"
                sx={{
                  color: "rgb(191 219 254)",
                  "&:hover": { color: "white" },
                }}
                onClick={() => setInfoOpen(true)}
              >
                마이캐롤이 뭔가요?{" "}
              </Button>

              {isRevealed && (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  sx={{
                    borderRadius: "14px",
                    py: 2,
                    fontSize: "1.125rem",
                    fontWeight: "bold",
                    textTransform: "none",
                    backgroundColor: "#2F9B4E",
                    "&:hover": {
                      backgroundColor: "#268642",
                    },
                    boxShadow: "0 2px 8px rgba(47, 155, 78, 0.3)",
                  }}
                  onClick={() => {
                    if (!hasConfirmed) {
                      confirmWin();
                      setOpen(true);
                    }
                  }}
                >
                  {"확인했어요"}
                </Button>
              )}
              {hasConfirmed && (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  sx={{
                    borderRadius: "14px",
                    py: 2,
                    fontSize: "1.125rem",
                    fontWeight: "bold",
                    textTransform: "none",
                    backgroundColor: "#2F9B4E",
                    "&:hover": {
                      backgroundColor: "#268642",
                    },
                    boxShadow: "0 2px 8px rgba(47, 155, 78, 0.3)",
                  }}
                  onClick={() => {
                    setOpen(true);
                  }}
                >
                  {"공유하고 하나 더 뽑기"}
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full mt-8"
        >
          <ScratchHistoryComponent history={scratchHistory} />
        </motion.div>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
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
          친구에게 공유하기 🎄
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              color: "rgb(191 219 254)",
              textAlign: "center",
              my: 2,
            }}
          >
            <div>친구에게 공유하면 하나 더 뽑을 수 있어요.</div>
            <div>지금 바로 자랑해보세요!</div>
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
            onClick={() => {
              setOpen(false);
              setHasConfirmed(true);
            }}
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
              handleShare();
              setHasConfirmed(true);
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
            공유하기
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
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
          마이캐롤 소개 🎄
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              color: "rgb(191 219 254)",
              textAlign: "center",
              my: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div style={{ gap: 4 }}>
              <div>2024년 연말을 맞아</div>
              <div>소중한 사람들에게 마음을 전해봐요.</div>
            </div>
            <div style={{ gap: 4 }}>
              <div>크리스마스 캐롤을</div>
              <div>다양한 가수 목소리로 듣고 싶었어요.</div>
            </div>
            <div style={{ marginTop: "1rem" }}>Merry Christmas ~</div>
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "center",
            padding: "16px 24px",
          }}
        >
          <Button
            onClick={() => setInfoOpen(false)}
            sx={{
              color: "white",
              borderRadius: "12px",
              py: 1.5,
              px: 4,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              "&:hover": {
                border: "1px solid rgba(255, 255, 255, 0.3)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default App;

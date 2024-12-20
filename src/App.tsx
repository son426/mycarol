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
import { ScratchHistory } from "./types/customType";
import WaitingCard from "./components/WatingCard";
import RecentScratchList from "./components/RecentScratchList";
import { LETTER_MESSAGES } from "./constants";
import { useLoadingStore } from "./stores/useLoadingStore";
import santaGIF from "./assets/santa.gif";

interface SupabaseResponse {
  id: number;
  audio_url: string;
  image_url: string;
  artist_name: string;
  song_title: string;
}

interface SongData {
  id: number;
  audio_url: string;
  image_url: string;
  artist_name: string;
  song_title: string;
}

export const WAITING_TIME = 1 * 1 * 0.1 * 1000;

const App = () => {
  const { isStarted, isRevealed } = useScratchStore();
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [song, setSong] = useState<SongData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoding] = useState(true);
  const [scratchHistory, setScratchHistory] = useState<ScratchHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedHistory] = useState<ScratchHistory | null>(null);
  const [letterOpen, setLetterOpen] = useState(false);
  const [hasReadLetter, setHasReadLetter] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(LETTER_MESSAGES[0]);

  const isCardReady = useLoadingStore((state) => state.isCardReady);

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

  useEffect(() => {
    if (isRevealed) {
      const randomIndex = Math.floor(Math.random() * LETTER_MESSAGES.length);
      setSelectedLetter(LETTER_MESSAGES[randomIndex]);
    }
  }, [isRevealed]);

  useEffect(() => {
    const fetchScratchHistory = async (userId: string) => {
      try {
        const { data: rawData, error } = await supabase
          .from("scratches")
          .select(
            `
            id,
            scratched_at,
            songs (
              id,
              image_url,
              artist_name,
              song_title
            )
          `
          )
          .eq("user_id", userId)
          .order("scratched_at", { ascending: false });

        if (error) throw error;

        const formattedHistory: ScratchHistory[] = (rawData || []).map(
          (item: any) => ({
            id: item.id,
            scratched_at: item.scratched_at,
            song: {
              id: item.songs.id,
              image_url: item.songs.image_url,
              artist_name: item.songs.artist_name,
              song_title: item.songs.song_title,
            },
          })
        );

        setScratchHistory(formattedHistory);
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

  const { playAudio, stopAudio, audioState } = useAudioPlayer(
    song?.audio_url || ""
  );

  const handlePlayPause = async () => {
    if (audioState.isPlaying) {
      stopAudio();
    } else {
      await playAudio();
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      const fetchRandomSong = async () => {
        try {
          const { count } = await supabase
            .from("songs")
            .select("*", { count: "exact", head: true });

          if (!count) throw new Error("No songs available");

          const { data: scratchedSongs, error: scratchError } = await supabase
            .from("scratches")
            .select("song_id")
            .eq("user_id", currentUser?.id);

          if (scratchError) throw scratchError;

          const scratchedSongIds =
            scratchedSongs?.map((scratch) => scratch.song_id) || [];

          const remainingSongs = count - scratchedSongIds.length;
          if (remainingSongs <= 0) {
            const randomOffset = Math.floor(Math.random() * count);
            const { data: songs, error: songError } = await supabase
              .from("songs")
              .select(
                `
                  id,
                  audio_url,
                  image_url,
                  artist_name,
                  song_title
                `
              )
              .range(randomOffset, randomOffset);

            if (songError) throw songError;
            if (!songs || songs.length === 0) throw new Error("No song found");

            const rawSong = songs[0] as SupabaseResponse;
            const formattedSong: SongData = {
              id: rawSong.id,
              audio_url: rawSong.audio_url,
              image_url: rawSong.image_url,
              artist_name: rawSong.artist_name,
              song_title: rawSong.song_title,
            };
            setSong(formattedSong);
          } else {
            const { data: songs, error: songError } = await supabase
              .from("songs")
              .select(
                `
                  id,
                  audio_url,
                  image_url,
                  artist_name,
                  song_title
                `
              )
              .not("id", "in", `(${scratchedSongIds.join(",")})`)
              .order("id", { ascending: true });

            if (songError) throw songError;
            if (!songs || songs.length === 0) throw new Error("No song found");

            const randomIndex = Math.floor(Math.random() * songs.length);
            const rawSong = songs[randomIndex] as SupabaseResponse;
            const formattedSong: SongData = {
              id: rawSong.id,
              audio_url: rawSong.audio_url,
              image_url: rawSong.image_url,
              artist_name: rawSong.artist_name,
              song_title: rawSong.song_title,
            };
            setSong(formattedSong);
          }
        } catch (err) {
          console.error("Error details:", err);
          setError(err instanceof Error ? err.message : "Failed to fetch song");
          throw err;
        } finally {
          setIsLoading(false);
        }
      };

      fetchRandomSong();
    }
  }, [currentUser?.id]);

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
    } else {
      setOverlayOpacity(0);
    }
  }, [isStarted]);

  const handleShare = async () => {
    if (!song) return;

    if (navigator.share) {
      try {
        const shareMessage = `2024년도 저물어가네요.\n마음이 편안한 연말을 보내셨음 좋겠어요.\n크리스마스 선물을 준비했어요.\n언제나 응원할게요.\n\n${window.location.href}`;

        await navigator.share({
          text: shareMessage,
        });
      } catch (error) {
        console.log("공유 실패:", error);
      }
    } else {
      console.log("Web Share API를 지원하지 않는 브라우저입니다.");
    }
    setOpen(false);
  };

  console.log("isCardReady : ", isCardReady);

  const handleLetterClose = () => {
    setLetterOpen(false);
    setHasReadLetter(true);
  };

  const checkWaitingTime = (lastScratchTime: string): boolean => {
    const lastTime = new Date(lastScratchTime).getTime();
    const currentTime = new Date().getTime();
    const waitTime = WAITING_TIME;
    return currentTime - lastTime < waitTime;
  };

  const isWaiting =
    scratchHistory.length > 0 &&
    checkWaitingTime(scratchHistory[0].scratched_at);

  if (isLoading || userLoading || !currentUser || historyLoading || !song) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#1a365d] to-[#2d3748]">
        <div className="flex flex-col items-center gap-4">
          <img
            src={santaGIF}
            alt="Loading..."
            className="w-40 h-40 object-contain"
          />
          <div className="text-lg text-white font-medium tracking-wide">
            선물이 오는 중이에요!
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#1a365d] to-[#2d3748]">
        <div className="text-white text-center">
          <p>에러가 발생했어요.</p>
          <p>아래 링크로 문의주시면 바로 해결해드릴게요!</p>
        </div>
        <a
          href="http://pf.kakao.com/_ztcLG/chat"
          target="_blank"
          rel="noopener noreferrer"
          className="text-yellow-300 hover:text-yellow-200 underline transition-colors"
        >
          카카오톡으로 문의하기
        </a>
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

      <motion.div
        className="fixed inset-0 bg-[#1a365d] pointer-events-none"
        animate={{ opacity: overlayOpacity }}
        transition={{ duration: 0.8 }}
      />

      <div className="relative w-full max-w-lg mx-auto px-4 py-8 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {(!isStarted || isRevealed || isWaiting) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl font-bold mb-2 text-white">
                {isWaiting
                  ? "다음 선물은 아직이에요!"
                  : !isRevealed
                  ? "선물이 도착했어요!"
                  : "메리 크리스마스! 🎄"}
              </h1>
              {isWaiting ? (
                <div className="text-blue-200">
                  <p>
                    {(() => {
                      const totalSeconds = WAITING_TIME / 1000;
                      const totalMinutes = totalSeconds / 60;
                      const totalHours = totalMinutes / 60;

                      if (totalHours >= 1) {
                        return `${Math.floor(
                          totalHours
                        )}시간마다 하나씩 받을 수 있어요.`;
                      } else if (totalMinutes >= 1) {
                        return `${Math.floor(
                          totalMinutes
                        )}분마다 하나씩 받을 수 있어요.`;
                      } else {
                        return `${Math.floor(
                          totalSeconds
                        )}초마다 하나씩 받을 수 있어요.`;
                      }
                    })()}
                  </p>
                  <p>공유하면 바로 뽑을 수도 있답니다!</p>
                </div>
              ) : (
                <p className="text-blue-200">
                  {!isRevealed ? (
                    "포장지를 뜯어서 나만의 캐롤을 뽑아보세요!"
                  ) : (
                    <>
                      {`'${song.artist_name} - ${song.song_title}'`}
                      <br />
                      나를 위한 크리스마스 캐롤이에요!
                    </>
                  )}
                </p>
              )}
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
            {isWaiting ? (
              <WaitingCard
                lastScratchTime={scratchHistory[0].scratched_at}
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
                imageUrl={
                  selectedHistory?.song.image_url ||
                  scratchHistory[0].song.image_url
                }
                songTitle={
                  selectedHistory?.song.song_title ||
                  scratchHistory[0].song.song_title
                }
                artistName={
                  selectedHistory?.song.artist_name ||
                  scratchHistory[0].song.artist_name
                }
                isPlaying={audioState.isPlaying}
                onPlayPause={handlePlayPause}
              />
            ) : (
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
                threshold={30}
                songId={song.id}
                userId={currentUser.id}
              />
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {(!isStarted || isRevealed || isWaiting) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mt-8 text-center w-full px-4"
            >
              {(isWaiting || isRevealed) && (
                <>
                  {isRevealed && !hasReadLetter ? (
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
                        setLetterOpen(true);
                      }}
                    >
                      편지도 준비했어요!
                    </Button>
                  ) : (
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
                      공유하기
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="text"
                sx={{
                  color: "rgb(191 219 254)",
                  "&:hover": { color: "white" },
                  mt: 2,
                }}
                onClick={() => setInfoOpen(true)}
              >
                마이캐롤이 뭔가요?
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full mt-8"
        >
          <RecentScratchList />
        </motion.div>
      </div>

      {/* Letter Modal */}
      <Dialog
        open={letterOpen}
        onClose={handleLetterClose}
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
            fontSize: "1.3rem",
            fontWeight: "bold",
            pt: 4,
          }}
        >
          {selectedLetter.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              color: "rgb(191 219 254)",
              textAlign: "center",
              my: 2,
              display: "flex",
              flexDirection: "column",
              fontSize: {
                xs: "0.875rem", // 모바일에서는 작은 크기
                sm: "1rem", // 태블릿/데스크톱에서는 기본 크기
              },
              lineHeight: {
                xs: 1.5,
                sm: 1.75,
              },
            }}
          >
            {selectedLetter.content.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "center",
            padding: "16px 24px",
          }}
        >
          <Button
            onClick={handleLetterClose}
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
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Modal */}
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
            fontSize: "1.3rem",
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
            <div>크리스마스 캐롤을 선물할 수 있어요!</div>
            <div>소중한 사람에게 마음을 전해보세요</div>
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
            onClick={() => setOpen(false)}
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
            onClick={handleShare}
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

      {/* Info Modal */}
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
            fontSize: "1.3rem",
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
              fontSize: {
                xs: "0.875rem", // 모바일에서는 작은 크기
                sm: "1rem", // 태블릿/데스크톱에서는 기본 크기
              },
              lineHeight: {
                xs: 1.5,
                sm: 1.75,
              },
              gap: 2,
            }}
          >
            <div style={{ gap: 4 }}>
              <div>올해는 유독 춥게 느껴져요.</div>
              <div>캐롤을 듣는 순간만은 따뜻했으면 좋겠습니다.</div>
            </div>
            <div style={{ gap: 4 }}>
              <div>2024년 연말을 맞아</div>
              <div>소중했던 사람들에게 마음을 전해보세요</div>
            </div>
            <div style={{ gap: 4 }}>
              <div>Merry Christmas ~</div>
            </div>
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

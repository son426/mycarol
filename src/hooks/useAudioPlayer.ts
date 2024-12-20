import { useEffect, useRef, useState, useCallback } from "react";

interface AudioPlaybackState {
  isPlaying: boolean;
  hasError: boolean;
  errorMessage?: string;
}

interface AudioPlayerHook {
  playAudio: () => Promise<void>;
  stopAudio: () => void;
  audioState: AudioPlaybackState;
}

export const useAudioPlayer = (audioUrl: string): AudioPlayerHook => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<AudioPlaybackState>({
    isPlaying: false,
    hasError: false,
  });

  // Audio element 초기화를 위한 별도의 effect
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.preload = "auto";

    // 오디오 이벤트 핸들러
    const handleEnded = () => {
      setAudioState((prev) => ({ ...prev, isPlaying: false }));
    };

    const handleError = () => {
      setAudioState({
        isPlaying: false,
        hasError: true,
        errorMessage: "오디오 재생 중 에러가 발생했습니다.",
      });
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audioRef.current = audio;

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [audioUrl]);

  const playAudio = useCallback(async (): Promise<void> => {
    try {
      if (audioRef.current) {
        // 현재 재생 중인 경우 중복 재생 방지
        if (!audioState.isPlaying) {
          await audioRef.current.play();
          setAudioState({
            isPlaying: true,
            hasError: false,
          });
        }
      }
    } catch (error) {
      setAudioState({
        isPlaying: false,
        hasError: true,
        errorMessage:
          error instanceof Error ? error.message : "오디오 재생 실패",
      });
    }
  }, [audioState.isPlaying]);

  const stopAudio = useCallback((): void => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioState({
        isPlaying: false,
        hasError: false,
      });
    }
  }, []);

  return {
    playAudio,
    stopAudio,
    audioState,
  };
};

import { useEffect, useRef, useState } from "react";

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

// 오디오 커스텀 훅
export const useAudioPlayer = (audioUrl: string): AudioPlayerHook => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<AudioPlaybackState>({
    isPlaying: false,
    hasError: false,
  });

  useEffect(() => {
    // 오디오 엘리먼트 생성
    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const playAudio = async (): Promise<void> => {
    try {
      if (audioRef.current) {
        await audioRef.current.play();
        setAudioState({
          isPlaying: true,
          hasError: false,
        });
      }
    } catch (error) {
      setAudioState({
        isPlaying: false,
        hasError: true,
        errorMessage:
          error instanceof Error ? error.message : "오디오 재생 실패",
      });
    }
  };

  const stopAudio = (): void => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioState({
        isPlaying: false,
        hasError: false,
      });
    }
  };

  return {
    playAudio,
    stopAudio,
    audioState,
  };
};

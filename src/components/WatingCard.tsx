import React, { useState, useEffect } from "react";
import { Clock, Play, Pause } from "lucide-react";
import { WAITING_TIME } from "../App";

interface WaitingCardProps {
  lastScratchTime: string;
  width: number;
  height: number;
  imageUrl: string;
  songTitle: string;
  artistName: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  autoPlay?: boolean;
}

const WaitingCard: React.FC<WaitingCardProps> = ({
  lastScratchTime,
  width,
  height,
  imageUrl,
  songTitle,
  artistName,
  isPlaying,
  onPlayPause,
  autoPlay = true,
}) => {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [, setWaitingMessage] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const lastTime = new Date(lastScratchTime).getTime();
      const currentTime = new Date().getTime();
      const waitTime = WAITING_TIME;
      const remaining = waitTime - (currentTime - lastTime);

      // 남은 시간이 0 이하면 페이지 새로고침
      if (remaining <= 0) {
        window.location.reload();
        return;
      }

      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

      setTimeRemaining(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}:${String(seconds).padStart(2, "0")}`
      );

      // 대기 시간 메시지 설정
      const totalSeconds = waitTime / 1000;
      const totalMinutes = totalSeconds / 60;
      const totalHours = totalMinutes / 60;

      if (totalHours >= 1) {
        setWaitingMessage(
          `${Math.floor(totalHours)}시간마다 하나씩 받을 수 있어요.`
        );
      } else if (totalMinutes >= 1) {
        setWaitingMessage(
          `${Math.floor(totalMinutes)}분마다 하나씩 받을 수 있어요.`
        );
      } else {
        setWaitingMessage(
          `${Math.floor(totalSeconds)}초마다 하나씩 받을 수 있어요.`
        );
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [lastScratchTime]);

  // Auto-play effect
  useEffect(() => {
    if (autoPlay && !isPlaying) {
      onPlayPause();
    }
  }, [autoPlay, imageUrl]);

  return (
    <div
      className="relative w-full max-w-lg mx-auto rounded-lg overflow-hidden shadow-lg"
      style={{ width, height }}
    >
      <img
        src={imageUrl}
        alt="Last scratched song"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/30">
        <div className="absolute top-3 right-3 text-right">
          <div className="inline-block backdrop-blur-[1px] px-1.5 py-0.5">
            <p className="text-sm font-medium text-white truncate max-w-[160px]">
              {songTitle}
            </p>
            <p className="text-xs text-white/90 truncate max-w-[160px]">
              {artistName}
            </p>
          </div>
        </div>

        <button
          onClick={onPlayPause}
          className="absolute bottom-3 left-3 bg-black/60 p-2 rounded-full hover:bg-black/70 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </button>

        <div className="absolute bottom-3 right-3 flex items-center bg-black/60 px-3 py-2 rounded-full">
          <Clock className="w-4 h-4 text-white/90 mr-2" />
          <p className="text-sm font-medium text-white">{timeRemaining}</p>
        </div>
      </div>
    </div>
  );
};

export default WaitingCard;

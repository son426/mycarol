import React, { useEffect, useRef, useState } from "react";
import { useScratchStore } from "../stores/useScratchStore";

interface ScratchCardProps {
  imageUrl?: string;
  width?: number;
  height?: number;
  onComplete?: () => void;
  threshold?: number;
}

const ScratchCard: React.FC<ScratchCardProps> = ({
  imageUrl = "/api/placeholder/400/300",
  width = 400,
  height = 300,
  onComplete,
  threshold = 20,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const { startScratch, completeScratch } = useScratchStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setupCanvas = () => {
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
    };

    const drawLayers = () => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = imageUrl;

      image.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(image, 0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#FFA500";
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "destination-out";
      };

      image.onerror = (e) => {
        console.error("Error loading image:", e);
      };
    };

    setupCanvas();
    drawLayers();
  }, [imageUrl, width, height]);

  const calculateScratchedPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;

    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    const totalPixels = pixels.length / 4;

    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];
      if (alpha < 128) {
        transparentPixels++;
      }
    }

    return (transparentPixels / totalPixels) * 100;
  };

  const revealComplete = () => {
    const canvas = canvasRef.current;
    if (!canvas || isCompleted) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsCompleted(true);
    completeScratch(); // Update global state

    // 현재 캔버스의 스크래치 상태 저장
    const scratchMask = ctx.getImageData(0, 0, width, height);

    // 이미지 로드
    const image = new Image();
    image.src = imageUrl;

    let progress = 0;
    const animationDuration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      progress = Math.min(elapsed / animationDuration, 1);

      // 캔버스 초기화
      ctx.clearRect(0, 0, width, height);

      // 배경 이미지 그리기
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(image, 0, 0, width, height);

      // 오렌지색 오버레이 그리기 (페이드아웃 적용)
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgba(255, 165, 0, ${1 - progress})`;
      ctx.fillRect(0, 0, width, height);

      // 스크래치 마스크 적용
      ctx.globalCompositeOperation = "destination-out";
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4 + 3; // alpha channel index
          if (scratchMask.data[i] < 128) {
            ctx.clearRect(x, y, 1, 1);
          }
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // 애니메이션 완료 후 배경 이미지만 표시
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(image, 0, 0, width, height);
        // 스크래치 마스크 다시 적용
        ctx.globalCompositeOperation = "destination-out";
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4 + 3;
            if (scratchMask.data[i] < 128) {
              ctx.clearRect(x, y, 1, 1);
            }
          }
        }
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  };

  const getCoordinates = (
    event: MouseEvent | TouchEvent
  ): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in event) {
      return {
        x: (event.touches[0].clientX - rect.left) * scaleX,
        y: (event.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (isCompleted) return;

    startScratch();

    const coords = getCoordinates(event.nativeEvent);
    setIsDrawing(true);
    setLastPosition(coords);
  };

  const handleMove = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing || isCompleted) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const currentPosition = getCoordinates(event.nativeEvent);

    ctx.lineWidth = 40;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(currentPosition.x, currentPosition.y);
    ctx.stroke();

    setLastPosition(currentPosition);

    const scratchedPercentage = calculateScratchedPercentage();
    if (scratchedPercentage >= threshold) {
      revealComplete();
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  return (
    <div
      className="relative w-full max-w-lg mx-auto"
      style={{
        width,
        height,
        background: `url(${imageUrl})`,
        backgroundSize: "cover",
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 w-full h-full touch-none"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
    </div>
  );
};

export default ScratchCard;

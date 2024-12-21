import React, { useEffect, useRef, useState } from "react";
import { useScratchStore } from "../stores/useScratchStore";
import testImage from "../assets/images/test.jpeg";

interface ScratchCardProps {
  imageUrl?: string;
  width?: number;
  height?: number;
  onComplete?: () => void;
  threshold?: number;
  userId: string;
  songId: number;
}

const ANIMATION_DURATION = 1200;

const ScratchCard: React.FC<ScratchCardProps> = ({
  imageUrl = testImage,
  width: initialWidth = 400,
  height: initialHeight = 300,
  onComplete,
  threshold = 20,
  userId,
  songId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const { startScratch, completeScratch } = useScratchStore();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawGiftPattern = (ctx: CanvasRenderingContext2D) => {
    // 배경 색상 (빨간색 선물상자)
    ctx.fillStyle = "#D42626";
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const ribbonWidth = width * 0.08;
    const bowSize = width * 0.35;

    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // 수직/수평 리본 그리기
    const drawBaseRibbons = () => {
      const ribbonGradient = ctx.createLinearGradient(0, 0, width, height);
      ribbonGradient.addColorStop(0, "#FFD700");
      ribbonGradient.addColorStop(0.5, "#FFC500");
      ribbonGradient.addColorStop(1, "#FFB700");

      ctx.fillStyle = ribbonGradient;
      ctx.fillRect(centerX - ribbonWidth / 2, 0, ribbonWidth, height);
      ctx.fillRect(0, centerY - ribbonWidth / 2, width, ribbonWidth);

      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(centerX - ribbonWidth / 2, 0, ribbonWidth / 3, height);
      ctx.fillRect(0, centerY - ribbonWidth / 2, width, ribbonWidth / 3);
    };

    const drawBow = () => {
      const bowGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        bowSize / 2
      );
      bowGradient.addColorStop(0, "#FFD700");
      bowGradient.addColorStop(0.7, "#FFC500");
      bowGradient.addColorStop(1, "#FFB700");

      const drawLoop = (direction: number) => {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.bezierCurveTo(
          centerX + direction * bowSize * 0.4,
          centerY - bowSize * 0.3,
          centerX + direction * bowSize * 0.7,
          centerY - bowSize * 0.5,
          centerX + direction * bowSize * 0.8,
          centerY - bowSize * 0.15
        );
        ctx.bezierCurveTo(
          centerX + direction * bowSize * 0.7,
          centerY + bowSize * 0.5,
          centerX + direction * bowSize * 0.4,
          centerY + bowSize * 0.3,
          centerX,
          centerY
        );
        ctx.fillStyle = bowGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.bezierCurveTo(
          centerX + direction * bowSize * 0.2,
          centerY - bowSize * 0.15,
          centerX + direction * bowSize * 0.4,
          centerY - bowSize * 0.3,
          centerX + direction * bowSize * 0.5,
          centerY - bowSize * 0.2
        );
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 3;
        ctx.stroke();
      };

      drawLoop(-1);
      drawLoop(1);

      ctx.beginPath();
      ctx.arc(centerX, centerY, ribbonWidth * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = "#FFB700";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(
        centerX - ribbonWidth * 0.3,
        centerY - ribbonWidth * 0.3,
        ribbonWidth * 0.5,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fill();
    };

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    drawBaseRibbons();
    drawBow();
  };

  // 초기 선물 패턴 그리기
  const drawInitialGiftPattern = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      drawGiftPattern(ctx);
      return canvas.toDataURL();
    }
    return "";
  };

  const preloadImage = () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setIsImageLoaded(true);
    };
    img.onerror = () => {
      console.error("Error loading image:", imageUrl);
      window.location.reload();
      img.src = "/api/placeholder/400/300";
    };
    img.src = imageUrl;
  };

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !imageRef.current) return;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
    drawGiftPattern(ctx);
    ctx.globalCompositeOperation = "destination-out";

    setIsInitialized(true);
  };

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 500) {
        const newWidth = Math.min(screenWidth - 40, initialWidth);
        const ratio = newWidth / initialWidth;
        const newHeight = initialHeight * ratio;
        setWidth(newWidth);
        setHeight(newHeight);
      } else {
        setWidth(initialWidth);
        setHeight(initialHeight);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initialWidth, initialHeight]);

  useEffect(() => {
    preloadImage();
  }, [imageUrl]);

  useEffect(() => {
    if (isImageLoaded) {
      initializeCanvas();
    }
  }, [isImageLoaded, width, height]);

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
      if (pixels[i + 3] < 128) transparentPixels++;
    }

    return (transparentPixels / totalPixels) * 100;
  };

  const revealComplete = () => {
    const canvas = canvasRef.current;
    if (!canvas || isCompleted || !imageRef.current) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    setIsRevealing(true);

    const scratchMask = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    const offscreenCtx = offscreenCanvas.getContext("2d");
    if (!offscreenCtx) return;

    offscreenCtx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    const backgroundImage = offscreenCtx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(backgroundImage, 0, 0);

      const overlayData = ctx.createImageData(canvas.width, canvas.height);

      for (let i = 0; i < scratchMask.data.length; i += 4) {
        if (scratchMask.data[i + 3] < 128) {
          overlayData.data[i + 3] = 0;
        } else {
          overlayData.data[i] = 212;
          overlayData.data[i + 1] = 38;
          overlayData.data[i + 2] = 38;
          overlayData.data[i + 3] = Math.round(255 * (1 - eased));
        }
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.putImageData(overlayData, 0, 0);

      if (progress < 1) {
        requestAnimationFrame(animate);
        if (progress > 0.2 && !isCompleted) {
          setIsCompleted(true);
        }
      } else {
        setIsRevealing(false);
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isCompleted) {
      completeScratch(userId, songId);
    }
  }, [isCompleted]);

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
    if (isCompleted || isRevealing || !isImageLoaded) return;

    startScratch();
    const coords = getCoordinates(event.nativeEvent);
    setIsDrawing(true);
    setLastPosition(coords);
  };

  const handleMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isCompleted || isRevealing || !isImageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const currentPosition = getCoordinates(event.nativeEvent);

    ctx.lineWidth = 50;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
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

  // 초기 선물 패턴 이미지 URL 생성
  const giftPatternUrl = drawInitialGiftPattern();

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg mx-auto rounded-lg overflow-hidden shadow-lg"
      style={{
        width,
        height,
        backgroundColor: "#D42626",
      }}
    >
      {/* 초기 선물 패턴 배경 */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${giftPatternUrl})`,
        }}
      />

      {/* 실제 이미지 배경 */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
        style={{
          backgroundImage: `url(${imageUrl})`,
          opacity: isInitialized ? 1 : 0,
        }}
      />

      {/* 스크래치 캔버스 */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ touchAction: "none" }}
        className={`absolute top-0 left-0 w-full h-full touch-none ${
          isRevealing || !isImageLoaded || !isInitialized
            ? "pointer-events-none"
            : ""
        }`}
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

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
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const { startScratch, completeScratch } = useScratchStore();
  const imageRef = useRef<HTMLImageElement | null>(null);

  const drawGiftPattern = (ctx: CanvasRenderingContext2D) => {
    const ribbonWidth = width * 0.1; // 리본 너비

    // 배경 색상 (선물 상자 메인 색상)
    ctx.fillStyle = "#D42626"; // 진한 빨간색
    ctx.fillRect(0, 0, width, height);

    // 리본 그리기
    ctx.fillStyle = "#FFD700"; // 금색 리본

    // 수직 리본
    ctx.fillRect(width / 2 - ribbonWidth / 2, 0, ribbonWidth, height);

    // 수평 리본
    ctx.fillRect(0, height / 2 - ribbonWidth / 2, width, ribbonWidth);

    // 리본 교차점에 원형 장식 추가
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, ribbonWidth * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // 리본 테두리 효과
    ctx.strokeStyle = "#FFB700";
    ctx.lineWidth = 2;

    // 수직 리본 테두리
    ctx.strokeRect(width / 2 - ribbonWidth / 2, 0, ribbonWidth, height);

    // 수평 리본 테두리
    ctx.strokeRect(0, height / 2 - ribbonWidth / 2, width, ribbonWidth);

    // 표면 텍스처 효과 추가
    for (let i = 0; i < width; i += 20) {
      for (let j = 0; j < height; j += 20) {
        if ((i + j) % 40 === 0) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
          ctx.fillRect(i, j, 10, 10);
        }
      }
    }

    // 광택 효과 추가
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const preloadImage = () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setIsImageLoaded(true);
      initializeCanvas();
    };
    img.onerror = () => {
      console.error("Error loading image:", imageUrl);
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
    ctx.drawImage(imageRef.current, 0, 0, width, height);

    // 선물 상자 패턴 그리기
    drawGiftPattern(ctx);

    ctx.globalCompositeOperation = "destination-out";
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
      if (pixels[i + 3] < 128) transparentPixels++;
    }

    return (transparentPixels / totalPixels) * 100;
  };

  const revealComplete = () => {
    const canvas = canvasRef.current;
    if (!canvas || isCompleted || !imageRef.current) return;

    const ctx = canvas.getContext("2d");
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
          // 애니메이션 색상을 선물상자 색상으로 변경
          overlayData.data[i] = 212; // R for #D42626
          overlayData.data[i + 1] = 38; // G
          overlayData.data[i + 2] = 38; // B
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
      console.log("completeScratch : ", userId, songId);
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
    event.preventDefault();
    if (isCompleted || isRevealing || !isImageLoaded) return;

    startScratch();
    const coords = getCoordinates(event.nativeEvent);
    setIsDrawing(true);
    setLastPosition(coords);
  };

  const handleMove = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing || isCompleted || isRevealing || !isImageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const currentPosition = getCoordinates(event.nativeEvent);

    ctx.lineWidth = 40;
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

  return (
    <div
      className="relative w-full max-w-lg mx-auto rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300"
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
        className={`absolute top-0 left-0 w-full h-full touch-none ${
          isRevealing || !isImageLoaded ? "pointer-events-none" : ""
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

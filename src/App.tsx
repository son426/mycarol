import React from "react";
import ScratchCard from "./components/ScratchCard";
import testImage from "./assets/images/test.jpeg";
import { useScratchStore } from "./stores/useScratchStore";

const App: React.FC = () => {
  const { totalAmount, isStarted, isRevealed, currentAmount, confirmWin } =
    useScratchStore();

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white p-4 relative overflow-hidden">
      {/* Background Overlay */}
      <div
        className={`
          fixed inset-0 
          bg-black/70 
          transition-opacity 
          duration-300 
          pointer-events-none
          ${isStarted ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* Content Container */}
      <div className="relative h-full">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button className="text-2xl">←</button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center gap-6">
          {/* Title Container - Always in place */}
          <div className="h-20 flex items-center justify-center">
            {!isStarted && !isRevealed && (
              <h1 className="text-xl text-center transition-opacity">
                오늘의 {totalAmount.toLocaleString()}원 추첨금은?
                <br />
                복권을 긁어보세요
              </h1>
            )}

            {isRevealed && (
              <div className="text-center">
                <h2 className="text-2xl font-bold">당첨됐어요!</h2>
                <p className="text-xl">
                  {currentAmount?.toLocaleString()}원에 당첨되었습니다
                </p>
              </div>
            )}
          </div>

          {/* Scratch Card Container */}
          <div
            className={`
              w-[280px] 
              h-[280px] 
              ${isStarted ? "scale-105" : ""} 
              transition-transform 
              duration-300
            `}
          >
            <ScratchCard imageUrl={testImage} width={400} height={300} />
          </div>

          {/* Bottom Section - Always in place */}
          <div className="w-full max-w-md flex flex-col gap-4 h-40">
            {!isStarted && !isRevealed && (
              <p className="text-center text-gray-400">소비 복권이 뭐예요?</p>
            )}

            {isRevealed && (
              <div className="space-y-4">
                <button
                  className="w-full bg-blue-500 text-white py-4 rounded-xl text-lg font-medium"
                  onClick={confirmWin}
                >
                  확인했어요
                </button>
                <button className="w-full bg-white/10 text-white py-4 rounded-xl text-lg font-medium">
                  친구에게 공유하기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

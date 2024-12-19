import React from "react";
import { Clock } from "lucide-react";
import { ScratchHistory } from "../types/customType";

interface ScratchHistoryProps {
  history: ScratchHistory[];
  onSelectHistory: (scratch: ScratchHistory) => void;
  selectedId?: number;
}

const HistoryCard: React.FC<{
  scratch: ScratchHistory;
  isSelected: boolean;
  onClick: () => void;
}> = ({ scratch, isSelected, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div
      className={`flex items-center space-x-3 rounded-lg p-3 backdrop-blur-sm cursor-pointer transition-colors 
        ${isSelected ? "bg-white/20" : "bg-white/10 hover:bg-white/15"}`}
      onClick={onClick}
    >
      <img
        src={scratch.song.image_url}
        alt={scratch.song.song_title} // 변경
        className="w-12 h-12 object-cover rounded"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {scratch.song.song_title}
        </p>
        <p className="text-xs text-blue-200 truncate">
          {scratch.song.artist_name}
        </p>
      </div>
      <div className="flex items-center text-xs text-blue-200">
        <Clock className="w-3 h-3 mr-1" />
        {formatDate(scratch.scratched_at)}
      </div>
    </div>
  );
};

const ScratchHistoryComponent: React.FC<ScratchHistoryProps> = ({
  history,
  onSelectHistory,
  selectedId,
}) => {
  if (history.length === 0) {
    return <div className="text-center text-blue-200 py-4"></div>;
  }

  return (
    <div className="w-full max-w-md space-y-2 px-4">
      <h2 className="text-lg font-medium text-white mb-4">내가 받은 선물들</h2>
      <div className="space-y-2">
        {history.map((scratch) => (
          <HistoryCard
            key={scratch.id}
            scratch={scratch}
            isSelected={scratch.id === selectedId}
            onClick={() => onSelectHistory(scratch)}
          />
        ))}
      </div>
    </div>
  );
};

export default ScratchHistoryComponent;

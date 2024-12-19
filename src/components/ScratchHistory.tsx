import React from "react";
import { Clock } from "lucide-react";

interface ScratchHistoryProps {
  history: ScratchHistory[];
}

const HistoryCard: React.FC<{ scratch: ScratchHistory }> = ({ scratch }) => {
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
    <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
      <img
        src={scratch.song.image_url}
        alt={scratch.song.original_songs.title}
        className="w-12 h-12 object-cover rounded"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {scratch.song.original_songs.title}
        </p>
        <p className="text-xs text-blue-200 truncate">
          {scratch.song.artists.name}
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
}) => {
  if (history.length === 0) {
    return (
      <div className="text-center text-blue-200 py-4">
        아직 스크래치 기록이 없어요!
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-2 px-4">
      <h2 className="text-lg font-medium text-white mb-4">
        나의 스크래치 기록
      </h2>
      <div className="space-y-2">
        {history.map((scratch) => (
          <HistoryCard key={scratch.id} scratch={scratch} />
        ))}
      </div>
    </div>
  );
};

export default ScratchHistoryComponent;

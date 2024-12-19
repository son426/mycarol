export interface ScratchHistory {
  id: number;
  scratched_at: string;
  song: {
    id: number;
    image_url: string;
    artists: {
      name: string;
    };
    original_songs: {
      title: string;
    };
  };
}
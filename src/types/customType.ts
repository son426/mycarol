export interface ScratchHistory {
  id: number;
  scratched_at: string;
  song: {
    id: number;
    image_url: string;
    artist_name: string;
    song_title: string;
  };
}

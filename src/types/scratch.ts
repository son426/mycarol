export interface ScratchWithSong {
  id: number;
  scratched_at: string;
  songs: {
    id: number;
    image_url: string;
    audio_url: string;
    artists: {
      name: string;
    };
    original_songs: {
      title: string;
    };
  };
}

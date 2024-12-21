// types/schema.ts
export interface User {
  id: string;
  fingerprint: string;
  device_id: string | null;
  local_storage_key: string | null;
  invited_by?: string;
  created_at: string;
}

export interface Song {
  id: number;
  audio_url: string;
  image_url: string;
  artist_name: string;
  song_title: string;
}

export interface Scratch {
  id: number;
  user_id: string;
  song_id: number;
  scratched_at: string;
  songs: Song;
}

export interface ScratchHistoryProps {
  scratches: Scratch[];
}

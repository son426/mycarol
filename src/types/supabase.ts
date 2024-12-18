export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: number;
          name: string;
          profile_image_url: string;
          created_at: string;
        };
        Insert: {
          name: string;
          profile_image_url: string;
          created_at?: string;
        };
      };
      original_songs: {
        Row: {
          id: number;
          title: string;
          image_url: string;
          created_at: string;
        };
        Insert: {
          title: string;
          image_url: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          fingerprint: string;
          device_id: string | null;
          local_storage_key: string | null;
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          fingerprint: string;
          device_id?: string;
          local_storage_key?: string;
          invited_by?: string;
        };
      };
      songs: {
        Row: {
          id: number;
          artist_id: number;
          original_song_id: number;
          audio_url: string;
          image_url: string;
          created_at: string;
        };
        Insert: {
          artist_id: number;
          original_song_id: number;
          audio_url: string;
          image_url: string;
        };
      };
      invitations: {
        Row: {
          id: number;
          inviter_id: string;
          invitee_id: string;
          used_for_scratch: boolean;
          created_at: string;
        };
        Insert: {
          inviter_id: string;
          invitee_id: string;
          used_for_scratch?: boolean;
        };
      };
      scratches: {
        Row: {
          id: number;
          user_id: string;
          song_id: number;
          scratched_at: string;
        };
        Insert: {
          user_id: string;
          song_id: number;
        };
      };
    };
  };
}

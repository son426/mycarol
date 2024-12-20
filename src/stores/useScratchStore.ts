import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";

interface ScratchState {
  isStarted: boolean;
  isRevealed: boolean;
  startScratch: () => void;
  completeScratch: (userId: string, songId: number) => Promise<void>;
  resetScratch: () => void;
}

export const useScratchStore = create<ScratchState>((set) => ({
  isStarted: false,
  isRevealed: false,

  startScratch: () => set({ isStarted: true }),

  completeScratch: async (userId: string, songId: number) => {
    try {
      const { error } = await supabase.from("scratches").insert([
        {
          user_id: userId,
          song_id: songId,
        },
      ]);

      if (error) {
        console.error("Error recording scratch:", error);
        throw error;
      }

      set({ isRevealed: true });
    } catch (error) {
      console.error("Failed to record scratch:", error);
      set({ isRevealed: true });
    }
  },

  resetScratch: () =>
    set({
      isStarted: false,
      isRevealed: false,
    }),
}));

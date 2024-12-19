import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";

interface ScratchState {
  totalAmount: number;
  currentAmount: number | null;
  isStarted: boolean;
  isRevealed: boolean;
  startScratch: () => void;
  completeScratch: (userId: string, songId: number) => Promise<void>;
  confirmWin: () => void;
  resetScratch: () => void;
}

export const useScratchStore = create<ScratchState>((set) => ({
  totalAmount: 1000000,
  currentAmount: 50000, // Default win amount
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
      // Still set isRevealed to true even if recording fails
      // to not block user experience
      set({ isRevealed: true });
    }
  },
  confirmWin: () =>
    set((state) => ({
      totalAmount: state.totalAmount + (state.currentAmount || 0),
      isStarted: false,
      isRevealed: false,
      currentAmount: 50000, // Reset to default win amount
    })),

  resetScratch: () =>
    set({
      isStarted: false,
      isRevealed: false,
      currentAmount: 50000,
    }),
}));

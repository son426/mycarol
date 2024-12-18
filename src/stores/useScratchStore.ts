import { create } from "zustand";

interface ScratchState {
  totalAmount: number;
  currentAmount: number | null;
  isStarted: boolean;
  isRevealed: boolean;
  startScratch: () => void;
  completeScratch: () => void;
  confirmWin: () => void;
  resetScratch: () => void;
}

export const useScratchStore = create<ScratchState>((set) => ({
  totalAmount: 1000000,
  currentAmount: 50000, // Default win amount
  isStarted: false,
  isRevealed: false,

  startScratch: () => set({ isStarted: true }),

  completeScratch: () => set({ isRevealed: true }),

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

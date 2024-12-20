import { create } from "zustand";

type LoadingState = {
  isCardReady: boolean;
  setIsCardReady: (isReady: boolean) => void;
};

export const useLoadingStore = create<LoadingState>((set) => ({
  isCardReady: false,
  setIsCardReady: (ready) => set({ isCardReady: ready }),
}));

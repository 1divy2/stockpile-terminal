import { create } from "zustand";

type SelectedTickerStore = {
  selectedTicker: string;

  setSelectedTicker: (symbol: string) => void;
};

export const useSelectedTickerStore = create<SelectedTickerStore>((set) => ({
  selectedTicker: "NVDA",

  setSelectedTicker: (symbol) =>
    set({
      selectedTicker: symbol,
    }),
}));

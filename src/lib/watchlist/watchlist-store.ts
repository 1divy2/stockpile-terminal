import { create } from "zustand";

type WatchlistStore = {
  symbols: string[];

  addSymbol: (symbol: string) => void;

  removeSymbol: (symbol: string) => void;

  toggleSymbol: (symbol: string) => void;
};

const STORAGE_KEY = "stockpile-watchlist";

function loadWatchlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return ["NVDA", "AAPL", "MSFT", "BTC/USD", "SPY"];
    }

    return JSON.parse(raw);
  } catch {
    return ["NVDA", "AAPL", "MSFT", "BTC/USD", "SPY"];
  }
}

function persist(symbols: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  symbols: loadWatchlist(),

  addSymbol: (symbol) => {
    const exists = get().symbols.includes(symbol);

    if (exists) {
      return;
    }

    const updated = [...get().symbols, symbol];

    persist(updated);

    set({
      symbols: updated,
    });
  },

  removeSymbol: (symbol) => {
    const updated = get().symbols.filter((s) => s !== symbol);

    persist(updated);

    set({
      symbols: updated,
    });
  },

  toggleSymbol: (symbol) => {
    const exists = get().symbols.includes(symbol);

    if (exists) {
      get().removeSymbol(symbol);
    } else {
      get().addSymbol(symbol);
    }
  },
}));

import { create } from "zustand";

import { buildMarketEngine, MarketEngine } from "@/lib/market/market-engine";

import { MarketTicker } from "./market-types";
export type { MarketTicker } from "./market-types";
import { wsFeed, type TradeEvent } from "./websocket-engine";

type MarketState = {
  tickers: MarketTicker[];

  engine: MarketEngine;

  watchlist: string[];

  selectedTicker: string;

  lastUpdated: number | null;

  marketStatus: "PRE_MARKET" | "OPEN" | "AFTER_HOURS" | "CLOSED";

  setTickers: (tickers: MarketTicker[]) => void;

  setSelectedTicker: (symbol: string) => void;

  setMarketStatus: (status: "PRE_MARKET" | "OPEN" | "AFTER_HOURS" | "CLOSED") => void;
  
  applyTrade: (trade: TradeEvent) => void;
};

export const useMarketStore = create<MarketState>((set) => ({
  tickers: [],

  engine: buildMarketEngine([]),

  watchlist: ["NVDA", "MSFT", "AAPL", "AMZN", "META", "TSLA"],

  selectedTicker: "NVDA",

  lastUpdated: null,

  marketStatus: "CLOSED",

  setTickers: (tickers) =>
    set({
      tickers,

      engine: buildMarketEngine(tickers),

      lastUpdated: Date.now(),
    }),

  setSelectedTicker: (symbol) =>
    set({
      selectedTicker: symbol,
    }),

  setMarketStatus: (status) =>
    set({
      marketStatus: status,
    }),
    
  applyTrade: (trade) => {
    set((state) => {
      const idx = state.tickers.findIndex(t => t.symbol === trade.symbol);
      if (idx === -1) return state; // Ignore unknown symbols
      
      const prev = state.tickers[idx];
      const newTickers = [...state.tickers];
      
      // Calculate new change percentage based on original open (which we infer or approximate)
      // Since we don't have true 'open', we use the difference between price and change to find open
      const openPrice = prev.price / (1 + prev.changePct / 100);
      const newChangePct = ((trade.price - openPrice) / openPrice) * 100;
      
      newTickers[idx] = {
        ...prev,
        price: trade.price,
        changePct: newChangePct,
        volume: (prev.volume || 0) + trade.volume
      };
      
      return {
        tickers: newTickers,
        engine: buildMarketEngine(newTickers),
        lastUpdated: trade.timestamp
      };
    });
  }
}));

// Connect WebSocket when store is loaded
if (typeof window !== "undefined") {
  // Lazy import to avoid circular dependency at module load time
  let checkOrders: ((prices: Record<string, number>) => void) | null = null;
  
  wsFeed.setCallback((trade) => {
    useMarketStore.getState().applyTrade(trade);
    
    // Auto-execute pending orders when prices change
    if (!checkOrders) {
      import("@/lib/paper-trading/paper-trading-store").then((mod) => {
        checkOrders = (prices) => mod.usePaperTradingStore.getState().checkPendingOrders(prices);
      });
    }
    if (checkOrders) {
      checkOrders({ [trade.symbol]: trade.price });
    }
  });
  wsFeed.connect();
}

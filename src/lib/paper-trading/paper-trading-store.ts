import { create } from "zustand";
import { UserDataService } from "@/services/user-data-service";
import { useAuthStore } from "@/store/auth-store";
import { AlpacaService } from "@/services/alpaca-service";

export type OrderType = "MARKET" | "LIMIT" | "STOP_LOSS";

export type PendingOrder = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  shares: number;
  orderType: OrderType;
  targetPrice: number;
  createdAt: number;
  status: "PENDING" | "FILLED" | "CANCELLED";
};

export type PaperPosition = {
  symbol: string;
  shares: number;
  avgPrice: number;
};

type PaperTradingState = {
  brokerageMode: "PAPER" | "LIVE";
  cash: number;
  positions: PaperPosition[];
  history: {
    id: string;
    type: "BUY" | "SELL";
    symbol: string;
    shares: number;
    price: number;
    timestamp: number;
    orderType?: OrderType;
  }[];
  pendingOrders: PendingOrder[];

  toggleBrokerageMode: () => void;
  initialize: () => Promise<void>;
  buy: (symbol: string, shares: number, price: number) => Promise<void>;
  sell: (symbol: string, shares: number, price: number) => Promise<void>;
  placeLimitOrder: (symbol: string, side: "BUY" | "SELL", shares: number, targetPrice: number) => void;
  placeStopLoss: (symbol: string, shares: number, targetPrice: number) => void;
  cancelOrder: (orderId: string) => void;
  checkPendingOrders: (currentPrices: Record<string, number>) => void;
};

const STORAGE_KEY = "stockpile-paper-trading";

export const usePaperTradingStore = create<PaperTradingState>((set, get) => ({
  brokerageMode: "PAPER",
  cash: 10000000,
  positions: [],
  history: [],
  pendingOrders: [],

  toggleBrokerageMode: () => {
    set(s => ({ brokerageMode: s.brokerageMode === "PAPER" ? "LIVE" : "PAPER" }));
  },

  initialize: async () => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem(STORAGE_KEY);
    let parsedLocal: any = null;
    if (saved) {
      try {
        parsedLocal = JSON.parse(saved);
      } catch (e) {}
    }

    const user = useAuthStore.getState().user;
    if (user) {
      const cloudState = await UserDataService.getPaperTrading(user.uid);
      if (cloudState) {
        // Safely determine which state is newer by comparing transaction history length
        const localHistoryLen = parsedLocal?.history?.length || 0;
        const cloudHistoryLen = cloudState.history?.length || 0;

        if (parsedLocal && localHistoryLen > cloudHistoryLen) {
          if (!parsedLocal.upgradedTo10M) {
            parsedLocal.cash += 9900000;
            parsedLocal.upgradedTo10M = true;
          }
          // Fix for the double-bonus glitch
          if (parsedLocal.cash > 15000000) {
            parsedLocal.cash -= 9900000;
          }
          set(parsedLocal);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedLocal));
          UserDataService.syncPaperTrading(user.uid, parsedLocal);
          return;
        }

        if (!cloudState.upgradedTo10M) {
          cloudState.cash += 9900000; // Add the difference from 100k to 10M
          cloudState.upgradedTo10M = true;
        }
        // Fix for the double-bonus glitch
        if (cloudState.cash > 15000000) {
          cloudState.cash -= 9900000;
        }
        set({
          cash: cloudState.cash,
          positions: cloudState.positions,
          history: cloudState.history,
          pendingOrders: cloudState.pendingOrders || [],
          upgradedTo10M: cloudState.upgradedTo10M
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
        UserDataService.syncPaperTrading(user.uid, cloudState);
        return;
      }
    }

    if (!parsedLocal) return;

    try {
      if (!parsedLocal.upgradedTo10M) {
        parsedLocal.cash += 9900000; // Add the difference from 100k to 10M
        parsedLocal.upgradedTo10M = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedLocal));
      }
      set(parsedLocal);
      if (user) {
        UserDataService.syncPaperTrading(user.uid, parsedLocal);
      }
    } catch {
      console.error("Failed to load paper trading state");
    }
  },

  buy: async (symbol, shares, price) => {
    const state = get();
    if (state.brokerageMode === "LIVE") {
      await AlpacaService.submitLiveOrder(symbol, shares, "BUY", "MARKET", "DAY");
    }
    const cost = shares * price;
    if (cost > state.cash) return;

    const existing = state.positions.find((p) => p.symbol === symbol);
    let updatedPositions = [...state.positions];

    if (existing) {
      updatedPositions = state.positions.map((p) => {
        if (p.symbol !== symbol) return p;
        const totalShares = p.shares + shares;
        const newAvg = (p.avgPrice * p.shares + shares * price) / totalShares;
        return { ...p, shares: totalShares, avgPrice: Number(newAvg.toFixed(2)) };
      });
    } else {
      updatedPositions.push({ symbol, shares, avgPrice: Number(price.toFixed(2)) });
    }

    const next = {
      cash: Number((state.cash - cost).toFixed(2)),
      positions: updatedPositions,
      history: [
        {
          id: crypto.randomUUID(),
          type: "BUY" as const,
          symbol,
          shares,
          price,
          timestamp: Date.now(),
          orderType: "MARKET" as OrderType,
        },
        ...state.history,
      ],
      pendingOrders: state.pendingOrders,
      upgradedTo10M: state.upgradedTo10M,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    set(next);

    const user = useAuthStore.getState().user;
    if (user) {
      await UserDataService.syncPaperTrading(user.uid, next);
    }
  },

  sell: async (symbol, shares, price) => {
    const state = get();
    if (state.brokerageMode === "LIVE") {
      await AlpacaService.submitLiveOrder(symbol, shares, "SELL", "MARKET", "DAY");
    }
    const existing = state.positions.find((p) => p.symbol === symbol);
    if (!existing || existing.shares < shares) return;

    const proceeds = shares * price;
    const updatedPositions = state.positions
      .map((p) => {
        if (p.symbol !== symbol) return p;
        return { ...p, shares: p.shares - shares };
      })
      .filter((p) => p.shares > 0);

    const next = {
      cash: Number((state.cash + proceeds).toFixed(2)),
      positions: updatedPositions,
      history: [
        {
          id: crypto.randomUUID(),
          type: "SELL" as const,
          symbol,
          shares,
          price,
          timestamp: Date.now(),
          orderType: "MARKET" as OrderType,
        },
        ...state.history,
      ],
      pendingOrders: state.pendingOrders,
      upgradedTo10M: state.upgradedTo10M,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    set(next);

    const user = useAuthStore.getState().user;
    if (user) {
      await UserDataService.syncPaperTrading(user.uid, next);
    }
  },

  placeLimitOrder: (symbol, side, shares, targetPrice) => {
    const order: PendingOrder = {
      id: crypto.randomUUID(),
      symbol,
      side,
      shares,
      orderType: "LIMIT",
      targetPrice,
      createdAt: Date.now(),
      status: "PENDING",
    };

    set((state) => ({
      pendingOrders: [...state.pendingOrders, order],
    }));
  },

  placeStopLoss: (symbol, shares, targetPrice) => {
    const order: PendingOrder = {
      id: crypto.randomUUID(),
      symbol,
      side: "SELL",
      shares,
      orderType: "STOP_LOSS",
      targetPrice,
      createdAt: Date.now(),
      status: "PENDING",
    };

    set((state) => ({
      pendingOrders: [...state.pendingOrders, order],
    }));
  },

  cancelOrder: (orderId) => {
    set((state) => ({
      pendingOrders: state.pendingOrders.map((o) =>
        o.id === orderId ? { ...o, status: "CANCELLED" as const } : o
      ),
    }));
  },

  checkPendingOrders: (currentPrices) => {
    const state = get();
    const activePending = state.pendingOrders.filter((o) => o.status === "PENDING");

    for (const order of activePending) {
      const currentPrice = currentPrices[order.symbol];
      if (currentPrice === undefined) continue;

      let shouldFill = false;

      if (order.orderType === "LIMIT") {
        if (order.side === "BUY" && currentPrice <= order.targetPrice) {
          shouldFill = true;
        }
        if (order.side === "SELL" && currentPrice >= order.targetPrice) {
          shouldFill = true;
        }
      }

      if (order.orderType === "STOP_LOSS") {
        if (currentPrice <= order.targetPrice) {
          shouldFill = true;
        }
      }

      if (shouldFill) {
        // Execute the order
        if (order.side === "BUY") {
          get().buy(order.symbol, order.shares, currentPrice);
        } else {
          get().sell(order.symbol, order.shares, currentPrice);
        }

        // Mark as filled
        set((s) => ({
          pendingOrders: s.pendingOrders.map((o) =>
            o.id === order.id ? { ...o, status: "FILLED" as const } : o
          ),
        }));
      }
    }
  },
}));

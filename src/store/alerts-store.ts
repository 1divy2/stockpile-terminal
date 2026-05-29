import { create } from "zustand";
import { UserDataService } from "@/services/user-data-service";
import { useAuthStore } from "@/store/auth-store";

export type AlertCondition = "Price Above" | "Price Below" | "Volume Spike";

export type CustomAlert = {
  id: string;
  symbol: string;
  condition: AlertCondition;
  target: number;
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
};

export type NotificationChannel = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

interface AlertsState {
  alerts: CustomAlert[];
  channels: NotificationChannel[];
  addAlert: (alert: Omit<CustomAlert, "id" | "createdAt" | "isActive">) => void;
  removeAlert: (id: string) => void;
  markTriggered: (id: string, time?: number) => void;
  resetAlert: (id: string) => void;
  toggleChannel: (id: string) => void;
  initialize: () => Promise<void>;
}

const STORAGE_KEY = "stockpile-alerts";

export const useAlertsStore = create<AlertsState>((set, get) => {
  const syncState = (state: AlertsState) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ alerts: state.alerts, channels: state.channels }));
    }
    const user = useAuthStore.getState().user;
    if (user) {
      UserDataService.syncAlerts(user.uid, { alerts: state.alerts, channels: state.channels });
    }
  };

  return {
    alerts: [],
      channels: [
        { id: "price", label: "Price Alerts", description: "All tickers", enabled: true },
        { id: "large_moves", label: "Large Moves (>2%)", description: "High severity", enabled: true },
        { id: "portfolio", label: "Portfolio Positions", description: "Active holdings", enabled: true },
        { id: "market_session", label: "Market Session", description: "Open/Close events", enabled: true },
      { id: "news", label: "News Headlines", description: "Yahoo Finance RSS", enabled: false },
    ],
    
    initialize: async () => {
      if (typeof window === "undefined") return;

      const user = useAuthStore.getState().user;
      if (user) {
        const cloudState = await UserDataService.getAlerts(user.uid);
        if (cloudState) {
          const saved = localStorage.getItem(STORAGE_KEY);
          let parsedLocal: any = null;
          if (saved) {
            try { parsedLocal = JSON.parse(saved); } catch (e) {}
          }
          
          const localAlerts = parsedLocal?.alerts || [];
          const cloudAlerts = cloudState.alerts || [];

          if (localAlerts.length > cloudAlerts.length) {
            set({ alerts: localAlerts, channels: parsedLocal?.channels || get().channels });
            UserDataService.syncAlerts(user.uid, { alerts: localAlerts, channels: parsedLocal?.channels || get().channels });
            return;
          }

          set({ alerts: cloudAlerts, channels: cloudState.channels || get().channels });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
          return;
        }
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      try {
        const parsed = JSON.parse(saved);
        set({ alerts: parsed.alerts || [], channels: parsed.channels || get().channels });
        if (user) {
          UserDataService.syncAlerts(user.uid, parsed);
        }
      } catch (e) {
        console.error("Failed to load alerts state", e);
      }
    },
    
    addAlert: (alert) => {
      set((state) => {
        const next = {
          ...state,
          alerts: [
            ...state.alerts,
            {
              ...alert,
              id: crypto.randomUUID(),
              isActive: true,
              createdAt: Date.now(),
            },
          ],
        };
        syncState(next);
        return next;
      });
    },

    removeAlert: (id) => {
      set((state) => {
        const next = { ...state, alerts: state.alerts.filter((a) => a.id !== id) };
        syncState(next);
        return next;
      });
    },

    markTriggered: (id, time = Date.now()) => {
      set((state) => {
        const next = {
          ...state,
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, isActive: false, triggeredAt: time } : a
          ),
        };
        syncState(next);
        return next;
      });
    },

    resetAlert: (id) => {
      set((state) => {
        const next = {
          ...state,
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, isActive: true, triggeredAt: undefined } : a
          ),
        };
        syncState(next);
        return next;
      });
    },

    toggleChannel: (id) => {
      set((state) => {
        const next = {
          ...state,
          channels: state.channels.map((c) =>
            c.id === id ? { ...c, enabled: !c.enabled } : c
          ),
        };
        syncState(next);
        return next;
      });
    },
  };
});

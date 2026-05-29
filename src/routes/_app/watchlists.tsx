import { createFileRoute } from "@tanstack/react-router";

import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/widgets/Primitives";

import { Sparkline } from "@/components/widgets/Sparkline";

import { Pill } from "@/components/widgets/AIInsightCard";

import { useMarketTickers } from "@/hooks/market/useMarketTickers";

import { useMarketStore } from "@/lib/market/market-state";
import { Star, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/components/widgets/ToastProvider";
import { UserDataService } from "@/services/user-data-service";
import { useAuthStore } from "@/store/auth-store";

export const Route = createFileRoute("/_app/watchlists")({
  head: () => ({
    meta: [
      {
        title: "Watchlists · StockPile",
      },
    ],
  }),
  component: Watchlists,
});

type Watchlist = {
  name: string;
  syms: string[];
  tone: "positive" | "negative" | "warn" | "cyan";
};

const DEFAULT_LISTS: Watchlist[] = [
  {
    name: "AI Infrastructure",
    syms: ["NVDA", "AVGO", "AMD", "PLTR", "SNOW"],
    tone: "cyan",
  },
  {
    name: "Mega-Cap Tech",
    syms: ["AAPL", "MSFT", "GOOGL", "META", "AMZN"],
    tone: "positive",
  },
  {
    name: "Earnings Week",
    syms: ["TSLA", "COIN", "SHOP", "UNH"],
    tone: "warn",
  },
];

function Watchlists() {
  const { pushToast } = useToast();
  useMarketTickers();

  const liveTickers = useMarketStore((s) => s.tickers);

  const selectedTicker = useMarketStore((s) => s.selectedTicker);

  const setSelectedTicker = useMarketStore((s) => s.setSelectedTicker);

  const [lists, setLists] = useState<Watchlist[]>(() => {
    if (typeof window === "undefined") return DEFAULT_LISTS;
    const saved = localStorage.getItem("stockpile-watchlists");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_LISTS;
      }
    }
    return DEFAULT_LISTS;
  });

  useEffect(() => {
    async function loadCloud() {
      const user = useAuthStore.getState().user;
      if (user) {
        const cloudLists = await UserDataService.getWatchlists(user.uid);
        if (cloudLists) {
          // Compare the total number of tickers in local vs cloud to determine which is newer
          const getTickerCount = (lists: Watchlist[]) => lists.reduce((acc, list) => acc + list.syms.length, 0);
          
          setLists((currentLocalLists) => {
            const localCount = getTickerCount(currentLocalLists);
            const cloudCount = getTickerCount(cloudLists);
            
            // If local has more data, prefer local and sync it up
            if (localCount > cloudCount) {
              UserDataService.syncWatchlists(user.uid, currentLocalLists);
              return currentLocalLists;
            }
            
            return cloudLists;
          });
        }
      }
    }
    loadCloud();
  }, []);

  useEffect(() => {
    localStorage.setItem("stockpile-watchlists", JSON.stringify(lists));
    const user = useAuthStore.getState().user;
    if (user) {
      UserDataService.syncWatchlists(user.uid, lists);
    }
  }, [lists]);

  const tickerMap = useMemo(() => {
    return Object.fromEntries(liveTickers.map((t) => [t.symbol, t]));
  }, [liveTickers]);

  return (
    <div>
      <PageHeader
        eyebrow="Watchlists"
        title="Custom Watchlists"
        subtitle={`${lists.length} lists · saved to local storage`}
        right={
          <button
            onClick={() => {
              const name = `Watchlist ${lists.length + 1}`;

              setLists((prev) => [
                ...prev,
                {
                  name,
                  syms: [],
                  tone: "cyan",
                },
              ]);
            }}
            className="rounded-md bg-primary text-primary-foreground px-3 h-9 text-[12px] flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            New list
          </button>
        }
      />

      <div className="grid grid-cols-12 gap-3">
        {lists.map((list, idx) => (
          <div key={list.name} className="col-span-12 xl:col-span-4 panel-elevated p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warn" />

                <h3 className="text-[13px] font-semibold">{list.name}</h3>
              </div>

              <div className="flex items-center gap-2">
                <Pill tone={list.tone}>{list.syms.length} assets</Pill>
                <button
                  onClick={() => setLists(prev => prev.filter((_, i) => i !== idx))}
                  className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                  title="Delete Watchlist"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {list.syms.map((symbol, i) => {
                const ticker = tickerMap[symbol];

                if (!ticker) {
                  return null;
                }

                const active = selectedTicker === symbol;

                return (
                  <div
                    key={symbol}
                    onClick={() => setSelectedTicker(symbol)}
                    className={`group flex w-full items-center gap-3 rounded-md border border-border/60 p-2.5 text-left cursor-pointer transition hover:bg-panel-elevated/60 ${
                      active ? "bg-panel-elevated/60 border-cyan/40" : ""
                    }`}
                  >
                    <div>
                      <div className="font-mono text-[12px] text-cyan">{symbol}</div>

                      <div className="text-[10px] text-muted-foreground">
                        ${ticker.price.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex-1">
                      <Sparkline
                        seed={idx * 7 + i + 3}
                        height={28}
                        color={ticker.changePct >= 0 ? "var(--color-positive)" : "var(--color-negative)"}
                      />
                    </div>

                    <div
                      className={`font-mono text-[11px] tabular-nums ${
                        ticker.changePct >= 0 ? "text-positive" : "text-negative"
                      }`}
                    >
                      {ticker.changePct >= 0 ? "+" : ""}
                      {ticker.changePct.toFixed(2)}%
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLists((prev) => {
                          const updated = [...prev];
                          updated[idx] = { ...updated[idx], syms: updated[idx].syms.filter((s) => s !== symbol) };
                          return updated;
                        });
                      }}
                      className="ml-2 flex h-5 w-5 items-center justify-center rounded bg-negative/10 text-negative opacity-0 transition hover:bg-negative/20 group-hover:opacity-100"
                    >
                      <span className="text-[14px]">×</span>
                    </button>
                  </div>
                );
              })}

              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Add symbol (e.g. MSFT)..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value) {
                      const sym = e.currentTarget.value.toUpperCase();
                      if (tickerMap[sym]) {
                        setLists((prev) => {
                          const updated = [...prev];
                          if (!updated[idx].syms.includes(sym)) {
                            updated[idx] = { ...updated[idx], syms: [...updated[idx].syms, sym] };
                          }
                          return updated;
                        });
                        e.currentTarget.value = "";
                        pushToast({ title: `Added ${sym} to ${list.name}`, tone: "success" });
                      } else {
                        pushToast({ title: `Symbol ${sym} not found`, tone: "error" });
                      }
                    }
                  }}
                  className="w-full rounded-md border border-border/60 bg-panel/40 px-3 py-2 text-[12px] font-mono outline-none focus:border-cyan/50"
                />
              </div>
            </div>

            <div className="mt-3 rounded-md bg-panel border border-border/60 p-2.5 text-[11.5px] text-muted-foreground">
              <span className="text-cyan font-mono">WATCHLIST ·</span> Click a ticker to select it
              across the app. Lists are synced to the cloud.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

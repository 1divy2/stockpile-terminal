import { Activity, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import { useMarketStore } from "@/lib/market/market-state";
import { usePaperTradingStore } from "@/lib/paper-trading/paper-trading-store";
import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { computeMarketBreadth } from "@/utils/market-helpers";
import { formatRelativeTime, formatCurrency, getChangeColor } from "@/utils/format";
import { cn } from "@/lib/utils";

export function RightPanel() {
  useMarketTickers();
  const tickers = useMarketStore((s) => s.tickers);
  const lastUpdated = useMarketStore((s) => s.lastUpdated);
  const { history } = usePaperTradingStore();

  const breadth = computeMarketBreadth(tickers);

  // Top movers from live data
  const sorted = [...tickers].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  const topMovers = sorted.slice(0, 4);

  return (
    <aside className="hidden xl:flex w-[320px] shrink-0 flex-col border-l border-border/60 bg-sidebar/60 backdrop-blur-xl">
      <div className="px-4 h-14 flex items-center justify-between border-b border-border/60">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan" />
          <span className="text-[13px] font-semibold tracking-tight">Market Activity</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {lastUpdated ? formatRelativeTime(lastUpdated) : "—"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Market Breadth */}
        <section>
          <div className="px-1 mb-2 flex items-center gap-2">
            <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Market Breadth
            </span>
          </div>
          <div className="panel p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-positive font-medium">
                ↑ {breadth.positive} advancing
              </span>
              <span className="text-[12px] text-negative font-medium">
                {breadth.negative} declining ↓
              </span>
            </div>
            <div className="h-2 rounded-full bg-panel-elevated overflow-hidden flex">
              <div
                className="bg-positive/70 transition-all duration-500"
                style={{
                  width: breadth.total > 0 ? `${(breadth.positive / breadth.total) * 100}%` : "50%",
                }}
              />
              <div
                className="bg-negative/70 transition-all duration-500"
                style={{
                  width: breadth.total > 0 ? `${(breadth.negative / breadth.total) * 100}%` : "50%",
                }}
              />
            </div>
          </div>
        </section>

        {/* Top Movers */}
        <section>
          <div className="px-1 mb-2 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-warn" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Top Movers
            </span>
          </div>
          <div className="space-y-1.5">
            {topMovers.map((t) => (
              <div key={t.symbol} className="panel p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {t.changePct >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-positive" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-negative" />
                    )}
                    <span className="text-[12px] font-medium">{t.symbol}</span>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-mono tabular-nums",
                      getChangeColor(t.changePct),
                    )}
                  >
                    {t.changePct > 0 ? "+" : ""}
                    {t.changePct.toFixed(2)}%
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {t.name || t.symbol} · $
                  {t.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trade History */}
        <section>
          <div className="px-1 mb-2 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-positive" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Recent Trades
            </span>
          </div>
          {history.length === 0 ? (
            <div className="panel p-3 text-center">
              <div className="text-[12px] text-muted-foreground">No trades yet</div>
              <div className="text-[11px] text-muted-foreground/60 mt-1">
                Use the Markets page to start paper trading
              </div>
            </div>
          ) : (
            <div className="panel p-2.5 font-mono text-[10.5px] leading-relaxed space-y-1">
              {history.slice(0, 10).map((trade) => (
                <div key={trade.id} className="flex gap-2">
                  <span className="text-muted-foreground/70">
                    {formatRelativeTime(trade.timestamp)}
                  </span>
                  <span className={cn(trade.type === "BUY" ? "text-positive" : "text-negative")}>
                    {trade.type}
                  </span>
                  <span className="text-foreground/80 truncate">
                    {trade.shares} {trade.symbol} @ {formatCurrency(trade.price)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}

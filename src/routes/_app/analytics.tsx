import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, MetricCard } from "@/components/widgets/Primitives";
import { AreaPriceChart } from "@/components/widgets/Charts";
import { Pill } from "@/components/widgets/AIInsightCard";
import { BarChart3, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { useMarketStore } from "@/lib/market/market-state";
import { computeMarketBreadth, getSectorPerformance } from "@/utils/market-helpers";
import { formatPercent, getChangeColor } from "@/utils/format";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics · StockPile" }] }),
  component: Analytics,
});

function Analytics() {
  useMarketTickers();

  const liveTickers = useMarketStore((s) => s.tickers);

  const breadth = computeMarketBreadth(liveTickers);
  const sectors = getSectorPerformance(liveTickers);

  const avgMove = liveTickers.length
    ? liveTickers.reduce((s, t) => s + t.changePct, 0) / liveTickers.length
    : 0;

  const maxGainer = liveTickers.length
    ? liveTickers.reduce((a, b) => (b.changePct > a.changePct ? b : a))
    : null;

  const maxLoser = liveTickers.length
    ? liveTickers.reduce((a, b) => (b.changePct < a.changePct ? b : a))
    : null;

  // Correlation matrix from real tickers
  const matrixTickers = liveTickers.slice(0, 7);

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Market Analytics"
        subtitle={`${liveTickers.length} instruments · breadth analysis · sector breakdown · correlation`}
        right={<Pill tone={avgMove >= 0 ? "positive" : "negative"}>AVG {formatPercent(avgMove)}</Pill>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Average Move"
          value={formatPercent(avgMove)}
          accent={avgMove >= 0 ? "positive" : "negative"}
          icon={<BarChart3 className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Advancing"
          value={`${breadth.positive}`}
          accent="positive"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Declining"
          value={`${breadth.negative}`}
          accent="negative"
          icon={<TrendingDown className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Sectors"
          value={`${sectors.length}`}
          accent="cyan"
          icon={<Activity className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* Top movers */}
        <div className="col-span-12 xl:col-span-7 panel-elevated p-4">
          <h3 className="text-[13px] font-semibold mb-3">Sector Performance</h3>
          <div className="space-y-2">
            {sectors.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="w-28 text-[12px] text-muted-foreground truncate">{s.name}</div>
                <div className="flex-1 h-7 rounded-md bg-panel-elevated overflow-hidden relative">
                  <div
                    className={`h-full rounded-md transition-all duration-500 ${
                      s.avgChange >= 0 ? "bg-positive/25" : "bg-negative/25"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.abs(s.avgChange) * 15 + 8)}%`,
                    }}
                  />
                  <span
                    className={`absolute inset-y-0 left-2 flex items-center text-[11px] font-mono ${getChangeColor(s.avgChange)}`}
                  >
                    {formatPercent(s.avgChange)}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground w-24 text-right">
                  {s.tickerCount} · {s.topMover}
                </div>
              </div>
            ))}
          </div>

          {/* Best / Worst */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {maxGainer && (
              <div className="rounded-md border border-positive/20 bg-positive/5 p-3">
                <div className="text-[10px] font-mono text-muted-foreground">BEST PERFORMER</div>
                <div className="text-[14px] font-semibold text-positive mt-1">{maxGainer.symbol}</div>
                <div className="text-[12px] font-mono text-positive">
                  {formatPercent(maxGainer.changePct)}
                </div>
              </div>
            )}
            {maxLoser && (
              <div className="rounded-md border border-negative/20 bg-negative/5 p-3">
                <div className="text-[10px] font-mono text-muted-foreground">WORST PERFORMER</div>
                <div className="text-[14px] font-semibold text-negative mt-1">{maxLoser.symbol}</div>
                <div className="text-[12px] font-mono text-negative">
                  {formatPercent(maxLoser.changePct)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Correlation matrix */}
        <div className="col-span-12 xl:col-span-5 panel-elevated p-4">
          <h3 className="text-[13px] font-semibold mb-3">Correlation Matrix (Approximate)</h3>
          <div className="text-[10px] text-muted-foreground mb-2">
            Based on same-session co-movement. Higher values indicate similar direction today.
          </div>
          {matrixTickers.length > 0 && (
            <div className="overflow-x-auto">
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: `repeat(${matrixTickers.length}, 1fr)` }}
              >
                {matrixTickers.flatMap((r) =>
                  matrixTickers.map((c) => {
                    // Approximate correlation from sign agreement + magnitude similarity
                    const v =
                      r.symbol === c.symbol
                        ? 1
                        : (() => {
                            const sameDir = r.changePct >= 0 === c.changePct >= 0 ? 0.4 : 0;
                            const magSim = 1 - Math.min(1, Math.abs(r.changePct - c.changePct) / 5);
                            return Math.min(1, sameDir + magSim * 0.6);
                          })();
                    return (
                      <div
                        key={`${r.symbol}-${c.symbol}`}
                        className="aspect-square rounded grid place-items-center text-[9px] font-mono"
                        style={{
                          background: `color-mix(in oklab, var(--color-cyan) ${v * 70}%, transparent)`,
                        }}
                        title={`${r.symbol} × ${c.symbol}`}
                      >
                        {v.toFixed(2)}
                      </div>
                    );
                  }),
                )}
              </div>
              <div className="flex gap-1 mt-2 text-[9px] font-mono text-muted-foreground">
                {matrixTickers.map((t) => (
                  <div key={t.symbol} className="flex-1 text-center">
                    {t.symbol}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

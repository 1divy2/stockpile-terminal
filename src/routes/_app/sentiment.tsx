import { createFileRoute } from "@tanstack/react-router";
import { MetricCard, PageHeader } from "@/components/widgets/Primitives";
import { PredictionChart } from "@/components/widgets/Charts";
import { Pill } from "@/components/widgets/AIInsightCard";
import { Activity, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketStore } from "@/lib/market/market-state";
import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { computeMarketBreadth, getSectorPerformance } from "@/utils/market-helpers";
import { formatPercent, getChangeColor } from "@/utils/format";

export const Route = createFileRoute("/_app/sentiment")({
  head: () => ({ meta: [{ title: "Sentiment · StockPile" }] }),
  component: Sentiment,
});

function Sentiment() {
  useMarketTickers();
  const tickers = useMarketStore((s) => s.tickers);
  const breadth = computeMarketBreadth(tickers);
  const sectors = getSectorPerformance(tickers);

  const bullishPct = tickers.length > 0 ? Math.round((breadth.positive / breadth.total) * 100) : 0;
  const bearishPct = tickers.length > 0 ? Math.round((breadth.negative / breadth.total) * 100) : 0;
  const neutralPct = 100 - bullishPct - bearishPct;

  return (
    <div>
      <PageHeader
        eyebrow="Market Analysis"
        title="Sentiment Overview"
        subtitle="Aggregate momentum indicators derived from price action"
        right={
          <Pill tone={bullishPct > bearishPct ? "positive" : bearishPct > bullishPct ? "negative" : "cyan"}>
            {bullishPct > bearishPct
              ? "NET POSITIVE"
              : bearishPct > bullishPct
                ? "NET NEGATIVE"
                : "NEUTRAL"}
          </Pill>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Advancing"
          value={`${bullishPct}%`}
          accent="positive"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Declining"
          value={`${bearishPct}%`}
          accent="negative"
          icon={<TrendingDown className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Unchanged"
          value={`${neutralPct}%`}
          accent="cyan"
          icon={<Activity className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Instruments"
          value={`${breadth.total}`}
          accent="cyan"
          icon={<BarChart3 className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* Chart — honestly labeled */}
        <div className="col-span-12 xl:col-span-8 panel-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold">Price Momentum · Simulated 24h</h3>
            <Pill tone="warn">Simulated Data</Pill>
          </div>
          <PredictionChart seed={88} base={50} height={240} />
          <div className="mt-2 text-[11px] text-muted-foreground">
            Historical sentiment tracking from NLP analysis is planned. This chart displays
            simulated momentum data for layout demonstration.
          </div>
        </div>

        {/* Ticker sentiment map — using real changePct as a proxy */}
        <div className="col-span-12 xl:col-span-4 panel-elevated p-4">
          <h3 className="text-[13px] font-semibold mb-3">Momentum Heatmap</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {tickers.slice(0, 18).map((t) => {
              const intensity = Math.min(100, Math.abs(t.changePct) * 20);
              const up = t.changePct >= 0;
              return (
                <div
                  key={t.symbol}
                  className="rounded-md border border-border/60 p-2 relative overflow-hidden text-center"
                  style={{
                    background: up
                      ? `linear-gradient(135deg, color-mix(in oklab, var(--color-positive) ${intensity}%, transparent), transparent)`
                      : `linear-gradient(135deg, color-mix(in oklab, var(--color-negative) ${intensity}%, transparent), transparent)`,
                  }}
                >
                  <div className="text-[11px] font-mono">{t.symbol}</div>
                  <div className={cn("text-[10px] font-mono", getChangeColor(t.changePct))}>
                    {formatPercent(t.changePct)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sector performance bars — replaces fake narrative tracker */}
        <div className="col-span-12 panel-elevated p-4">
          <h3 className="text-[13px] font-semibold mb-3">Sector Performance</h3>
          <div className="space-y-2">
            {sectors.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="w-32 text-[12px] text-muted-foreground truncate">{s.name}</div>
                <div className="flex-1 h-6 rounded-md bg-panel-elevated overflow-hidden relative">
                  <div
                    className={cn(
                      "h-full rounded-md transition-all duration-500",
                      s.avgChange >= 0 ? "bg-positive/30" : "bg-negative/30",
                    )}
                    style={{
                      width: `${Math.min(100, Math.abs(s.avgChange) * 15 + 5)}%`,
                    }}
                  />
                  <span
                    className={cn(
                      "absolute inset-y-0 left-2 flex items-center text-[11px] font-mono",
                      getChangeColor(s.avgChange),
                    )}
                  >
                    {formatPercent(s.avgChange)}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground w-20 text-right">
                  {s.tickerCount} tickers · {s.topMover}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

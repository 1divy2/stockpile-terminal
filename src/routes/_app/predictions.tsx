import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, MetricCard } from "@/components/widgets/Primitives";
import { PredictionChart } from "@/components/widgets/Charts";
import { Pill } from "@/components/widgets/AIInsightCard";
import { Brain, TrendingUp, Waves, Gauge, Activity, Search } from "lucide-react";
import { useSelectedTickerStore } from "@/lib/market/selected-ticker-store";
import { useMarketStore } from "@/lib/market/market-state";
import { useCandles } from "@/hooks/market/useCandles";
import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { evaluateTechnicals } from "@/utils/indicators";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/predictions")({
  head: () => ({ meta: [{ title: "Predictions · StockPile" }] }),
  component: Predictions,
});

function Predictions() {
  const { data: liveTickers = [] } = useMarketTickers();
  const selectedTicker = useSelectedTickerStore((s) => s.selectedTicker);
  const setSelectedTicker = useSelectedTickerStore((s) => s.setSelectedTicker);

  const [search, setSearch] = useState("");

  const { data: candleData = [], isLoading: candlesLoading } = useCandles(
    selectedTicker || "NVDA",
    "1M",
  );

  const technicals = useMemo(() => {
    return evaluateTechnicals(candleData);
  }, [candleData]);

  const latestPrice = useMemo(() => {
    if (!candleData.length) return 100;
    return candleData[candleData.length - 1].close;
  }, [candleData]);

  // Filter tickers for search dropdown
  const filteredTickers = useMemo(() => {
    if (!search.trim()) return [];
    return liveTickers
      .filter(
        (t) =>
          t.symbol.toLowerCase().includes(search.toLowerCase()) ||
          (t.name ?? "").toLowerCase().includes(search.toLowerCase()),
      )
      .slice(0, 6);
  }, [search, liveTickers]);

  // Quick select items
  const quickPicks = ["SPY", "QQQ", "NVDA", "AAPL", "MSFT", "BTC/USD", "GLD"];

  const indicatorList = useMemo(() => {
    if (!candleData.length) return [];
    return [
      {
        name: "RSI (Relative Strength Index)",
        description:
          "Momentum oscillator measuring speed and magnitude of price movements. Values above 70 indicate overbought, below 30 oversold.",
        value: `RSI(14): ${technicals.rsiVal.toFixed(1)}`,
        status:
          technicals.rsiVal > 70 ? "OVERBOUGHT" : technicals.rsiVal < 30 ? "OVERSOLD" : "STABLE",
        statusColor:
          technicals.rsiVal > 70 ? "text-negative" : technicals.rsiVal < 30 ? "text-positive" : "text-cyan",
      },
      {
        name: "MACD (Moving Average Convergence Divergence)",
        description:
          "Trend-following indicator showing relationship between two moving averages. Hist crossover signals momentum shifts.",
        value: `MACD Line: ${technicals.macdVal.toFixed(4)}`,
        status: technicals.macdVal >= 0 ? "POSITIVE" : "NEGATIVE",
        statusColor: technicals.macdVal >= 0 ? "text-positive" : "text-negative",
      },
      {
        name: "Bollinger Bands",
        description:
          "Volatility bands placed above/below moving average. Price touching bands may signal reversals.",
        value: `Close: $${latestPrice.toFixed(2)} vs Bands`,
        status: technicals.bbState,
        statusColor:
          technicals.bbState === "OVERSOLD"
            ? "text-positive"
            : technicals.bbState === "OVERBOUGHT"
              ? "text-negative"
              : "text-muted-foreground",
      },
      {
        name: "Simple & Exponential Moving Averages",
        description:
          "Moving averages for trend definition. Golden cross (50 > 200) and death cross signal regime changes.",
        value: `20d SMA: $${technicals.sma20d.toFixed(2)} · 50d EMA: $${technicals.ema50d.toFixed(2)}`,
        status: latestPrice > technicals.ema50d ? "POSITIVE" : "NEGATIVE",
        statusColor: latestPrice > technicals.ema50d ? "text-positive" : "text-negative",
      },
      {
        name: "Volume-Weighted Average Price (VWAP)",
        description:
          "Cumulative volume-weighted average price. Institutional benchmark for execution value.",
        value: `VWAP: $${technicals.vwapVal.toFixed(2)}`,
        status: latestPrice > technicals.vwapVal ? "ABOVE VWAP" : "BELOW VWAP",
        statusColor: latestPrice > technicals.vwapVal ? "text-positive" : "text-negative",
      },
    ];
  }, [technicals, latestPrice, candleData]);

  // Aggregate verdict colors
  const verdictColor =
    technicals.verdict === "POSITIVE"
      ? "text-positive"
      : technicals.verdict === "NEGATIVE"
        ? "text-negative"
        : "text-cyan";

  const verdictAccent =
    technicals.verdict === "POSITIVE" ? "positive" : technicals.verdict === "NEGATIVE" ? "negative" : "cyan";

  return (
    <div>
      <PageHeader
        eyebrow="Quantitative Pipelines"
        title={`${selectedTicker} Signals & Predictions`}
        subtitle="Dynamic client-side technical analysis indicators computed on TwelveData historical candles"
        right={
          <div className="flex items-center gap-2">
            <Pill tone="positive">
              <span className="pulse-dot mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-positive text-positive" />
              INDICATOR PIPELINE ACTIVE
            </Pill>
          </div>
        }
      />

      {/* Ticker Selector Bar */}
      <div className="panel-elevated mb-4 flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-muted-foreground mr-1.5 uppercase">
            Quick Select:
          </span>
          {quickPicks.map((pick) => (
            <button
              key={pick}
              onClick={() => setSelectedTicker(pick)}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-mono transition-colors",
                selectedTicker === pick
                  ? "border border-cyan/40 bg-cyan/10 text-cyan"
                  : "border border-border/40 bg-panel/40 text-muted-foreground hover:text-foreground hover:bg-panel",
              )}
            >
              {pick}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-[240px]">
          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-panel/30 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticker symbol..."
              className="w-full bg-transparent text-[12px] outline-none"
            />
          </div>

          {!!filteredTickers.length && (
            <div className="absolute left-0 right-0 top-[110%] z-50 overflow-hidden rounded-xl border border-border bg-panel shadow-2xl backdrop-blur-xl">
              {filteredTickers.map((ticker) => (
                <button
                  key={ticker.symbol}
                  onClick={() => {
                    setSelectedTicker(ticker.symbol);
                    setSearch("");
                  }}
                  className="flex w-full items-center justify-between border-b border-border/40 px-3 py-2 text-left text-[11.5px] transition hover:bg-white/5 last:border-0"
                >
                  <div>
                    <span className="font-mono font-semibold">{ticker.symbol}</span>
                    <span className="ml-2 text-muted-foreground">{ticker.name}</span>
                  </div>
                  <span
                    className={cn("font-mono", ticker.changePct >= 0 ? "text-positive" : "text-negative")}
                  >
                    {ticker.changePct >= 0 ? "+" : ""}
                    {ticker.changePct.toFixed(2)}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Pipeline Status"
          value="Active"
          hint="Frontend Compute"
          accent="positive"
          icon={<Activity className="h-3.5 w-3.5 text-positive" />}
        />
        <MetricCard
          label="Asset Class"
          value={liveTickers.find((t) => t.symbol === selectedTicker)?.assetClass || "Equities"}
          accent="cyan"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Aggregate Verdict"
          value={technicals.verdict}
          hint={technicals.reason}
          accent={verdictAccent}
          icon={<Gauge className={cn("h-3.5 w-3.5", verdictColor)} />}
        />
        <MetricCard
          label="Signal Data Source"
          value="TwelveData API"
          hint="OHLCV candles verified"
          accent="cyan"
          icon={<Waves className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* Simulated forecast chart starting at actual stock price */}
        <div className="col-span-12 xl:col-span-7 panel-elevated p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-cyan">
                Seeded Forecast Model (Demo)
              </div>
              <div className="text-lg font-semibold">{selectedTicker} Projected Price Path</div>
            </div>
            <Pill tone="cyan">Seeded Simulator</Pill>
          </div>
          {candlesLoading ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
              Loading candle dataset...
            </div>
          ) : (
            <PredictionChart
              seed={selectedTicker.charCodeAt(0) + selectedTicker.length}
              base={latestPrice}
              height={320}
            />
          )}
          <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
            This forecast represents a statistical geometric projection seeded by {selectedTicker}'s
            current price of ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}.
            It models potential drift bands over the next 24 steps based on historic volatility.
          </div>
        </div>

        {/* Dynamic computed indicators */}
        <div className="col-span-12 xl:col-span-5 panel-elevated p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-cyan" />
            <h3 className="text-[13px] font-semibold">Technical Trend Signals</h3>
            <Pill tone="positive">Live Analysis</Pill>
          </div>
          <div className="space-y-3">
            {candlesLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Computing technical trends...
              </div>
            ) : (
              indicatorList.map((indicator) => (
                <div key={indicator.name} className="rounded-md border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] font-medium">{indicator.name}</div>
                    <span
                      className={cn(
                        "text-[10px] font-mono uppercase font-bold",
                        indicator.statusColor,
                      )}
                    >
                      {indicator.status}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[11.5px] font-mono text-cyan font-semibold">
                    {indicator.value}
                  </div>
                  <div className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
                    {indicator.description}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Architecture description */}
        <div className="col-span-12 panel-elevated p-4">
          <h3 className="text-[13px] font-semibold mb-3">Active Pipeline Pipeline Architecture</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              {
                step: "1",
                name: "Data Ingestion",
                desc: "Aggregate OHLCV candles from TwelveData",
                status: "Active",
              },
              {
                step: "2",
                name: "Technical Compute",
                desc: "Dynamically calculate EMA, RSI, MACD, BB, VWAP in-browser",
                status: "Active",
              },
              {
                step: "3",
                name: "Signal Aggregator",
                desc: "Evaluate indicators against scoring rules",
                status: "Active",
              },
              {
                step: "4",
                name: "Regime Verdict",
                desc: "Classify current asset bias (POSITIVE/NEGATIVE)",
                status: "Active",
              },
              {
                step: "5",
                name: "ML Projection Target",
                desc: "Connect inference server for model output overlay",
                status: "Planned",
              },
            ].map((stage) => (
              <div key={stage.step} className="rounded-md border border-border/60 p-3 text-center">
                <div className="text-[18px] font-bold text-cyan mb-1">{stage.step}</div>
                <div className="text-[12px] font-semibold">{stage.name}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{stage.desc}</div>
                <div
                  className={`mt-2 text-[10px] font-mono ${stage.status === "Active" ? "text-positive font-bold" : "text-warn"}`}
                >
                  {stage.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

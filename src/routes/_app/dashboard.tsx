import { createFileRoute } from "@tanstack/react-router";

import { MetricCard, PageHeader } from "@/components/widgets/Primitives";

import { AnimatedNumber } from "@/components/widgets/AnimatedNumber";

import { AreaPriceChart } from "@/components/widgets/Charts";
import { LightweightChart } from "@/components/charts/LightweightChart";
import { CandlePoint } from "@/lib/market/market-types";

import { SectorHeatmap } from "@/components/widgets/MarketWidgets";

import { Sparkline } from "@/components/widgets/Sparkline";

import { ChartModal } from "@/components/widgets/ChartModal";

import { ActivePositions } from "@/components/dashboard/ActivePositions";
import { PortfolioAllocation } from "@/components/dashboard/PortfolioAllocation";

import { MarketBriefing } from "@/components/dashboard/MarketBriefing";
import { VolumeSpikes } from "@/components/dashboard/VolumeSpikes";

import { Pill } from "@/components/widgets/AIInsightCard";

import { useMarketNews } from "@/hooks/market/useMarketNews";

import { useCandles } from "@/hooks/market/useCandles";

import { useMarketTickers } from "@/hooks/market/useMarketTickers";

import { getMarketSession } from "@/lib/market/session";

import { useMarketStore, MarketTicker } from "@/lib/market/market-state";

import { usePaperTradingStore } from "@/lib/paper-trading/paper-trading-store";

import { useWatchlistStore } from "@/lib/watchlist/watchlist-store";

import { useSelectedTickerStore } from "@/lib/market/selected-ticker-store";

import { calculateVolatility } from "@/lib/market/volatility-engine";

import { calculatePortfolioAnalytics } from "@/lib/market/portfolio-engine";

import { useToast } from "@/components/widgets/ToastProvider";

import { Activity, Brain, AlertTriangle, Clock, Play, TrendingUp, BarChart2, CandlestickChart, ExternalLink, DollarSign, ShieldAlert, Waves, Zap, LayoutGrid } from "lucide-react";

import { cn } from "@/lib/utils";

import { motion } from "framer-motion";

import { useMemo, useState } from "react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      {
        title: "Dashboard · StockPile",
      },
      {
        name: "description",
        content: "Real-time market intelligence and portfolio monitoring.",
      },
    ],
  }),

  component: Dashboard,
});

function Dashboard() {
  const { pushToast } = useToast();
  const { data: marketNews, isLoading: newsLoading } = useMarketNews();

  useMarketTickers();

  const liveTickers = useMarketStore((s) => s.tickers);
  const engine = useMarketStore((s) => s.engine);

  const selectedTicker = useSelectedTickerStore((s) => s.selectedTicker);

  const setSelectedTicker = useSelectedTickerStore((s) => s.setSelectedTicker);

  const cash = usePaperTradingStore((s) => s.cash);

  const positions = usePaperTradingStore((s) => s.positions);

  const watchlistSymbols = useWatchlistStore((s) => s.symbols);

  const toggleWatchlist = useWatchlistStore((s) => s.toggleSymbol);

  const isWatchlisted = (symbol: string) => watchlistSymbols.includes(symbol);

  const gainers = engine.gainers;

  const losers = engine.losers;

  const [timeframe, setTimeframe] = useState<"1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "ALL">(
    "1M",
  );

  const [search, setSearch] = useState("");

  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [chartMode, setChartMode] = useState<"area" | "candlestick">("area");
  
  // Dashboard Layout Config
  const [showNews, setShowNews] = useState(true);
  const [showMovers, setShowMovers] = useState(true);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  const filteredTickers = useMemo(() => {
    if (!search.trim()) {
      return [];
    }

    return liveTickers
      .filter(
        (ticker) =>
          ticker.symbol !== selectedTicker &&
          (ticker.symbol.toLowerCase().includes(search.toLowerCase()) ||
            (ticker.name ?? "").toLowerCase().includes(search.toLowerCase())),
      )
      .slice(0, 6);
  }, [search, liveTickers, selectedTicker]);

  const { data: candleData = [] } = useCandles(selectedTicker || "NVDA", timeframe);

  const latestPrice = candleData[candleData.length - 1]?.price ?? 0;

  const firstPrice = candleData[0]?.price ?? 0;

  const priceChange = latestPrice - firstPrice;

  const percentChange = firstPrice ? (priceChange / firstPrice) * 100 : 0;

  const isPositive = priceChange >= 0;

  const volatility = calculateVolatility(candleData);

  const marketSession = getMarketSession();

  const portfolioAnalytics = calculatePortfolioAnalytics(
    positions.map((p) => ({
      symbol: p.symbol,

      shares: p.shares,

      averageCost: p.avgPrice,
    })),

    liveTickers,

    Object.fromEntries(positions.map((p) => [p.symbol, volatility])),
  );

  const watchlistTickers = liveTickers.filter((ticker) => watchlistSymbols.includes(ticker.symbol));

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 6,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.3,
      }}
    >
      <PageHeader
        eyebrow="Dashboard"
        title="Command Center"
        subtitle="Global market view and active portfolio monitoring"
        right={
          <div className="flex gap-2 items-center relative">
            <button onClick={() => setShowLayoutMenu(!showLayoutMenu)} className="flex items-center gap-1.5 bg-panel border border-border/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1.5 rounded transition hover:text-cyan hover:border-cyan/40">
              <LayoutGrid className="h-3.5 w-3.5" /> Customize
            </button>
            {showLayoutMenu && (
               <div className="absolute top-full right-0 mt-2 bg-panel-elevated border border-border/60 rounded p-3 w-[200px] z-50 shadow-2xl flex flex-col gap-3">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">Widget Visibility</div>
                  <label className="flex items-center justify-between text-[12px] font-semibold cursor-pointer">
                    Top Movers
                    <input type="checkbox" checked={showMovers} onChange={(e) => setShowMovers(e.target.checked)} className="accent-cyan" />
                  </label>
                  <label className="flex items-center justify-between text-[12px] font-semibold cursor-pointer">
                    Market News
                    <input type="checkbox" checked={showNews} onChange={(e) => setShowNews(e.target.checked)} className="accent-cyan" />
                  </label>
               </div>
            )}
            <Pill tone={marketSession.tone}>
              {marketSession.label}
            </Pill>
          </div>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Portfolio NAV"
          value={
            <AnimatedNumber
              value={portfolioAnalytics.totalValue}
              format={(v) =>
                `$${v.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`
              }
            />
          }
          delta={portfolioAnalytics.unrealizedPnLPct}
          hint={`PnL $${portfolioAnalytics.unrealizedPnL.toLocaleString()}`}
          accent="positive"
          icon={<DollarSign className="h-3.5 w-3.5" />}
        />

        <MetricCard
          label={`vs ${portfolioAnalytics.benchmarkSymbol}`}
          value={
            <div className="flex">
              {portfolioAnalytics.alpha >= 0 ? "+" : ""}
              <AnimatedNumber value={portfolioAnalytics.alpha} format={(v) => `${v.toFixed(2)}%`} />
            </div>
          }
          delta={portfolioAnalytics.relativePerformance}
          hint={`Portfolio ${portfolioAnalytics.portfolioReturn.toFixed(
            2,
          )}% · ${portfolioAnalytics.benchmarkSymbol} ${portfolioAnalytics.benchmarkReturn.toFixed(
            2,
          )}%`}
          accent={portfolioAnalytics.alpha >= 0 ? "positive" : "negative"}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />

        <MetricCard
          label="Realized Volatility"
          value={
            <AnimatedNumber
              value={volatility.annualizedVolatility}
              format={(v) => `${v.toFixed(1)}%`}
            />
          }
          delta={Number(volatility.averageReturn.toFixed(2))}
          hint={`${volatility.realizedMovement.toFixed(1)}% realized movement`}
          accent="warn"
          icon={<Waves className="h-3.5 w-3.5" />}
        />

        <MetricCard
          label="Risk Exposure"
          value={
            <div className="flex">
              <AnimatedNumber
                value={portfolioAnalytics.weightedVolatility}
                format={(v) => `${v.toFixed(1)}`}
              />
              <span>σ</span>
            </div>
          }
          delta={Number(volatility.trendStrength.toFixed(2))}
          hint={`${volatility.maxDrawdown.toFixed(1)}% max drawdown`}
          accent="negative"
          icon={<ShieldAlert className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Diversification"
          value={
            <div className="flex">
              <AnimatedNumber
                value={portfolioAnalytics.diversificationScore}
                format={(v) => `${v.toFixed(0)}`}
              />
              <span>/100</span>
            </div>
          }
          delta={Object.keys(portfolioAnalytics.sectorExposure).length}
          hint={`Largest: ${portfolioAnalytics.largestPosition}`}
          accent="cyan"
          icon={<Activity className="h-3.5 w-3.5" />}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 xl:gap-8">
        <div className={cn("flex flex-col gap-6 lg:col-span-8", (!showNews && !showMovers) ? "lg:col-span-12" : "")}>
          <div className="panel-elevated p-4">
          <div className="mb-4 flex flex-col gap-4">
            <div className="relative max-w-xl">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticker, crypto, ETF..."
                className="w-full rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-[15px] outline-none transition-all focus:border-cyan/50 focus:ring-2 focus:ring-cyan/10"
              />

              {!!filteredTickers.length && (
                <div className="absolute left-0 right-0 top-[110%] z-50 overflow-hidden rounded-xl border border-border bg-panel shadow-2xl backdrop-blur-xl">
                  {filteredTickers.map((ticker) => (
                    <button
                      key={ticker.symbol}
                      onClick={() => {
                        setSelectedTicker(ticker.symbol);

                        setSearch("");
                      }}
                      className="flex w-full items-center justify-between border-b border-border/40 px-4 py-3 text-left transition hover:bg-white/5 last:border-0"
                    >
                      <div>
                        <div className="font-mono text-[12px]">{ticker.symbol}</div>

                        <div className="text-[11px] text-muted-foreground">
                          {ticker.name ?? "Unknown Asset"}
                        </div>
                      </div>

                      <div
                        className={`text-[11px] font-mono ${
                          ticker.changePct >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {ticker.changePct >= 0 ? "+" : ""}
                        {ticker.changePct.toFixed(2)}%
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-start justify-between">
              <div>
                <div className="text-cyan text-[10px] font-mono uppercase tracking-[0.18em]">
                  {selectedTicker} · Market Feed
                </div>

                <div className="text-lg font-semibold tracking-tight">
                  {selectedTicker}

                  <span className="ml-1 text-[13px] font-normal text-muted-foreground">
                    · ${latestPrice.toFixed(2)}{" "}
                    <span className={isPositive ? "text-positive" : "text-negative"}>
                      {isPositive ? "+" : ""}
                      {percentChange.toFixed(2)}%
                      <button
                        onClick={() => setChartModalOpen(true)}
                        className="ml-3 rounded-lg border border-cyan/20 bg-cyan/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan transition-all hover:border-cyan/40 hover:bg-cyan/15"
                      >
                        Advanced
                      </button>
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex gap-1 text-[11px] font-mono">
                {["1D", "5D", "1M", "6M", "YTD", "1Y", "ALL"].map((period) => (
                  <button
                    key={period}
                    onClick={() =>
                      setTimeframe(period as "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "ALL")
                    }
                    className={`rounded px-2 py-1 transition-colors ${
                      timeframe === period
                        ? "border border-cyan/40 bg-panel-elevated text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={() => setChartMode("area")}
              className={`rounded px-2 py-1 text-[10px] font-mono transition-colors ${
                chartMode === "area"
                  ? "border border-cyan/40 bg-panel-elevated text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartMode("candlestick")}
              className={`p-1.5 rounded transition ${chartMode === "candlestick" ? "bg-panel text-cyan" : "text-muted-foreground hover:bg-panel hover:text-foreground"}`}
            >
              <CandlestickChart className="h-3.5 w-3.5" />
            </button>
            <button 
              title="Pop-out Chart"
              onClick={() => window.open(`/popout?widget=chart&symbol=${selectedTicker}`, '_blank', 'width=800,height=600')}
              className="p-1.5 rounded transition text-muted-foreground hover:bg-panel hover:text-cyan border-l border-border/40 ml-1 pl-2"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
          {chartMode === "area" ? (
            <AreaPriceChart data={candleData} height={300} />
          ) : (
            <LightweightChart candles={candleData as CandlePoint[]} height={300} />
          )}

          <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] font-mono md:grid-cols-4">
            <div>
              <div className="text-muted-foreground">DAY RANGE</div>

              <div className="tabular-nums">
                {candleData.length ? (
                  <>
                    ${Math.min(...candleData.map((d: { price: number }) => d.price)).toFixed(2)} – $
                    {Math.max(...candleData.map((d: { price: number }) => d.price)).toFixed(2)}
                  </>
                ) : (
                  "No Data"
                )}
              </div>
            </div>

            <div>
              <div className="text-muted-foreground">PERIOD CHANGE</div>

              <div className={`tabular-nums ${isPositive ? "text-positive" : "text-negative"}`}>
                {isPositive ? "+" : ""}
                {priceChange.toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-muted-foreground">DATA POINTS</div>

              <div className="tabular-nums">{candleData.length}</div>
            </div>

            <div>
              <div className="text-muted-foreground">ACTIVE RANGE</div>

              <div className="text-cyan tabular-nums">{timeframe}</div>
            </div>
          </div>
        </div>

        <ActivePositions />
        
        <div className="panel-elevated p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-positive h-4 w-4" />

              <h3 className="text-[13px] font-semibold">Sector Rotation</h3>
            </div>

            <span className="text-[10px] font-mono text-muted-foreground">
              Weighted by SPX market cap · intraday
            </span>
          </div>

          <SectorHeatmap />
        </div>
        </div>

        {(showMovers || showNews) && (
          <div className="flex flex-col gap-6 lg:col-span-4">
            {showMovers && (
              <div className="panel-elevated p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="text-cyan h-4 w-4" />

                    <h3 className="text-[13px] font-semibold">Top Movers</h3>
                  </div>

                  <Pill>LIVE</Pill>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-positive mb-1.5 text-[10px] font-mono">GAINERS</div>

                    {gainers.map((g) => (
                      <button
                        key={g.symbol}
                        onClick={() => setSelectedTicker(g.symbol)}
                        className="flex items-center justify-between border-b border-border/40 py-1.5 last:border-0 w-full"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist(g.symbol);
                              pushToast({
                                title: isWatchlisted(g.symbol) ? `Removed ${g.symbol}` : `Added ${g.symbol}`,
                                tone: isWatchlisted(g.symbol) ? "info" : "success"
                              });
                            }}
                            role="button"
                            className={`text-[12px] transition hover:scale-110 ${
                              isWatchlisted(g.symbol) ? "text-warn" : "text-muted-foreground"
                            }`}
                          >
                            {isWatchlisted(g.symbol) ? "★" : "☆"}
                          </div>

                          <div>
                            <div className="font-mono text-[11px]">{g.symbol}</div>

                            <div className="tabular-nums text-[10px] text-muted-foreground">
                              ${g.price.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <span className="text-positive tabular-nums font-mono text-[11px]">
                          +{g.changePct.toFixed(2)}%
                        </span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <div className="text-negative mb-1.5 text-[10px] font-mono">LOSERS</div>

                    {losers.map((g) => (
                      <button
                        key={g.symbol}
                        onClick={() => setSelectedTicker(g.symbol)}
                        className="flex items-center justify-between border-b border-border/40 py-1.5 last:border-0 w-full"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist(g.symbol);
                              pushToast({
                                title: isWatchlisted(g.symbol) ? `Removed ${g.symbol}` : `Added ${g.symbol}`,
                                tone: isWatchlisted(g.symbol) ? "info" : "success"
                              });
                            }}
                            role="button"
                            className={`text-[12px] transition hover:scale-110 ${
                              isWatchlisted(g.symbol) ? "text-warn" : "text-muted-foreground"
                            }`}
                          >
                            {isWatchlisted(g.symbol) ? "★" : "☆"}
                          </div>

                          <div>
                            <div className="font-mono text-[11px]">{g.symbol}</div>

                            <div className="tabular-nums text-[10px] text-muted-foreground">
                              ${g.price.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <span className="text-negative tabular-nums font-mono text-[11px]">
                          {g.changePct.toFixed(2)}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {showNews && (
              <div className="panel-elevated p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold">Market News</h3>

                  <Pill tone="warn">LIVE FEED</Pill>
                </div>

                <div className="divide-y divide-border/40">
                  {newsLoading ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Loading market news...
                    </div>
                  ) : (
                    marketNews
                      ?.slice(0, 6)
                      .map(
                        (
                          n: { headline: string; source: string; category: string; url: string },
                          i: number,
                        ) => (
                          <div key={`${n.headline}-${i}`} className="flex items-start gap-3 py-2.5">
                            <div className="w-12 shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground">
                              LIVE
                            </div>

                            <div className="flex-1">
                              <div className="mb-0.5 flex items-center gap-2">
                                <span className="text-cyan font-mono text-[10px]">
                                  {n.source?.toUpperCase()}
                                </span>
                              </div>

                              <div className="text-[12.5px] leading-snug">{n.headline}</div>
                            </div>

                            <div className="flex shrink-0 flex-col items-end">
                              <div className="font-mono text-[10px] text-muted-foreground">CATEGORY</div>

                              <div className="text-warn font-mono text-[12px] uppercase">
                                {n.category}
                              </div>
                            </div>
                          </div>
                        ),
                      )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="col-span-12 xl:col-span-8">
          <PortfolioAllocation analytics={portfolioAnalytics} />
        </div>

        <div className="panel-elevated col-span-12 p-4 xl:col-span-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Watchlist</h3>

            <Pill tone="cyan">{watchlistTickers.length} ACTIVE</Pill>
          </div>

          <div className="space-y-2">
            {watchlistTickers.map((ticker) => (
              <button
                key={ticker.symbol}
                onClick={() => setSelectedTicker(ticker.symbol)}
                className="flex w-full items-center justify-between rounded-md border border-border/60 p-3 text-left transition hover:border-cyan/40"
              >
                <div className="flex items-center gap-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();

                      toggleWatchlist(ticker.symbol);
                    }}
                    role="button"
                    className="text-[16px] text-warn transition hover:scale-110"
                  >
                    ★
                  </div>

                  <div>
                    <div className="font-mono text-[12px]">{ticker.symbol}</div>

                    <div className="text-[11px] text-muted-foreground">{ticker.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="tabular-nums text-[12px] font-semibold">
                      $
                      {ticker.price.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </div>

                    <div
                      className={`text-[11px] font-mono ${
                        ticker.changePct >= 0 ? "text-positive" : "text-negative"
                      }`}
                    >
                      {ticker.changePct >= 0 ? "+" : ""}
                      {ticker.changePct.toFixed(2)}%
                    </div>
                  </div>

                  <Sparkline
                    seed={ticker.symbol.length}
                    trend={ticker.changePct}
                    height={32}
                    color={ticker.changePct >= 0 ? "var(--color-positive)" : "var(--color-negative)"}
                  />
                </div>
              </button>
            ))}

            {!watchlistTickers.length && (
              <div className="rounded-md border border-border/60 p-6 text-center text-sm text-muted-foreground">
                Your watchlist is empty.
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-4">
          <MarketBriefing />
          <VolumeSpikes />
        </div>

        <div className="panel-elevated col-span-12 p-4 xl:col-span-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Market News</h3>

            <Pill tone="warn">LIVE FEED</Pill>
          </div>

          <div className="divide-y divide-border/40">
            {newsLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading market news...
              </div>
            ) : (
              marketNews
                ?.slice(0, 6)
                .map(
                  (
                    n: { headline: string; source: string; category: string; url: string },
                    i: number,
                  ) => (
                    <div key={`${n.headline}-${i}`} className="flex items-start gap-3 py-2.5">
                      <div className="w-12 shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground">
                        LIVE
                      </div>

                      <div className="flex-1">
                        <div className="mb-0.5 flex items-center gap-2">
                          <span className="text-cyan font-mono text-[10px]">
                            {n.source?.toUpperCase()}
                          </span>
                        </div>

                        <div className="text-[12.5px] leading-snug">{n.headline}</div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end">
                        <div className="font-mono text-[10px] text-muted-foreground">CATEGORY</div>

                        <div className="text-warn font-mono text-[12px] uppercase">
                          {n.category}
                        </div>
                      </div>
                    </div>
                  ),
                )
            )}
          </div>
        </div>

        <div className="panel-elevated col-span-12 p-4 xl:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Macro Pulse</h3>

            <Pill>
              <Zap className="h-3 w-3" />
              LIVE
            </Pill>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              engine.getTicker("SPY") && {
                l: "SPY",
                ticker: engine.getTicker("SPY"),
                s: 3,
                c: "var(--color-cyan)",
              },

              engine.getTicker("QQQ") && {
                l: "QQQ",
                ticker: engine.getTicker("QQQ"),
                s: 5,
                c: "var(--color-positive)",
              },

              engine.getTicker("GLD") && {
                l: "GLD",
                ticker: engine.getTicker("GLD"),
                s: 7,
                c: "var(--color-warn)",
              },

              engine.getTicker("BTC/USD") && {
                l: "BTC",
                ticker: engine.getTicker("BTC/USD"),
                s: 9,
                c: "var(--color-positive)",
              },

              engine.getTicker("ETH/USD") && {
                l: "ETH",
                ticker: engine.getTicker("ETH/USD"),
                s: 11,
                c: "var(--color-positive)",
              },

              engine.getTicker("TLT") && {
                l: "TLT",
                ticker: engine.getTicker("TLT"),
                s: 13,
                c: "var(--color-cyan)",
              },
            ]
              .filter(
                (
                  m,
                ): m is {
                  l: string;
                  ticker: MarketTicker;
                  s: number;
                  c: string;
                } => Boolean(m),
              )
              .map((m) => {
                const positive = (m.ticker?.changePct ?? 0) >= 0;

                const value = m.ticker?.price ?? 0;

                return (
                  <motion.div
                    key={m.l}
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                    className="rounded-md border border-border/60 p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{m.l}</span>

                      <span
                        className={`font-mono text-[10px] tabular-nums ${
                          positive ? "text-positive" : "text-negative"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {(m.ticker?.changePct ?? 0).toFixed(2)}%
                      </span>
                    </div>

                    <div className="tabular-nums text-[14px] font-semibold">
                      {value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </div>

                    <Sparkline
                      seed={m.s}
                      trend={m.ticker?.changePct ?? 0}
                      height={28}
                      color={m.c}
                    />
                  </motion.div>
                );
              })}
          </div>
        </div>
      </div>
      <ChartModal
        open={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        symbol={selectedTicker}
        data={candleData}
        timeframe={timeframe}
        onTimeframeChange={(value) =>
          setTimeframe(value as "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "ALL")
        }
      />
    </motion.div>
  );
}

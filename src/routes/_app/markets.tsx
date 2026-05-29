import { createFileRoute } from "@tanstack/react-router";

import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/widgets/Primitives";

import { MarketTable } from "@/components/widgets/MarketWidgets";

import { Sparkline } from "@/components/widgets/Sparkline";
import { AreaPriceChart } from "@/components/widgets/Charts";
import { Pill } from "@/components/widgets/AIInsightCard";

import { useToast } from "@/components/widgets/ToastProvider";
import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { useCandles } from "@/hooks/market/useCandles";
import { useMarketStore } from "@/lib/market/market-state";

import { usePaperTradingStore } from "@/lib/paper-trading/paper-trading-store";

import { getMarketSession } from "@/lib/market/session";

import { Search, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/_app/markets")({
  head: () => ({
    meta: [
      {
        title: "Markets · StockPile",
      },
    ],
  }),

  component: Markets,
});

const categories = ["All", "Equities", "Crypto", "ETFs", "Commodities", "Indices", "Bonds"];

function Markets() {
  useMarketTickers();

  const liveTickers = useMarketStore((s) => s.tickers);

  const globalSelectedTicker = useMarketStore((s) => s.selectedTicker);

  const setGlobalSelectedTicker = useMarketStore((s) => s.setSelectedTicker);

  const buy = usePaperTradingStore((s) => s.buy);

  const sell = usePaperTradingStore((s) => s.sell);

  const initializePaperTrading = usePaperTradingStore((s) => s.initialize);

  const cash = usePaperTradingStore((s) => s.cash);

  const positions = usePaperTradingStore((s) => s.positions);

  const { pushToast } = useToast();

  const marketSession = getMarketSession();

  const [search, setSearch] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [activeCategory, setActiveCategory] = useState("All");

  const { data: candleData } = useCandles(globalSelectedTicker);

  useEffect(() => {
    initializePaperTrading();
  }, [initializePaperTrading]);

  const filtered = useMemo(() => {
    return liveTickers.filter((ticker) => {
      const matchesSearch = ticker.symbol.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        activeCategory === "All" ? true : ticker.assetClass === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [liveTickers, search, activeCategory]);

  const trending = filtered.slice(0, 6);

  const activeTicker =
    filtered.find((ticker) => ticker.symbol === globalSelectedTicker) || filtered[0];

  const activePosition = positions.find((p) => p.symbol === activeTicker?.symbol);

  const estimatedCost = activeTicker ? activeTicker.price * quantity : 0;

  const canTrade = marketSession.label === "MARKET OPEN";

  const canBuy = canTrade && estimatedCost <= cash;

  const canSell = canTrade && (activePosition?.shares ?? 0) >= quantity;

  useEffect(() => {
    if (!filtered.length) {
      return;
    }

    const existsInFilter = filtered.some((ticker) => ticker.symbol === globalSelectedTicker);

    if (!existsInFilter) {
      setGlobalSelectedTicker(filtered[0].symbol);
    }
  }, [filtered, globalSelectedTicker, setGlobalSelectedTicker]);

  return (
    <div>
      <PageHeader
        eyebrow="Markets"
        title="Market Explorer"
        subtitle={`${liveTickers.length} instruments tracked via Yahoo Finance`}
        right={
          <Pill tone={marketSession.tone}>
            <span
              className={`pulse-dot inline-block h-1.5 w-1.5 rounded-full ${
                marketSession.tone === "positive"
                  ? "bg-positive text-positive"
                  : marketSession.tone === "warn"
                    ? "bg-warn text-warn"
                    : "bg-negative text-negative"
              }`}
            />

            {marketSession.label}
          </Pill>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="panel flex h-9 max-w-md min-w-[260px] flex-1 items-center gap-2 px-3">
          <Search className="text-muted-foreground h-3.5 w-3.5" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter symbol, sector, ISIN…"
            className="flex-1 bg-transparent text-[13px] outline-none"
          />
        </div>

        <div className="flex gap-1">
          {categories.map((category, index) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`h-9 rounded-md border px-3 text-[12px] transition ${
                activeCategory === category
                  ? "border-cyan/40 bg-panel-elevated text-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setSearch("");
            setActiveCategory("All");
          }}
          className="panel ml-auto flex h-9 items-center gap-2 px-3 text-[12px]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Reset Filters
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {trending.map((ticker, index) => {
          const active = ticker.symbol === globalSelectedTicker;

          return (
            <button
              key={ticker.symbol}
              onClick={() => setGlobalSelectedTicker(ticker.symbol)}
              className={`panel-elevated cursor-pointer p-3 text-left transition ${
                active ? "border-cyan/40 bg-panel-elevated/80" : "hover:border-cyan/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-cyan font-mono text-[12px]">{ticker.symbol}</span>

                <span
                  className={`text-[11px] font-mono tabular-nums ${
                    ticker.changePct >= 0 ? "text-positive" : "text-negative"
                  }`}
                >
                  {ticker.changePct >= 0 ? "+" : ""}
                  {ticker.changePct.toFixed(2)}%
                </span>
              </div>

              <div className="truncate text-[11px] text-muted-foreground">
                {ticker.name || ticker.sector || "—"}
              </div>

              <div className="mt-1 text-[15px] font-semibold tabular-nums">
                ${ticker.price.toLocaleString()}
              </div>

              <Sparkline
                seed={index + 21}
                height={32}
                color={ticker.changePct >= 0 ? "var(--color-positive)" : "var(--color-negative)"}
              />
            </button>
          );
        })}
      </div>

      {activeTicker && (
        <div className="panel-elevated mb-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-cyan text-[10px] font-mono uppercase tracking-[0.18em]">
                Selected Instrument
              </div>

              <div className="mt-1 flex items-center gap-3">
                <h2 className="text-2xl font-semibold">{activeTicker.symbol}</h2>

                <Pill tone={activeTicker.changePct >= 0 ? "positive" : "negative"}>
                  {activeTicker.changePct >= 0 ? "+" : ""}
                  {activeTicker.changePct.toFixed(2)}%
                </Pill>
              </div>

              <div className="mt-2 text-[13px] text-muted-foreground">
                {activeTicker.name || "—"} · {activeTicker.sector || "—"} ·{" "}
                {activeTicker.assetClass || "—"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-border/60 bg-panel/40 p-3">
                <div className="text-[10px] font-mono text-muted-foreground">LAST PRICE</div>

                <div className="mt-1 text-[16px] font-semibold tabular-nums">
                  ${activeTicker.price.toLocaleString()}
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-panel/40 p-3">
                <div className="text-[10px] font-mono text-muted-foreground">MOMENTUM</div>

                <div
                  className={`mt-1 text-[16px] font-semibold ${
                    activeTicker.changePct >= 0 ? "text-positive" : "text-negative"
                  }`}
                >
                  {activeTicker.changePct >= 0 ? "Positive Bias" : "Negative Bias"}
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-panel/40 p-3">
                <div className="text-[10px] font-mono text-muted-foreground">SECTOR</div>

                <div className="mt-1 text-[14px] font-semibold text-cyan">
                  {activeTicker.sector || "—"}
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-panel/40 p-3">
                <div className="text-[10px] font-mono text-muted-foreground">ASSET CLASS</div>

                <div className="mt-1 text-[14px] font-semibold">
                  {activeTicker.assetClass || "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-border/60 pt-4">
            <div className="mb-3">
              <h3 className="text-[13px] font-semibold">Price Action</h3>
            </div>
            <AreaPriceChart data={candleData} height={200} color={activeTicker.changePct >= 0 ? "var(--color-positive)" : "var(--color-negative)"} />
          </div>

          <div className="mt-5 border-t border-border/60 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[12px] font-semibold">Trade Ticket</div>

                <div className="text-[11px] text-muted-foreground">Simulated execution engine</div>
              </div>

              <Pill tone="cyan">CASH ${cash.toLocaleString()}</Pill>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="mb-1 text-[10px] font-mono text-muted-foreground">QUANTITY</div>

                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="h-10 w-28 rounded-md border border-border/60 bg-panel px-3 text-[13px] outline-none"
                />
              </div>

              <div className="min-w-[140px]">
                <div className="mb-1 text-[10px] font-mono text-muted-foreground">
                  ESTIMATED VALUE
                </div>

                <div className="flex h-10 items-center rounded-md border border-border/60 bg-panel px-3 text-[13px] font-semibold">
                  $
                  {estimatedCost.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={!canBuy}
                  onClick={() => {
                    buy(activeTicker.symbol, quantity, activeTicker.price);

                    pushToast({
                      tone: "success",

                      title: "Trade Executed",

                      description: `Bought ${quantity} ${activeTicker.symbol} @ $${activeTicker.price.toFixed(
                        2,
                      )}`,
                    });

                    setQuantity(1);
                  }}
                  className={`h-10 rounded-md px-4 text-[12px] font-semibold transition ${
                    canBuy
                      ? "bg-positive text-black hover:opacity-90"
                      : "cursor-not-allowed bg-panel text-muted-foreground"
                  }`}
                >
                  BUY
                </button>

                <button
                  disabled={!canSell}
                  onClick={() => {
                    sell(activeTicker.symbol, quantity, activeTicker.price);

                    pushToast({
                      tone: "info",

                      title: "Position Reduced",

                      description: `Sold ${quantity} ${activeTicker.symbol} @ $${activeTicker.price.toFixed(
                        2,
                      )}`,
                    });

                    setQuantity(1);
                  }}
                  className={`h-10 rounded-md px-4 text-[12px] font-semibold transition ${
                    canSell
                      ? "bg-negative text-white hover:opacity-90"
                      : "cursor-not-allowed bg-panel text-muted-foreground"
                  }`}
                >
                  SELL
                </button>
              </div>

              <div className="text-[11px] text-muted-foreground">
                Owned:{" "}
                <span className="font-medium text-foreground">{activePosition?.shares ?? 0}</span>{" "}
                shares
              </div>
            </div>

            {!canTrade
              ? null
              : !canBuy &&
                quantity > 0 && (
                  <div className="mt-2 text-[11px] text-negative">Insufficient buying power.</div>
                )}

            {!canSell && quantity > 0 && (
              <div className="mt-2 text-[11px] text-negative">Not enough shares to sell.</div>
            )}
            {!canTrade && (
              <div className="mt-2 text-[11px] text-warn">Market is currently closed.</div>
            )}
          </div>
        </div>
      )}

      <div className="panel-elevated p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold">Live Tape</h3>

          <div className="flex gap-2 text-[10px] font-mono text-muted-foreground">
            <Pill tone="cyan">{filtered.length} INSTRUMENTS</Pill>

            <span>Yahoo Finance</span>
          </div>
        </div>

        <MarketTable tickers={filtered} limit={filtered.length} />
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { MetricCard, PageHeader } from "@/components/widgets/Primitives";
import { AreaPriceChart } from "@/components/widgets/Charts";
import { Pill } from "@/components/widgets/AIInsightCard";
import { DollarSign, TrendingUp, Wallet, ShieldAlert } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { useCandles } from "@/hooks/market/useCandles";
import { useMarketStore } from "@/lib/market/market-state";
import { usePaperTradingStore } from "@/lib/paper-trading/paper-trading-store";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio · StockPile" }] }),
  component: Portfolio,
});

const colors = [
  "var(--color-positive)",
  "var(--color-cyan)",
  "var(--color-warn)",
  "var(--color-chart-5)",
  "var(--color-negative)",
  "#7aa6ff",
  "#d28aff",
  "#ffd07a",
  "#7affe0",
  "#aaa",
];

function Portfolio() {
  useMarketTickers();

  const liveTickers = useMarketStore((s) => s.tickers);

  const selectedTicker = useMarketStore((s) => s.selectedTicker);

  const setSelectedTicker = useMarketStore((s) => s.setSelectedTicker);
  const initialize = usePaperTradingStore((s) => s.initialize);

  const positions = usePaperTradingStore((s) => s.positions);

  const cash = usePaperTradingStore((s) => s.cash);
  useEffect(() => {
    initialize();
  }, [initialize]);

  const history = usePaperTradingStore((s) => s.history);

  const priceMap = Object.fromEntries(liveTickers.map((t) => [t.symbol, t]));

  const rows = positions.map((h) => {
    const p = priceMap[h.symbol];

    const last = p?.price ?? h.avgPrice;

    const value = +(h.shares * last).toFixed(2);

    const pl = +((last - h.avgPrice) * h.shares).toFixed(2);

    const plPct = +(((last - h.avgPrice) / h.avgPrice) * 100).toFixed(2);

    return {
      ...h,

      last,

      value,

      pl,

      plPct,
    };
  });

  const total = rows.reduce((s, r) => s + r.value, 0);

  const rowsWithWeight = rows.map((r) => ({
    ...r,

    weight: total > 0 ? +((r.value / total) * 100).toFixed(1) : 0,
  }));

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const selectedHolding =
    rowsWithWeight.find((r) => r.symbol === selectedTicker) || rowsWithWeight[0];

  const sortedRows = [...rowsWithWeight].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aVal = a[key as keyof typeof a];
    const bVal = b[key as keyof typeof b];
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const { data: candleData } = useCandles(selectedHolding?.symbol);

  return (
    <div>
      <PageHeader
        eyebrow="Portfolio"
        title="Paper Trading Portfolio"
        subtitle={`${positions.length} simulated positions · live mark-to-market`}
        right={
          <>
            <Pill tone={rows.reduce((s, r) => s + r.pl, 0) >= 0 ? "positive" : "negative"}>
              {rows.reduce((s, r) => s + r.pl, 0) >= 0 ? "+" : ""}
              {(rows.reduce((s, r) => s + r.plPct, 0) / Math.max(rows.length, 1)).toFixed(2)}% TODAY
            </Pill>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <MetricCard
          label="Portfolio Value"
          value={`$${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          delta={1.84}
          accent="positive"
          icon={<DollarSign className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Unrealized P&L"
          value={`$${rows
            .reduce((s, r) => s + r.pl, 0)
            .toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}`}
          delta={Number(
            (rows.reduce((s, r) => s + r.plPct, 0) / Math.max(rows.length, 1)).toFixed(2),
          )}
          hint="LIVE"
          accent="positive"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 xl:col-span-8 panel-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold">
              {selectedHolding?.symbol} · Equity Curve · 6M
            </h3>
            <Pill tone={selectedHolding?.plPct >= 0 ? "positive" : "negative"}>
              {selectedHolding?.plPct >= 0 ? "+" : ""}
              {selectedHolding?.plPct?.toFixed(2)}% RETURN
            </Pill>
          </div>
          <AreaPriceChart data={candleData} height={280} color="var(--color-positive)" />
        </div>

        <div className="col-span-12 xl:col-span-4 panel-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold">Allocation</h3>
            <Pill>BY WEIGHT</Pill>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={rowsWithWeight}
                  dataKey="weight"
                  nameKey="symbol"
                  innerRadius={56}
                  outerRadius={86}
                  stroke="var(--color-panel)"
                  strokeWidth={2}
                >
                  {rowsWithWeight.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px] font-mono">
            {rowsWithWeight.map((h, i) => (
              <div key={h.symbol} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ background: colors[i % colors.length] }}
                />
                <span className="text-foreground">{h.symbol}</span>
                <span className="text-muted-foreground ml-auto">{h.weight}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 panel-elevated p-4 mb-3">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-cyan" />
                <h3 className="text-[13px] font-semibold">Advanced Risk Analytics</h3>
             </div>
             <Pill tone="cyan">QUANT ENGINE</Pill>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
             <div className="bg-background rounded p-3 border border-border/40">
                <div className="text-[10px] uppercase text-muted-foreground mb-1 font-mono tracking-wider">Sharpe Ratio</div>
                <div className="text-[16px] font-semibold text-positive">2.41</div>
             </div>
             <div className="bg-background rounded p-3 border border-border/40">
                <div className="text-[10px] uppercase text-muted-foreground mb-1 font-mono tracking-wider">Sortino Ratio</div>
                <div className="text-[16px] font-semibold text-positive">3.12</div>
             </div>
             <div className="bg-background rounded p-3 border border-border/40">
                <div className="text-[10px] uppercase text-muted-foreground mb-1 font-mono tracking-wider">Portfolio Beta</div>
                <div className="text-[16px] font-semibold text-foreground">1.15</div>
             </div>
             <div className="bg-background rounded p-3 border border-border/40">
                <div className="text-[10px] uppercase text-muted-foreground mb-1 font-mono tracking-wider">Value at Risk (95%)</div>
                <div className="text-[16px] font-semibold text-negative">-$4,250</div>
             </div>
             <div className="bg-background rounded p-3 border border-border/40">
                <div className="text-[10px] uppercase text-muted-foreground mb-1 font-mono tracking-wider">Max Drawdown</div>
                <div className="text-[16px] font-semibold text-warn">-14.2%</div>
             </div>
          </div>
        </div>

        <div className="col-span-12 panel-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold">Holdings</h3>
            <Pill tone="cyan">{positions.length} active positions</Pill>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] font-mono">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <th className="py-2 px-2 cursor-pointer hover:text-foreground transition" onClick={() => requestSort("symbol")}>Symbol {sortConfig?.key === "symbol" && (sortConfig.direction === "asc" ? "↑" : "↓")}</th>
                  <th className="py-2 px-2 text-right cursor-pointer hover:text-foreground transition" onClick={() => requestSort("shares")}>Shares {sortConfig?.key === "shares" && (sortConfig.direction === "asc" ? "↑" : "↓")}</th>
                  <th className="py-2 px-2 text-right cursor-pointer hover:text-foreground transition" onClick={() => requestSort("avgPrice")}>Avg Cost {sortConfig?.key === "avgPrice" && (sortConfig.direction === "asc" ? "↑" : "↓")}</th>
                  <th className="py-2 px-2 text-right cursor-pointer hover:text-foreground transition" onClick={() => requestSort("last")}>Last {sortConfig?.key === "last" && (sortConfig.direction === "asc" ? "↑" : "↓")}</th>
                  <th className="py-2 px-2 text-right cursor-pointer hover:text-foreground transition" onClick={() => requestSort("value")}>Mkt Value {sortConfig?.key === "value" && (sortConfig.direction === "asc" ? "↑" : "↓")}</th>
                  <th className="py-2 px-2 text-right cursor-pointer hover:text-foreground transition" onClick={() => requestSort("pl")}>Unreal P&L {sortConfig?.key === "pl" && (sortConfig.direction === "asc" ? "↑" : "↓")}</th>
                  <th className="py-2 px-2 text-right cursor-pointer hover:text-foreground transition" onClick={() => requestSort("plPct")}>% Return {sortConfig?.key === "plPct" && (sortConfig.direction === "asc" ? "↑" : "↓")}</th>
                  <th className="py-2 px-2 text-right cursor-pointer hover:text-foreground transition" onClick={() => requestSort("weight")}>Weight {sortConfig?.key === "weight" && (sortConfig.direction === "asc" ? "↑" : "↓")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r) => (
                  <tr
                    key={r.symbol}
                    onClick={() => setSelectedTicker(r.symbol)}
                    className={`border-b border-border/40 cursor-pointer transition hover:bg-panel-elevated/60 ${
                      selectedTicker === r.symbol ? "bg-panel-elevated/60" : ""
                    }`}
                  >
                    <td className="py-2 px-2 text-cyan">{r.symbol}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{r.shares}</td>
                    <td className="py-2 px-2 text-right tabular-nums">${r.avgPrice.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">${r.last.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      ${r.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td
                      className={`py-2 px-2 text-right tabular-nums ${r.pl >= 0 ? "text-positive" : "text-negative"}`}
                    >
                      {r.pl >= 0 ? "+" : ""}$
                      {r.pl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td
                      className={`py-2 px-2 text-right tabular-nums ${r.plPct >= 0 ? "text-positive" : "text-negative"}`}
                    >
                      {r.plPct >= 0 ? "+" : ""}
                      {r.plPct}%
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">{r.weight}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-span-12 panel-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold">Execution History</h3>

            <Pill tone="cyan">{history.length} trades</Pill>
          </div>

          {history.length === 0 ? (
            <div className="rounded-md border border-border/60 bg-panel/40 p-4 text-[12px] text-muted-foreground">
              No simulated trades executed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] font-mono">
                <thead>
                  <tr className="border-b border-border/60 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 px-2">Type</th>

                    <th className="py-2 px-2">Symbol</th>

                    <th className="py-2 px-2 text-right">Shares</th>

                    <th className="py-2 px-2 text-right">Price</th>

                    <th className="py-2 px-2 text-right">Notional</th>

                    <th className="py-2 px-2 text-right">Time</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((trade) => (
                    <tr
                      key={trade.id}
                      className="border-b border-border/40 hover:bg-panel-elevated/40"
                    >
                      <td className="py-2 px-2">
                        <Pill tone={trade.type === "BUY" ? "positive" : "negative"}>{trade.type}</Pill>
                      </td>

                      <td className="py-2 px-2 text-cyan">{trade.symbol}</td>

                      <td className="py-2 px-2 text-right tabular-nums">{trade.shares}</td>

                      <td className="py-2 px-2 text-right tabular-nums">
                        ${trade.price.toFixed(2)}
                      </td>

                      <td className="py-2 px-2 text-right tabular-nums">
                        $
                        {(trade.shares * trade.price).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </td>

                      <td className="py-2 px-2 text-right text-muted-foreground">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

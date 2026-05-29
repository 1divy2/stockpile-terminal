import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";

import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { useMarketStore } from "@/lib/market/market-state";
import { usePaperTradingStore } from "@/lib/paper-trading/paper-trading-store";
import { formatCurrency, formatPercent, getChangeColor } from "@/utils/format";

export function ActivePositions() {
  useMarketTickers();

  const engine = useMarketStore((s) => s.engine);

  const { positions } = usePaperTradingStore();

  // No paper trading positions — show empty state
  if (positions.length === 0) {
    return (
      <div className="panel-elevated col-span-12 p-4 xl:col-span-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              Portfolio
            </div>

            <h3 className="mt-1 text-[14px] font-semibold">Active Positions</h3>
          </div>

          <div className="rounded-full border border-border/60 bg-panel px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            0 OPEN
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Wallet className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <div className="text-[13px] text-muted-foreground">No active positions</div>
          <div className="text-[11px] text-muted-foreground/60 mt-1">
            Trade on the Markets page to get started
          </div>
        </div>
      </div>
    );
  }

  // Compute real positions data
  const computedPositions = positions.map((pos) => {
    const ticker = engine.getTicker(pos.symbol);
    const current = ticker?.price ?? pos.avgPrice;
    const pnlPct = ((current - pos.avgPrice) / pos.avgPrice) * 100;
    const exposure = current * pos.shares;

    return {
      symbol: pos.symbol,
      side: "LONG" as const,
      entry: pos.avgPrice,
      shares: pos.shares,
      current,
      pnlPct,
      exposure,
    };
  });

  const totalExposure = computedPositions.reduce((sum, p) => sum + p.exposure, 0);

  return (
    <div className="panel-elevated col-span-12 p-4 xl:col-span-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            Portfolio
          </div>

          <h3 className="mt-1 text-[14px] font-semibold">Active Positions</h3>
        </div>

        <div className="rounded-full border border-border/60 bg-panel px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan">
          {positions.length} OPEN
        </div>
      </div>

      <div className="space-y-2">
        {computedPositions.map((position) => {
          const positive = position.pnlPct >= 0;
          const allocation = totalExposure > 0 ? (position.exposure / totalExposure) * 100 : 0;

          return (
            <div
              key={position.symbol}
              className="rounded-xl border border-border/60 bg-panel/40 p-3 transition-colors hover:border-cyan/30"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] text-foreground">{position.symbol}</span>

                    <div className="rounded-full bg-positive/10 text-positive px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em]">
                      {position.side}
                    </div>

                    <div className="rounded-full border border-cyan/20 bg-cyan/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em] text-cyan">
                      {allocation.toFixed(1)}%
                    </div>
                  </div>

                  <div className="mt-2 flex gap-4 text-[11px] font-mono text-muted-foreground">
                    <div>
                      Entry{" "}
                      <span className="text-foreground">{formatCurrency(position.entry)}</span>
                    </div>

                    <div>
                      Current{" "}
                      <span className="text-foreground">{formatCurrency(position.current)}</span>
                    </div>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6">
                    <div
                      className={`h-full rounded-full ${
                        allocation >= 30 ? "bg-negative" : allocation >= 18 ? "bg-cyan" : "bg-positive"
                      }`}
                      style={{
                        width: `${Math.min(allocation, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`flex items-center justify-end gap-1 text-[13px] font-semibold ${getChangeColor(position.pnlPct)}`}
                  >
                    {positive ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}

                    {formatPercent(position.pnlPct)}
                  </div>

                  <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                    {formatCurrency(position.exposure)}
                  </div>

                  <div className="mt-1 text-[10px] font-mono text-cyan">
                    {position.shares} shares
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

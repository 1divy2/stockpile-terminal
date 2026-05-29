import { TrendingUp, TrendingDown } from "lucide-react";

import { useMarketStore } from "@/lib/market/market-state";
import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { formatPrice, formatPercent, getChangeColor } from "@/utils/format";

// Map ETF proxies to their index display names
const INDEX_MAP: Record<string, string> = {
  SPY: "S&P 500",
  QQQ: "NASDAQ 100",
  GLD: "Gold",
  TLT: "US Treasuries",
};

export function MarketOverview() {
  useMarketTickers();
  const engine = useMarketStore((s) => s.engine);

  const indices = Object.keys(INDEX_MAP)
    .map((symbol) => {
      const ticker = engine.getTicker(symbol);
      if (!ticker) return null;
      return {
        symbol,
        name: INDEX_MAP[symbol],
        price: ticker.price,
        changePct: ticker.changePct,
      };
    })
    .filter(Boolean) as {
    symbol: string;
    name: string;
    price: number;
    changePct: number;
  }[];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {indices.map((index) => {
        const positive = index.changePct >= 0;

        return (
          <div key={index.symbol} className="panel-elevated p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                  {index.symbol}
                </div>

                <h3 className="mt-2 text-[18px] font-semibold tracking-tight">
                  {formatPrice(index.price)}
                </h3>

                <div className="mt-1 text-[12px] text-muted-foreground">{index.name}</div>
              </div>

              <div
                className={`rounded-lg p-2 ${
                  positive ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
                }`}
              >
                {positive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
            </div>

            <div className={`mt-4 text-[13px] font-semibold ${getChangeColor(index.changePct)}`}>
              {formatPercent(index.changePct)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

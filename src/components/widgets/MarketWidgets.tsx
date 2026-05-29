import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { Sparkline } from "@/components/widgets/Sparkline";
import { cn } from "@/lib/utils";
import { formatPrice, formatPercent, formatCompact, getChangeColor } from "@/utils/format";
import type { MarketTicker } from "@/types/market";

export function SectorHeatmap() {
  const { data: liveTickers = [] } = useMarketTickers();

  const sectorMap = liveTickers.reduce(
    (acc, ticker) => {
      const sector = ticker.sector || "Unknown";

      if (!acc[sector]) {
        acc[sector] = {
          name: sector,

          total: 0,

          count: 0,
        };
      }

      acc[sector].total += ticker.changePct;

      acc[sector].count += 1;

      return acc;
    },
    {} as Record<
      string,
      {
        name: string;

        total: number;

        count: number;
      }
    >,
  );

  const sectors = Object.values(sectorMap).map((s) => ({
    name: s.name,

    changePct: s.total / s.count,

    weight: s.count * 8,
  }));

  const total = sectors.reduce((s, x) => s + x.weight, 0);

  return (
    <div className="grid grid-cols-12 gap-1 h-[260px]">
      {sectors.map((s) => {
        const span = Math.max(2, Math.round((s.weight / total) * 12));

        const colorPct = Math.min(100, Math.abs(s.changePct) * 35);

        const isUp = s.changePct >= 0;

        return (
          <div
            key={s.name}
            style={{
              gridColumn: `span ${span} / span ${span}`,
            }}
            className={cn(
              "relative rounded-md border border-border/60 p-2 overflow-hidden flex flex-col justify-between transition",
              "hover:border-border",
            )}
          >
            <div
              className="absolute inset-0 opacity-80"
              style={{
                background: isUp
                  ? `linear-gradient(135deg, color-mix(in oklab, var(--color-positive) ${colorPct}%, transparent), transparent)`
                  : `linear-gradient(135deg, color-mix(in oklab, var(--color-negative) ${colorPct}%, transparent), transparent)`,
              }}
            />

            <div className="relative text-[11px] font-medium leading-tight">{s.name}</div>

            <div className="relative flex items-baseline justify-between font-mono">
              <span className={cn("text-[13px] tabular-nums", getChangeColor(s.changePct))}>
                {formatPercent(s.changePct)}
              </span>

              <span className="text-[10px] text-muted-foreground">{s.weight}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type MarketTableProps = {
  tickers?: MarketTicker[];

  limit?: number;
};

export function MarketTable({
  tickers,

  limit = 8,
}: MarketTableProps) {
  const rows = (tickers ?? []).slice(0, limit);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
            <th className="py-2 px-2 font-medium">Symbol</th>
            <th className="py-2 px-2 font-medium">Sector</th>
            <th className="py-2 px-2 font-medium text-right">Price</th>
            <th className="py-2 px-2 font-medium text-right">Change</th>
            <th className="py-2 px-2 font-medium text-right">Trend</th>
            <th className="py-2 px-2 font-medium text-right">Volume</th>
            <th className="py-2 px-2 font-medium text-right">Market Cap</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((t) => {
            const marketCap = t.marketCap ?? 0;
            const volume = t.volume ?? 0;

            return (
              <tr
                key={t.symbol}
                className="border-b border-border/40 transition hover:bg-panel-elevated/60"
              >
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded bg-panel-elevated text-[10px] text-cyan">
                      {t.symbol[0]}
                    </div>

                    <div>
                      <div className="font-semibold">{t.symbol}</div>

                      <div className="max-w-[140px] truncate font-sans text-[10px] text-muted-foreground">
                        {t.name ?? t.symbol}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-2 px-2 font-sans text-muted-foreground">{t.sector ?? "—"}</td>

                <td className="py-2 px-2 text-right tabular-nums">${formatPrice(t.price)}</td>

                <td
                  className={cn("py-2 px-2 text-right tabular-nums", getChangeColor(t.changePct))}
                >
                  {formatPercent(t.changePct)}
                </td>

                <td className="py-2 px-2 min-w-[120px]">
                  <Sparkline
                    seed={t.symbol.length}
                    trend={t.changePct}
                    height={34}
                    color={t.changePct >= 0 ? "var(--color-positive)" : "var(--color-negative)"}
                  />
                </td>

                <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">
                  {volume > 0 ? formatCompact(volume) : "—"}
                </td>

                <td className="py-2 px-2 text-right tabular-nums">
                  {marketCap > 0 ? formatCompact(marketCap) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

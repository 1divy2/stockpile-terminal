import { useMarketStore } from "@/lib/market/market-state";
import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { getSectorPerformance, computeMarketBreadth } from "@/utils/market-helpers";
import { formatPercent } from "@/utils/format";

export function MarketBriefing() {
  useMarketTickers();
  const tickers = useMarketStore((s) => s.tickers);

  const sectors = getSectorPerformance(tickers);
  const breadth = computeMarketBreadth(tickers);

  const topSector = sectors[0];
  const bottomSector = sectors[sectors.length - 1];
  const bigMovers = tickers.filter((t) => Math.abs(t.changePct) > 2);

  const briefings = [
    {
      label: "Sector Leadership",
      title: topSector
        ? `${topSector.name} leading with ${formatPercent(topSector.avgChange)} avg move`
        : "Awaiting market data",
      body: topSector
        ? `${topSector.name} sector (${topSector.tickerCount} instruments) is outperforming, led by ${topSector.topMover}.${bottomSector && bottomSector !== topSector ? ` ${bottomSector.name} lagging at ${formatPercent(bottomSector.avgChange)}.` : ""}`
        : "Market data is loading. Sector analysis will appear once ticker data is available.",
      tags: topSector
        ? [
            topSector.name,
            topSector.topMover,
            ...(bottomSector && bottomSector !== topSector ? [bottomSector.name] : []),
          ]
        : [],
    },
    {
      label: "Market Breadth",
      title: `${breadth.positive} of ${breadth.total} instruments advancing`,
      body:
        breadth.total > 0
          ? `Advance/decline ratio is ${breadth.advanceDeclineRatio === Infinity ? "all positive" : breadth.advanceDeclineRatio.toFixed(2)}. ${breadth.positive > breadth.negative ? "Net positive breadth suggests broad-based buying." : breadth.positive < breadth.negative ? "Net negative breadth suggests broad selling pressure." : "Breadth is neutral — markets are mixed."}`
          : "Awaiting ticker data for breadth calculation.",
      tags: ["A/D Ratio", `${breadth.positive}↑`, `${breadth.negative}↓`],
    },
    {
      label: "Notable Movers",
      title:
        bigMovers.length > 0
          ? `${bigMovers.length} instrument${bigMovers.length > 1 ? "s" : ""} moving >2%`
          : "No large moves today",
      body:
        bigMovers.length > 0
          ? bigMovers
              .slice(0, 3)
              .map(
                (t) =>
                  `${t.symbol} ${t.changePct > 0 ? "up" : "down"} ${formatPercent(Math.abs(t.changePct))} (${t.sector || t.assetClass || "—"})`,
              )
              .join(". ") + "."
          : "All tracked instruments are within a ±2% range today. Low volatility session.",
      tags: bigMovers.length > 0 ? bigMovers.slice(0, 3).map((t) => t.symbol) : ["Low Vol"],
    },
  ];

  return (
    <div className="space-y-3">
      {briefings.map((briefing) => (
        <div key={briefing.label} className="panel-elevated p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan">
              {briefing.label}
            </div>

            <div className="text-[10px] font-mono text-muted-foreground">Computed</div>
          </div>

          <h3 className="text-[13px] font-semibold leading-snug">{briefing.title}</h3>

          <p className="mt-2 text-[12px] leading-6 text-muted-foreground">{briefing.body}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {briefing.tags.map((tag) => (
              <div
                key={tag}
                className="rounded-md border border-border/60 bg-panel px-2 py-1 text-[10px] font-mono text-muted-foreground"
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

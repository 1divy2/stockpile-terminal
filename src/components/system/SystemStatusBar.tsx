import { motion } from "framer-motion";

import { Activity, BarChart3, Clock, Database } from "lucide-react";

import { useMarketStore } from "@/lib/market/market-state";
import { getMarketSession } from "@/lib/market/session";
import { computeMarketBreadth } from "@/utils/market-helpers";
import { formatRelativeTime } from "@/utils/format";

export function SystemStatusBar() {
  const tickers = useMarketStore((s) => s.tickers);
  const lastUpdated = useMarketStore((s) => s.lastUpdated);

  const session = getMarketSession();
  const breadth = computeMarketBreadth(tickers);

  // Data freshness status
  const dataStatus = (() => {
    if (!lastUpdated) return { label: "OFFLINE", tone: "text-negative" };
    const age = Date.now() - lastUpdated;
    if (age < 60_000) return { label: "LIVE", tone: "text-positive" };
    if (age < 600_000) return { label: "CACHED", tone: "text-warn" };
    return { label: "STALE", tone: "text-negative" };
  })();

  const sessionColor =
    session.tone === "positive" ? "text-positive" : session.tone === "warn" ? "text-warn" : "text-negative";

  const systems = [
    {
      label: "TICKERS",
      value: `${tickers.length} TRACKED`,
      tone: "text-cyan",
      icon: BarChart3,
    },
    {
      label: "DATA",
      value: dataStatus.label,
      tone: dataStatus.tone,
      icon: Database,
    },
    {
      label: "SESSION",
      value: session.label,
      tone: sessionColor,
      icon: Activity,
    },
    {
      label: "UPDATED",
      value: lastUpdated ? formatRelativeTime(lastUpdated) : "—",
      tone: "text-muted-foreground",
      icon: Clock,
    },
  ];

  // Real market breadth summary for scrolling feed
  const feedItems = [
    `${breadth.positive} of ${breadth.total} instruments positive`,
    `Market breadth: ${breadth.positive > breadth.negative ? "net positive" : breadth.positive < breadth.negative ? "net negative" : "neutral"}`,
    `Advance/Decline: ${breadth.positive}/${breadth.negative}`,
    session.description,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="panel-elevated mb-4 overflow-hidden"
    >
      {/* Top Status */}
      <div className="flex flex-col gap-4 border-b border-border/60 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        {/* Left */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-panel px-3 py-1.5">
            <span
              className={`pulse-dot inline-block h-1.5 w-1.5 rounded-full ${
                session.tone === "positive"
                  ? "bg-positive"
                  : session.tone === "warn"
                    ? "bg-warn"
                    : "bg-negative"
              }`}
            />

            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {session.label}
            </span>
          </div>

          <div className="hidden h-4 w-px bg-border/60 lg:block" />

          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span>
              {breadth.positive} ↑ {breadth.negative} ↓ of {breadth.total} instruments
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {systems.map((system) => {
            const Icon = system.icon;

            return (
              <div
                key={system.label}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-panel/60 px-3 py-2"
              >
                <div className={`rounded-md bg-background/60 p-1.5 ${system.tone}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <div className="leading-tight">
                  <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                    {system.label}
                  </div>

                  <div className="text-[11px] font-semibold">{system.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Feed */}
      <div className="relative h-10 overflow-hidden bg-panel/30">
        <div className="ticker-track flex h-full w-max items-center gap-10 whitespace-nowrap px-4">
          {[...feedItems, ...feedItems].map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-[11px]">
              <Activity className="h-3.5 w-3.5 text-cyan" />

              <span className="text-muted-foreground">{item}</span>

              <span className="text-border">•</span>
            </div>
          ))}
        </div>

        {/* Gradient fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-panel to-transparent" />

        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-panel to-transparent" />
      </div>
    </motion.div>
  );
}

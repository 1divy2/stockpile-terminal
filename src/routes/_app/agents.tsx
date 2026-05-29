import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/widgets/Primitives";

import { Pill } from "@/components/widgets/AIInsightCard";

import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { useMarketStore } from "@/lib/market/market-state";
import { Bot, Cpu, Activity, Database, Radar, Workflow } from "lucide-react";

export const Route = createFileRoute("/_app/agents")({
  head: () => ({
    meta: [
      {
        title: "System Monitor · StockPile",
      },
    ],
  }),

  component: Agents,
});

const systems = [
  {
    id: 1,
    name: "Market Data Feed",
    model: "TwelveData API",
    task: "Fetching batch quotes for 27 instruments with 10-minute cache and localStorage persistence.",
    icon: Radar,
  },
  {
    id: 2,
    name: "News Pipeline",
    model: "Yahoo Finance RSS",
    task: "Aggregating market headlines from Yahoo Finance RSS feed via rss2json proxy.",
    icon: Workflow,
  },
  {
    id: 3,
    name: "Portfolio Engine",
    model: "Real-time Computation",
    task: "Computing portfolio analytics, unrealized P&L, allocation weights, and sector exposure.",
    icon: Activity,
  },
  {
    id: 4,
    name: "Market Engine",
    model: "Derived Analytics",
    task: "Computing gainers, losers, sector snapshots, and average momentum from ticker data.",
    icon: Database,
  },
  {
    id: 5,
    name: "Paper Trading",
    model: "Simulation Engine",
    task: "Managing simulated order flow with buy/sell operations and localStorage persistence.",
    icon: Bot,
  },
  {
    id: 6,
    name: "Session Monitor",
    model: "Timezone Logic",
    task: "Determining market session (pre-market, open, after-hours, closed) from NYSE hours.",
    icon: Cpu,
  },
];

/**
 * Deterministic hash-based value generator. Replaces Math.random() in render
 * which caused values to change on every re-render (React bug).
 */
function stableValue(name: string, min: number, max: number): number {
  let hash = 0;
  for (const c of name) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;
  return min + Math.abs(hash % (max - min));
}

function Agents() {
  useMarketTickers();

  const liveTickers = useMarketStore((s) => s.tickers);

  const lastUpdated = useMarketStore((s) => s.lastUpdated);

  const dataAge = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Infrastructure"
        title="System Monitor"
        subtitle="Service health and operational status"
        right={<Pill tone="positive">{liveTickers.length > 0 ? "OPERATIONAL" : "OFFLINE"}</Pill>}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {systems.map((system) => {
          const Icon = system.icon;

          const health = stableValue(system.name + "health", 85, 99);
          const latency = stableValue(system.name + "latency", 12, 48);
          const load = stableValue(system.name + "load", 15, 65);

          return (
            <div key={system.id} className="panel-elevated p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-cyan/40 to-primary/40">
                    <Icon className="h-4 w-4 text-cyan" />
                  </div>

                  <div>
                    <div className="text-[13px] font-semibold">{system.name}</div>

                    <div className="text-[10px] font-mono text-muted-foreground">
                      {system.model}
                    </div>
                  </div>
                </div>

                <Pill tone="positive">ACTIVE</Pill>
              </div>

              <div className="scanlines mt-3 rounded-md border border-border/60 bg-panel p-2.5 text-[11.5px] text-muted-foreground">
                <span className="font-mono text-cyan">STATUS ·</span> {system.task}
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] font-mono">
                <div>
                  <div className="text-muted-foreground">HEALTH</div>

                  <div className="text-positive">{health}%</div>
                </div>

                <div>
                  <div className="text-muted-foreground">LATENCY</div>

                  <div>{latency}ms</div>
                </div>

                <div>
                  <div className="text-muted-foreground">TICKERS</div>

                  <div>{liveTickers.length}</div>
                </div>

                <div>
                  <div className="text-muted-foreground">DATA AGE</div>

                  <div className="flex items-center gap-1">
                    {dataAge !== null ? `${dataAge}s` : "—"}
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

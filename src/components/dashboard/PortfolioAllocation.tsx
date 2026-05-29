import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

import { PortfolioAnalytics } from "@/lib/market/portfolio-engine";

type Props = {
  analytics: PortfolioAnalytics;
};

const COLORS = ["#22c55e", "#06b6d4", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444"];

export function PortfolioAllocation({ analytics }: Props) {
  const allocationData = analytics.allocations.slice(0, 6);

  const sectorData = Object.entries(analytics.sectorExposure).map(([sector, value]) => ({
    sector,

    value: Number(value.toFixed(1)),
  }));

  return (
    <div className="panel-elevated flex h-full flex-col gap-5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.28em] text-cyan">
            Portfolio Intelligence
          </div>

          <h3 className="text-lg font-semibold">Allocation Overview</h3>
        </div>

        <div className="rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan">
          Live Analytics
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Holdings Allocation</div>

            <div className="text-xs text-muted-foreground">Top positions</div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  dataKey="allocationPct"
                  nameKey="symbol"
                  innerRadius={68}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {allocationData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, "Allocation"]}
                  contentStyle={{
                    background: "rgba(5,8,22,0.96)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    color: "white",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {allocationData.map((allocation, index) => (
              <div
                key={allocation.symbol}
                className="flex items-center gap-2 rounded-full border border-white/6 bg-white/[0.03] px-3 py-1 text-xs"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: COLORS[index % COLORS.length],
                  }}
                />

                <span>{allocation.symbol}</span>

                <span className="text-muted-foreground">{allocation.allocationPct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Sector Exposure</div>

            <div className="text-xs text-muted-foreground">Diversification</div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData}>
                <XAxis
                  dataKey="sector"
                  tick={{
                    fill: "var(--color-muted-foreground)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fill: "var(--color-muted-foreground)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, "Exposure"]}
                  contentStyle={{
                    background: "rgba(5,8,22,0.96)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    color: "white",
                  }}
                />

                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3">
              <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Diversification
              </div>

              <div className="text-2xl font-semibold">
                {analytics.diversificationScore.toFixed(0)}
              </div>
            </div>

            <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3">
              <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Largest Position
              </div>

              <div className="text-2xl font-semibold">{analytics.largestPosition}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";

import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const seeded = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

function generateSeries(seed: number, n = 60, base = 100, vol = 0.02) {
  const r = seeded(seed);
  const out: { t: number; v: number }[] = [];
  let last = base;
  for (let i = 0; i < n; i++) {
    last = +(last + (r() - 0.47) * base * vol).toFixed(2);
    out.push({ t: i, v: last });
  }
  return out;
}

function generatePrediction(seed: number, history = 60, forecast = 24, base = 100) {
  const hist = generateSeries(seed, history, base, 0.018);
  const last = hist[hist.length - 1].v;
  const r = seeded(seed + 99);
  const fc: { t: number; mid: number; lo: number; hi: number }[] = [];
  let m = last;
  for (let i = 0; i < forecast; i++) {
    m = +(m + (r() - 0.42) * base * 0.012).toFixed(2);
    const band = base * 0.015 * Math.sqrt(i + 1);
    fc.push({ t: history + i, mid: m, lo: +(m - band).toFixed(2), hi: +(m + band).toFixed(2) });
  }
  return { hist, fc, last };
}

type CandlePoint = {
  timestamp: number;

  open?: number;

  high?: number;

  low?: number;

  close?: number;

  volume?: number;

  price: number;
};

function formatXAxisLabel(timestamp: number, totalPoints: number) {
  const date = new Date(timestamp * 1000);

  if (totalPoints <= 120) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTooltipLabel(timestamp: number, totalPoints: number) {
  const date = new Date(timestamp * 1000);

  if (totalPoints <= 120) {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AreaPriceChart({
  data = [],
  height = 220,
  color = "var(--color-positive)",
}: {
  data?: CandlePoint[];

  height?: number;

  color?: string;
}) {
  const totalPoints = data.length;

  const chartData = data.map((d) => ({
    timestamp: d.timestamp,

    label: formatXAxisLabel(d.timestamp, totalPoints),

    fullLabel: formatTooltipLabel(d.timestamp, totalPoints),

    price: d.price,
  }));

  const minPrice = chartData.length ? Math.min(...chartData.map((d) => d.price)) : 0;

  const maxPrice = chartData.length ? Math.max(...chartData.map((d) => d.price)) : 0;

  const id = "market-chart-gradient";

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 8,
            bottom: 0,
            left: -18,
          }}
        >
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />

              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--color-grid-line)" strokeDasharray="2 4" vertical={false} />

          <XAxis
            dataKey="label"
            minTickGap={32}
            tick={{
              fill: "var(--color-muted-foreground)",
              fontSize: 10,
            }}
            stroke="var(--color-grid-line)"
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            tick={{
              fill: "var(--color-muted-foreground)",
              fontSize: 10,
            }}
            tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
            stroke="var(--color-grid-line)"
            tickLine={false}
            axisLine={false}
            width={64}
            domain={[minPrice - 1, maxPrice + 1]}
          />

          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel || ""}
            contentStyle={{
              background: "rgba(10,14,25,0.96)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              fontSize: 12,
              backdropFilter: "blur(12px)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
            }}
            labelStyle={{
              color: "var(--color-muted-foreground)",
              marginBottom: 6,
              fontSize: 11,
            }}
            itemStyle={{
              color: "var(--color-positive)",
              fontWeight: 600,
            }}
            cursor={{
              stroke: "rgba(255,255,255,0.25)",
              strokeWidth: 1,
            }}
          />

          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${id})`}
            isAnimationActive={false}
            dot={false}
            activeDot={{
              r: 6,
              fill: color,
              stroke: "#ffffff",
              strokeWidth: 3,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CandlestickChart({
  data = [],
  height = 320,
}: {
  data?: CandlePoint[];

  height?: number;
}) {
  const totalPoints = data.length;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = data.map((d, index) => ({
    timestamp: d.timestamp,

    index,

    label: formatXAxisLabel(d.timestamp, totalPoints),

    fullLabel: formatTooltipLabel(d.timestamp, totalPoints),

    open: d.open ?? d.price,

    high: d.high ?? d.price,

    low: d.low ?? d.price,

    close: d.close ?? d.price,

    volume: d.volume ?? 0,

    bullish: (d.close ?? d.price) >= (d.open ?? d.price),
  }));

  const minPrice = chartData.length ? Math.min(...chartData.map((d) => d.low)) : 0;

  const maxPrice = chartData.length ? Math.max(...chartData.map((d) => d.high)) : 0;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            bottom: 0,
            left: -14,
          }}
          onMouseMove={(state) => {
            if (typeof state?.activeTooltipIndex === "number") {
              setHoveredIndex(state.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <CartesianGrid stroke="var(--color-grid-line)" strokeDasharray="2 4" vertical={false} />

          {hoveredIndex !== null && (
            <ReferenceLine
              x={chartData[hoveredIndex]?.label}
              stroke="rgba(255,255,255,0.18)"
              strokeDasharray="4 4"
            />
          )}

          {hoveredIndex !== null && (
            <ReferenceLine
              y={chartData[hoveredIndex]?.close}
              stroke="rgba(34,211,238,0.28)"
              strokeDasharray="4 4"
            />
          )}

          <XAxis
            dataKey="label"
            minTickGap={32}
            tick={{
              fill: "var(--color-muted-foreground)",
              fontSize: 10,
            }}
            stroke="var(--color-grid-line)"
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            tick={{
              fill: "var(--color-muted-foreground)",
              fontSize: 10,
            }}
            tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
            stroke="var(--color-grid-line)"
            tickLine={false}
            axisLine={false}
            width={64}
            domain={[minPrice - 1, maxPrice + 1]}
          />

          <YAxis
            yAxisId="volume"
            orientation="right"
            hide
            domain={[0, (dataMax: number) => dataMax * 4]}
          />

          <Tooltip
            formatter={(value, name) => [
              `$${Number(value).toFixed(2)}`,
              String(name).toUpperCase(),
            ]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel || ""}
            contentStyle={{
              background: "rgba(5,8,22,0.96)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              fontSize: 12,
              backdropFilter: "blur(14px)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
              color: "white",
            }}
            itemStyle={{
              color: "white",
              fontWeight: 600,
            }}
            labelStyle={{
              color: "rgba(255,255,255,0.7)",
              marginBottom: 6,
              fontSize: 11,
            }}
          />

          <Bar
            dataKey="volume"
            yAxisId="volume"
            barSize={6}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`vol-${index}`}
                fill={entry.bullish ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}
              />
            ))}
          </Bar>

          <Line type="monotone" dataKey="high" stroke="transparent" dot={false} activeDot={false} />

          <Bar
            dataKey="close"
            radius={[2, 2, 2, 2]}
            isAnimationActive={false}
            shape={(props: any) => {
              const { x, width, payload, background } = props;

              const chartHeight = background?.height ?? 300;

              const min = background?.yScale?.domain?.()[0] ?? payload.low;

              const max = background?.yScale?.domain?.()[1] ?? payload.high;

              const scaleY = (value: number) => {
                return ((max - value) / (max - min)) * chartHeight;
              };

              const openY = scaleY(payload.open);

              const closeY = scaleY(payload.close);

              const highY = scaleY(payload.high);

              const lowY = scaleY(payload.low);

              const candleX = x + width / 2;

              const candleWidth = Math.max(4, width * 0.55);

              const bullish = payload.bullish;

              const color = bullish ? "var(--color-positive)" : "var(--color-negative)";

              return (
                <g>
                  <line
                    x1={candleX}
                    x2={candleX}
                    y1={highY}
                    y2={lowY}
                    stroke={color}
                    strokeWidth={1.4}
                  />

                  <rect
                    x={candleX - candleWidth / 2}
                    y={Math.min(openY, closeY)}
                    width={candleWidth}
                    height={Math.max(2, Math.abs(closeY - openY))}
                    rx={2}
                    fill={color}
                  />
                </g>
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PredictionChart({
  seed = 42,
  height = 280,
  base = 1140,
}: {
  seed?: number;

  height?: number;

  base?: number;
}) {
  const { hist, fc } = generatePrediction(seed, 60, 24, base);

  const merged = [
    ...hist.map((h) => ({
      t: h.t,
      hist: h.v,
    })),

    ...fc.map((f) => ({
      t: f.t,
      mid: f.mid,
      lo: f.lo,
      hi: f.hi,
      band: [f.lo, f.hi] as [number, number],
    })),
  ];

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={merged}
          margin={{
            top: 8,
            right: 12,
            bottom: 4,
            left: 0,
          }}
        >
          <defs>
            <linearGradient id="pred-band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.35} />

              <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--color-grid-line)" strokeDasharray="2 4" vertical={false} />

          <XAxis
            dataKey="t"
            tick={{
              fill: "var(--color-muted-foreground)",
              fontSize: 10,
            }}
            stroke="var(--color-grid-line)"
            tickLine={false}
          />

          <YAxis
            tick={{
              fill: "var(--color-muted-foreground)",
              fontSize: 10,
            }}
            stroke="var(--color-grid-line)"
            tickLine={false}
            width={48}
            domain={["dataMin - 20", "dataMax + 20"]}
          />

          <Tooltip
            contentStyle={{
              background: "var(--color-panel-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{
              color: "var(--color-muted-foreground)",
            }}
          />

          <Area
            type="monotone"
            dataKey="band"
            stroke="none"
            fill="url(#pred-band)"
            isAnimationActive={false}
          />

          <Line
            type="monotone"
            dataKey="hist"
            stroke="var(--color-positive)"
            strokeWidth={1.8}
            dot={false}
            isAnimationActive={false}
          />

          <Line
            type="monotone"
            dataKey="mid"
            stroke="var(--color-cyan)"
            strokeWidth={1.8}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

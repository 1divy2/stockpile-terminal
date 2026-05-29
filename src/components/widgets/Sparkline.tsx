import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

import { useMemo } from "react";

type SparklineProps = {
  seed?: number;

  height?: number;

  color?: string;

  points?: number;

  trend?: number;
};

/**
 * Generates a geometric Brownian motion series that looks like realistic
 * stock price movements — small random walks with drift, occasional
 * larger moves, and realistic volatility clustering.
 *
 * This replaces the old sin()/cos() wave generator which produced
 * visually unrealistic, obviously periodic patterns.
 */
function generateTrendSeries(seed: number, points: number, trend: number) {
  const data = [];

  // Seeded PRNG for deterministic results across renders
  let s = seed;
  const rand = () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };

  let value = 100;
  const dailyDrift = trend * 0.003; // subtle directional bias
  const baseVol = 0.015; // ~1.5% daily volatility (realistic for equities)

  for (let i = 0; i < points; i++) {
    // Box-Muller transform for normally distributed returns
    const u1 = rand();
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);

    // Occasional volatility spikes (fat tails)
    const volMultiplier = rand() > 0.92 ? 2.2 : 1.0;

    const returnPct = dailyDrift + baseVol * volMultiplier * z;
    value *= 1 + returnPct;

    data.push({
      v: Number(value.toFixed(2)),
    });
  }

  return data;
}

export function Sparkline({
  seed = 1,

  height = 36,

  color = "var(--color-positive)",

  points = 40,

  trend = 0,
}: SparklineProps) {
  const data = useMemo(() => generateTrendSeries(seed, points, trend), [seed, points, trend]);

  const id = `spk-${seed}-${color.replace(/[^\w]/g, "")}`;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 2,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        >
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />

              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <YAxis hide domain={["dataMin", "dataMax"]} />

          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Shared market data computation utilities.
 *
 * These pure functions derive useful aggregate metrics from raw ticker arrays.
 * Used by IntelligenceStream, SystemStatusBar, and other components that need
 * computed market summaries without duplicating logic.
 */

import type { MarketTicker } from "@/types/market";

/* ── Market Breadth ────────────────────────────────────────────────── */

export type MarketBreadth = {
  positive: number;
  negative: number;
  unchanged: number;
  total: number;
  advanceDeclineRatio: number;
};

/**
 * Computes how many tickers are up vs down — a real market breadth indicator.
 */
export function computeMarketBreadth(tickers: MarketTicker[]): MarketBreadth {
  let positive = 0;
  let negative = 0;
  let unchanged = 0;

  for (const t of tickers) {
    if (t.changePct > 0.01) positive++;
    else if (t.changePct < -0.01) negative++;
    else unchanged++;
  }

  return {
    positive,
    negative,
    unchanged,
    total: tickers.length,
    advanceDeclineRatio: negative > 0 ? positive / negative : positive > 0 ? Infinity : 1,
  };
}

/* ── Top Movers ────────────────────────────────────────────────────── */

/**
 * Returns the top N gainers and losers sorted by absolute changePct.
 */
export function getTopMovers(
  tickers: MarketTicker[],
  n = 5,
): { gainers: MarketTicker[]; losers: MarketTicker[] } {
  const sorted = [...tickers].sort((a, b) => b.changePct - a.changePct);

  return {
    gainers: sorted.slice(0, n),
    losers: sorted.slice(-n).reverse(),
  };
}

/* ── Sector Performance ────────────────────────────────────────────── */

export type SectorPerformance = {
  name: string;
  avgChange: number;
  tickerCount: number;
  topMover: string;
};

/**
 * Aggregates ticker performance by sector.
 */
export function getSectorPerformance(tickers: MarketTicker[]): SectorPerformance[] {
  const map = new Map<
    string,
    { totalChange: number; count: number; topMover: string; topChange: number }
  >();

  for (const t of tickers) {
    const sector = t.sector || "Other";
    const entry = map.get(sector) || {
      totalChange: 0,
      count: 0,
      topMover: t.symbol,
      topChange: Math.abs(t.changePct),
    };

    entry.totalChange += t.changePct;
    entry.count++;
    if (Math.abs(t.changePct) > entry.topChange) {
      entry.topMover = t.symbol;
      entry.topChange = Math.abs(t.changePct);
    }

    map.set(sector, entry);
  }

  return Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      avgChange: data.count > 0 ? data.totalChange / data.count : 0,
      tickerCount: data.count,
      topMover: data.topMover,
    }))
    .sort((a, b) => b.avgChange - a.avgChange);
}

/* ── Market Activity Events ────────────────────────────────────────── */

export type MarketEvent = {
  id: string;
  text: string;
  type: "info" | "positive" | "negative" | "neutral";
  timestamp: number;
};

/**
 * Generates real market events from current ticker data.
 * These are factual observations — no fake AI buzzwords.
 */
export function generateMarketEvents(
  tickers: MarketTicker[],
  lastUpdated: number | null,
): MarketEvent[] {
  const events: MarketEvent[] = [];
  const now = lastUpdated ?? Date.now();

  if (tickers.length === 0) return events;

  // Market breadth observation
  const breadth = computeMarketBreadth(tickers);
  events.push({
    id: "breadth",
    text: `Market breadth: ${breadth.positive} of ${breadth.total} tickers positive`,
    type: breadth.positive > breadth.negative ? "positive" : "negative",
    timestamp: now,
  });

  // Top gainer
  const { gainers, losers } = getTopMovers(tickers, 1);
  if (gainers[0]) {
    events.push({
      id: "top-gainer",
      text: `${gainers[0].symbol} leading at ${gainers[0].changePct > 0 ? "+" : ""}${gainers[0].changePct.toFixed(2)}%`,
      type: "positive",
      timestamp: now - 2000,
    });
  }
  if (losers[0]) {
    events.push({
      id: "top-loser",
      text: `${losers[0].symbol} lagging at ${losers[0].changePct.toFixed(2)}%`,
      type: "negative",
      timestamp: now - 4000,
    });
  }

  // Sector snapshot
  const sectors = getSectorPerformance(tickers);
  const topSector = sectors[0];
  const bottomSector = sectors[sectors.length - 1];

  if (topSector && sectors.length > 1) {
    events.push({
      id: "sector-leader",
      text: `${topSector.name} sector leading (avg ${topSector.avgChange > 0 ? "+" : ""}${topSector.avgChange.toFixed(2)}%)`,
      type: "info",
      timestamp: now - 6000,
    });
  }
  if (bottomSector && bottomSector !== topSector) {
    events.push({
      id: "sector-lagger",
      text: `${bottomSector.name} sector lagging (avg ${bottomSector.avgChange.toFixed(2)}%)`,
      type: "neutral",
      timestamp: now - 8000,
    });
  }

  // Large movers (>3% either way)
  const bigMovers = tickers.filter((t) => Math.abs(t.changePct) > 3);
  for (const mover of bigMovers.slice(0, 3)) {
    const direction = mover.changePct > 0 ? "up" : "down";
    events.push({
      id: `big-${mover.symbol}`,
      text: `${mover.symbol} ${direction} ${Math.abs(mover.changePct).toFixed(1)}% — notable ${mover.sector || "market"} move`,
      type: mover.changePct > 0 ? "positive" : "negative",
      timestamp: now - 10000 - Math.random() * 5000,
    });
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

/* ── Seeded PRNG (for deterministic sparklines) ─────────────────────── */

/**
 * A simple seeded PRNG for deterministic pseudo-random values.
 * Used for sparklines and other visual elements that need consistency
 * across renders without real historical data.
 */
export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

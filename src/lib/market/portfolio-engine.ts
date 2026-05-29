import { MarketTicker } from "@/lib/market/market-state";

import { VolatilitySnapshot } from "@/lib/market/volatility-engine";

export type PortfolioPosition = {
  symbol: string;

  shares: number;

  averageCost: number;
};

export type AllocationSnapshot = {
  symbol: string;

  value: number;

  allocationPct: number;

  sector?: string;
};

export type PortfolioAnalytics = {
  totalValue: number;

  totalCost: number;

  unrealizedPnL: number;

  unrealizedPnLPct: number;

  weightedVolatility: number;

  diversificationScore: number;

  largestPosition: string;

  sectorExposure: Record<string, number>;

  allocations: AllocationSnapshot[];
  benchmarkSymbol: string;

  benchmarkReturn: number;

  portfolioReturn: number;

  alpha: number;

  relativePerformance: number;
};

function round(value: number) {
  return Number(value.toFixed(2));
}

export function calculatePortfolioAnalytics(
  positions: PortfolioPosition[],

  tickers: MarketTicker[],

  volatilityMap: Record<string, VolatilitySnapshot>,

  benchmarkSymbol = "SPY",
): PortfolioAnalytics {
  let totalValue = 0;

  let totalCost = 0;

  let weightedVolatility = 0;

  const allocations: AllocationSnapshot[] = [];

  const sectorExposure: Record<string, number> = {};
  const benchmark = tickers.find((t) => t.symbol === benchmarkSymbol);

  const benchmarkReturn = benchmark?.changePct ?? 0;

  for (const position of positions) {
    const ticker = tickers.find((t) => t.symbol === position.symbol);

    if (!ticker) {
      continue;
    }

    const value = ticker.price * position.shares;

    const cost = position.averageCost * position.shares;

    totalValue += value;

    totalCost += cost;

    allocations.push({
      symbol: position.symbol,

      value,

      allocationPct: 0,

      sector: ticker.sector,
    });
  }

  for (const allocation of allocations) {
    allocation.allocationPct = totalValue > 0 ? (allocation.value / totalValue) * 100 : 0;

    const ticker = tickers.find((t) => t.symbol === allocation.symbol);

    const sector = ticker?.sector ?? "Unknown";

    sectorExposure[sector] = (sectorExposure[sector] ?? 0) + allocation.allocationPct;

    const volatility = volatilityMap[allocation.symbol];

    weightedVolatility +=
      (volatility?.annualizedVolatility ?? 0) * (allocation.allocationPct / 100);
  }

  allocations.sort((a, b) => b.allocationPct - a.allocationPct);

  const unrealizedPnL = totalValue - totalCost;

  const unrealizedPnLPct = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;
  const portfolioReturn = unrealizedPnLPct;

  const alpha = portfolioReturn - benchmarkReturn;

  const relativePerformance = alpha;

  const uniqueSectors = Object.keys(sectorExposure).length;

  const diversificationScore = Math.min(100, uniqueSectors * 18 + allocations.length * 4);

  return {
    totalValue: round(totalValue),

    totalCost: round(totalCost),

    unrealizedPnL: round(unrealizedPnL),

    unrealizedPnLPct: round(unrealizedPnLPct),

    weightedVolatility: round(weightedVolatility),

    diversificationScore: round(diversificationScore),

    largestPosition: allocations[0]?.symbol ?? "N/A",

    sectorExposure,
    benchmarkSymbol,

    benchmarkReturn: round(benchmarkReturn),

    portfolioReturn: round(portfolioReturn),

    alpha: round(alpha),

    relativePerformance: round(relativePerformance),

    allocations: allocations.map((allocation) => ({
      ...allocation,

      value: round(allocation.value),

      allocationPct: round(allocation.allocationPct),
    })),
  };
}

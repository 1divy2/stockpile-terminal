export type CandlePoint = {
  timestamp: number;

  price: number;
};

export type VolatilitySnapshot = {
  volatility: number;

  annualizedVolatility: number;

  averageReturn: number;

  maxDrawdown: number;

  trendStrength: number;

  realizedMovement: number;
};

function calculateReturns(candles: CandlePoint[]) {
  const returns: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1]?.price;

    const current = candles[i]?.price;

    if (!prev || !current) {
      continue;
    }

    const r = (current - prev) / prev;

    returns.push(r);
  }

  return returns;
}

function standardDeviation(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;

  return Math.sqrt(variance);
}

function calculateDrawdown(candles: CandlePoint[]) {
  let peak = -Infinity;

  let maxDrawdown = 0;

  for (const candle of candles) {
    if (candle.price > peak) {
      peak = candle.price;
    }

    const drawdown = (peak - candle.price) / peak;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown * 100;
}

export function calculateVolatility(candles: CandlePoint[]): VolatilitySnapshot {
  if (candles.length < 2) {
    return {
      volatility: 0,

      annualizedVolatility: 0,

      averageReturn: 0,

      maxDrawdown: 0,

      trendStrength: 0,

      realizedMovement: 0,
    };
  }

  const returns = calculateReturns(candles);

  const volatility = standardDeviation(returns);

  const annualizedVolatility = volatility * Math.sqrt(252) * 100;

  const averageReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

  const first = candles[0]?.price ?? 0;

  const last = candles[candles.length - 1]?.price ?? 0;

  const realizedMovement = first > 0 ? Math.abs(((last - first) / first) * 100) : 0;

  const trendStrength = averageReturn * 1000;

  const maxDrawdown = calculateDrawdown(candles);

  return {
    volatility: volatility * 100,

    annualizedVolatility,

    averageReturn: averageReturn * 100,

    maxDrawdown,

    trendStrength,

    realizedMovement,
  };
}

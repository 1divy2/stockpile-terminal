

type CandlePoint = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  price: number;
};

// Simple Moving Average
export function calculateSMA(data: CandlePoint[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(data[i].close); // Fallback
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    sma.push(+(sum / period).toFixed(2));
  }
  return sma;
}

// Exponential Moving Average
export function calculateEMA(data: CandlePoint[], period: number): number[] {
  const ema: number[] = [];
  if (data.length === 0) return ema;

  const k = 2 / (period + 1);
  // Seed with SMA
  let sum = 0;
  for (let i = 0; i < Math.min(period, data.length); i++) {
    sum += data[i].close;
  }
  let currentEma = sum / Math.min(period, data.length);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(data[i].close);
      continue;
    }
    if (i === period - 1) {
      ema.push(+currentEma.toFixed(2));
      continue;
    }
    currentEma = data[i].close * k + currentEma * (1 - k);
    ema.push(+currentEma.toFixed(2));
  }
  return ema;
}

// Relative Strength Index
export function calculateRSI(data: CandlePoint[], period = 14): number[] {
  const rsi: number[] = [];
  if (data.length === 0) return rsi;

  let avgGain = 0;
  let avgLoss = 0;

  // First values (first change)
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      rsi.push(50); // Starting default
      continue;
    }

    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;

      if (i === period) {
        avgGain = avgGain / period;
        avgLoss = avgLoss / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(+(100 - 100 / (1 + rs)).toFixed(2));
      } else {
        rsi.push(50);
      }
      continue;
    }

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(+(100 - 100 / (1 + rs)).toFixed(2));
  }

  return rsi;
}

// MACD (Moving Average Convergence Divergence)
export function calculateMACD(
  data: CandlePoint[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);

  const macdLine: number[] = [];
  for (let i = 0; i < data.length; i++) {
    macdLine.push(+(emaFast[i] - emaSlow[i]).toFixed(4));
  }

  // Calculate Signal Line (EMA of MACD Line)
  // Create dummy CandlePoints representing MACD Line values to feed into calculateEMA
  const macdCandles: CandlePoint[] = macdLine.map((val, idx) => ({
    timestamp: data[idx].timestamp,
    open: val,
    high: val,
    low: val,
    close: val,
    price: val,
  }));

  const signalLine = calculateEMA(macdCandles, signalPeriod);
  const histogram: number[] = [];

  for (let i = 0; i < data.length; i++) {
    histogram.push(+(macdLine[i] - signalLine[i]).toFixed(4));
  }

  return { macdLine, signalLine, histogram };
}

// Bollinger Bands
export function calculateBollingerBands(
  data: CandlePoint[],
  period = 20,
  multiplier = 2,
): { middle: number[]; upper: number[]; lower: number[] } {
  const middle = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(data[i].close + 1.0);
      lower.push(data[i].close - 1.0);
      continue;
    }

    let sumSquares = 0;
    const avg = middle[i];
    for (let j = 0; j < period; j++) {
      const diff = data[i - j].close - avg;
      sumSquares += diff * diff;
    }
    const stdDev = Math.sqrt(sumSquares / period);
    upper.push(+(avg + multiplier * stdDev).toFixed(2));
    lower.push(+(avg - multiplier * stdDev).toFixed(2));
  }

  return { middle, upper, lower };
}

// Volume-Weighted Average Price
export function calculateVWAP(data: CandlePoint[]): number[] {
  const vwap: number[] = [];
  let cumulativePV = 0;
  let cumulativeV = 0;

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const typicalPrice = (d.high + d.low + d.close) / 3;
    const vol = d.volume ?? 1;

    cumulativePV += typicalPrice * vol;
    cumulativeV += vol;

    vwap.push(cumulativeV === 0 ? d.close : +(cumulativePV / cumulativeV).toFixed(2));
  }

  return vwap;
}

// Average True Range (Volatility)
export function calculateATR(data: CandlePoint[], period = 14): number[] {
  const atr: number[] = [];
  if (data.length === 0) return atr;

  let trSum = 0;
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      const tr = data[i].high - data[i].low;
      trSum += tr;
      atr.push(+(trSum / 1).toFixed(4));
      continue;
    }

    const highLow = data[i].high - data[i].low;
    const highClose = Math.abs(data[i].high - data[i - 1].close);
    const lowClose = Math.abs(data[i].low - data[i - 1].close);
    
    const tr = Math.max(highLow, highClose, lowClose);
    
    if (i < period) {
      trSum += tr;
      atr.push(+(trSum / (i + 1)).toFixed(4));
      continue;
    }

    const prevAtr = atr[i - 1];
    const currentAtr = (prevAtr * (period - 1) + tr) / period;
    atr.push(+currentAtr.toFixed(4));
  }
  return atr;
}

// Generate technical summary signals
export type TechnicalSignal = {
  verdict: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  rsiVal: number;
  macdVal: number;
  bbState: "OVERBOUGHT" | "OVERSOLD" | "STABLE";
  sma20d: number;
  ema50d: number;
  vwapVal: number;
  atrVal: number;
  reason: string;
};

export function evaluateTechnicals(data: CandlePoint[]): TechnicalSignal {
  const fallback: TechnicalSignal = {
    verdict: "NEUTRAL",
    rsiVal: 50,
    macdVal: 0,
    bbState: "STABLE",
    sma20d: 0,
    ema50d: 0,
    vwapVal: 0,
    atrVal: 0,
    reason: "Insufficient historical data points.",
  };

  if (data.length < 50) return fallback;

  const len = data.length;
  const lastClose = data[len - 1].close;

  const rsi = calculateRSI(data, 14);
  const macd = calculateMACD(data, 12, 26, 9);
  const bb = calculateBollingerBands(data, 20, 2);
  const sma20 = calculateSMA(data, 20);
  const ema50 = calculateEMA(data, 50);
  const vwap = calculateVWAP(data);
  const atr = calculateATR(data, 14);

  const lastRsi = rsi[len - 1];
  const lastMacdHist = macd.histogram[len - 1];
  const lastBbUpper = bb.upper[len - 1];
  const lastBbLower = bb.lower[len - 1];
  const lastSma20 = sma20[len - 1];
  const lastEma50 = ema50[len - 1];
  const lastVwap = vwap[len - 1];
  const lastAtr = atr[len - 1];

  let score = 0;
  const reasonParts: string[] = [];

  // RSI rules
  if (lastRsi > 70) {
    score -= 1;
    reasonParts.push("RSI indicates overbought territory");
  } else if (lastRsi < 30) {
    score += 1;
    reasonParts.push("RSI indicates oversold conditions");
  } else if (lastRsi > 55) {
    score += 0.5;
  } else if (lastRsi < 45) {
    score -= 0.5;
  }

  // MACD rules
  if (lastMacdHist > 0) {
    score += 1.0;
    reasonParts.push("MACD histogram is positive (upward momentum)");
  } else {
    score -= 1.0;
    reasonParts.push("MACD histogram is negative (downward momentum)");
  }

  // Bollinger Bands rules
  let bbState: "OVERBOUGHT" | "OVERSOLD" | "STABLE" = "STABLE";
  if (lastClose >= lastBbUpper) {
    bbState = "OVERBOUGHT";
    score -= 0.5;
    reasonParts.push("Price touches upper Bollinger Band");
  } else if (lastClose <= lastBbLower) {
    bbState = "OVERSOLD";
    score += 0.5;
    reasonParts.push("Price touches lower Bollinger Band");
  }

  // Moving Average Crosses / Price vs MAs
  if (lastClose > lastEma50) {
    score += 0.5;
    reasonParts.push("Price trading above 50-day EMA");
  } else {
    score -= 0.5;
    reasonParts.push("Price trading below 50-day EMA");
  }

  if (lastClose > lastVwap) {
    score += 0.5;
    reasonParts.push("Price above VWAP anchor");
  } else {
    score -= 0.5;
    reasonParts.push("Price below VWAP anchor");
  }
  
  if (lastAtr > (atr[len - 5] || 0) * 1.5) {
    reasonParts.push("Volatility expansion detected");
  }

  let verdict: "POSITIVE" | "NEGATIVE" | "NEUTRAL" = "NEUTRAL";
  if (score >= 1.5) verdict = "POSITIVE";
  else if (score <= -1.5) verdict = "NEGATIVE";

  return {
    verdict,
    rsiVal: +lastRsi.toFixed(2),
    macdVal: +macd.macdLine[len - 1].toFixed(4),
    bbState,
    sma20d: +lastSma20.toFixed(2),
    ema50d: +lastEma50.toFixed(2),
    vwapVal: +lastVwap.toFixed(2),
    atrVal: +lastAtr.toFixed(4),
    reason: reasonParts.join(" · ") || "Technical trends are mixed with no clear direction.",
  };
}

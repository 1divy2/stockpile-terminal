export type BacktestResult = {
  equityCurve: {
    timestamp: number;
    value: number;
  }[];
  trades: {
    id: string;
    type: "BUY" | "SELL";
    symbol: string;
    shares: number;
    price: number;
    timestamp: number;
  }[];
  metrics: {
    totalTrades: number;
    winRate: number;
    realizedPnl: number;
    maxDrawdown: number;
  };
};

export function runBacktest(
  universe: string,
  rebalance: string,
  riskLimit: number,
  stopLoss: number,
  takeProfit: number,
  leverage: number
): BacktestResult {
  const initialCapital = 100000;
  let currentCapital = initialCapital;
  let maxCapital = initialCapital;
  let maxDrawdown = 0;
  
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = 180; // 6 months backtest
  
  const equityCurve: { timestamp: number; value: number }[] = [];
  const trades: BacktestResult["trades"] = [];
  
  // Base win rate depends loosely on strategy settings for realism
  const baseWinRate = universe === "S&P 500" ? 0.55 : 0.48;
  const riskRewardRatio = takeProfit / stopLoss; // e.g. 10/5 = 2
  
  let wins = 0;
  let losses = 0;

  // Generate realistic trades and equity curve
  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * dayMs;
    
    // Chance to trade on this day (10% chance)
    if (Math.random() < 0.1) {
      const isWin = Math.random() < baseWinRate;
      
      // Calculate P&L for this simulated trade bundle
      // We simulate multiple symbols trading at once for volume
      const tradeRisk = currentCapital * (riskLimit / 100) * leverage;
      
      let pnl = 0;
      if (isWin) {
        pnl = tradeRisk * riskRewardRatio * (0.8 + Math.random() * 0.4); // Randomize slightly around target
        wins++;
      } else {
        pnl = -tradeRisk * (0.8 + Math.random() * 0.4); // Randomize around stop loss
        losses++;
      }
      
      currentCapital += pnl;
      
      // Generate some dummy trades for the terminal
      const symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "META", "AMZN", "GOOGL"];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      
      const price = 100 + Math.random() * 400;
      const shares = Math.floor((tradeRisk / price) * 10);
      
      // Add BUY
      trades.push({
        id: crypto.randomUUID(),
        type: "BUY",
        symbol,
        shares,
        price,
        timestamp: timestamp - (dayMs / 2) // Bought earlier in the day
      });
      
      // Add SELL
      trades.push({
        id: crypto.randomUUID(),
        type: "SELL",
        symbol,
        shares,
        price: price + (pnl / shares),
        timestamp: timestamp
      });
    }
    
    // Add noise to daily equity curve even if no trades closed
    const dailyNoise = currentCapital * (Math.random() * 0.005 - 0.002);
    currentCapital += dailyNoise;
    
    if (currentCapital > maxCapital) {
      maxCapital = currentCapital;
    }
    
    const drawdown = (maxCapital - currentCapital) / maxCapital;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
    
    equityCurve.push({
      timestamp,
      value: currentCapital
    });
  }
  
  // Sort trades newest first for the UI
  trades.sort((a, b) => b.timestamp - a.timestamp);
  
  const totalTrades = wins + losses;
  
  return {
    equityCurve,
    trades,
    metrics: {
      totalTrades: totalTrades * 2, // Buy and Sell
      winRate: totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0,
      realizedPnl: currentCapital - initialCapital,
      maxDrawdown: maxDrawdown * 100
    }
  };
}

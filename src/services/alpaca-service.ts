export type BrokerageMode = "PAPER" | "LIVE";

export class AlpacaService {
  private static liveBalance = 250000;
  
  static async submitLiveOrder(symbol: string, qty: number, side: "BUY" | "SELL", type: "MARKET" | "LIMIT" | "STOP", timeInForce: "DAY" | "GTC"): Promise<{ id: string, status: string }> {
    return new Promise((resolve) => {
      // Simulate real Alpaca API latency
      setTimeout(() => {
        resolve({
          id: crypto.randomUUID(),
          status: "FILLED" // Mock instant fill for market
        });
      }, 400);
    });
  }

  static async getLiveAccountData(): Promise<{ buyingPower: number, equity: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          buyingPower: this.liveBalance,
          equity: this.liveBalance + 50000 // mock equity
        });
      }, 300);
    });
  }
}

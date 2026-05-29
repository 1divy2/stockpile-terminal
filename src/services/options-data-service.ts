export type OptionContract = {
  id: string;
  strike: number;
  type: "CALL" | "PUT";
  expirationDate: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
};

export class OptionsDataService {
  /**
   * Generates a realistic simulated options chain around a current underlying price.
   */
  static async getOptionsChain(symbol: string, currentPrice: number, expirationDate: string): Promise<OptionContract[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const chain: OptionContract[] = [];
        // Generate strikes 10% below and 10% above current price
        const startStrike = Math.floor(currentPrice * 0.9);
        const endStrike = Math.ceil(currentPrice * 1.1);
        const step = currentPrice > 100 ? 5 : currentPrice > 20 ? 1 : 0.5;

        for (let strike = startStrike; strike <= endStrike; strike += step) {
          // Normalize strike
          const s = Number(strike.toFixed(2));
          
          // Generate CALL
          chain.push(this.generateMockContract(symbol, currentPrice, s, "CALL", expirationDate));
          // Generate PUT
          chain.push(this.generateMockContract(symbol, currentPrice, s, "PUT", expirationDate));
        }

        resolve(chain);
      }, 800); // Simulate network latency
    });
  }

  private static generateMockContract(symbol: string, currentPrice: number, strike: number, type: "CALL" | "PUT", exp: string): OptionContract {
    const isMoneyness = type === "CALL" ? currentPrice > strike : currentPrice < strike;
    const distance = Math.abs(currentPrice - strike) / currentPrice;
    
    // Intrinsic value
    let intrinsic = 0;
    if (type === "CALL") intrinsic = Math.max(0, currentPrice - strike);
    if (type === "PUT") intrinsic = Math.max(0, strike - currentPrice);

    // Extrinsic (Time) value - roughly based on distance
    const timeValue = Math.max(0.1, (currentPrice * 0.05) * Math.exp(-distance * 10));
    
    const basePrice = intrinsic + timeValue;
    const spread = Math.max(0.01, basePrice * 0.02);
    
    const bid = Number((basePrice - spread / 2).toFixed(2));
    const ask = Number((basePrice + spread / 2).toFixed(2));

    // Black-Scholes rough approximations for Greeks
    let delta = type === "CALL" ? 0.5 * Math.exp(-distance * 5) : -0.5 * Math.exp(-distance * 5);
    if (isMoneyness) {
      delta = type === "CALL" ? 1 - 0.5 * Math.exp(-distance * 5) : -1 + 0.5 * Math.exp(-distance * 5);
    }
    
    const gamma = 0.05 * Math.exp(-distance * 15);
    const theta = -0.02 - (0.05 * Math.exp(-distance * 5));
    const vega = 0.15 * Math.exp(-distance * 10);
    const rho = type === "CALL" ? 0.02 : -0.02;

    return {
      id: `${symbol}${exp.replace(/-/g, "").substring(2)}${type === "CALL" ? "C" : "P"}${strike.toFixed(2).padStart(8, "0")}`,
      strike,
      type,
      expirationDate: exp,
      bid: Math.max(0.01, bid),
      ask: Math.max(0.02, ask),
      last: Math.max(0.01, bid + (ask - bid) * Math.random()),
      volume: Math.floor(Math.random() * 5000 * Math.exp(-distance * 10)),
      openInterest: Math.floor(Math.random() * 20000 * Math.exp(-distance * 8)),
      impliedVolatility: 0.2 + Math.random() * 0.8 + distance * 2, // IV smile
      greeks: {
        delta: Number(delta.toFixed(4)),
        gamma: Number(gamma.toFixed(4)),
        theta: Number(theta.toFixed(4)),
        vega: Number(vega.toFixed(4)),
        rho: Number(rho.toFixed(4)),
      }
    };
  }

  static getMockExpirations(): string[] {
    const dates = [];
    const now = new Date();
    for (let i = 1; i <= 8; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + (i * 7) - d.getDay() + 5); // Next 8 Fridays
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  }
}

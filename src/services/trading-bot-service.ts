import { usePaperTradingStore } from "@/lib/paper-trading/paper-trading-store";

export type TradingBotStatus = "IDLE" | "RUNNING" | "STOPPED";

class TradingBotEngine {
  private status: TradingBotStatus = "IDLE";
  private intervalId: NodeJS.Timeout | null = null;
  private strategyName: string = "";

  deploy(strategyName: string) {
    if (this.status === "RUNNING") return;
    this.strategyName = strategyName;
    this.status = "RUNNING";
    console.log(`[Trading Bot] Deployed strategy: ${strategyName}`);

    // Mock bot execution loop
    this.intervalId = setInterval(() => {
      this.executeCycle();
    }, 10000); // Check every 10 seconds
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.status = "STOPPED";
    console.log(`[Trading Bot] Stopped strategy: ${this.strategyName}`);
  }

  getStatus() {
    return this.status;
  }

  private executeCycle() {
    // Just a mock cycle. In a real system, this evaluates signals and sends orders.
    const symbols = ["AAPL", "NVDA", "TSLA"];
    const target = symbols[Math.floor(Math.random() * symbols.length)];
    
    // Simulate random bot decision
    if (Math.random() > 0.8) {
      const isBuy = Math.random() > 0.5;
      const store = usePaperTradingStore.getState();
      
      console.log(`[Trading Bot] Signal detected on ${target} -> ${isBuy ? "BUY" : "SELL"}`);
      
      // In a real app we'd fetch live price here.
      // We will just dispatch to paper trading store (which handles live vs paper automatically via Alpaca)
      const mockPrice = 150;
      if (isBuy) {
        store.buy(target, 10, mockPrice);
      } else {
        store.sell(target, 10, mockPrice);
      }
    }
  }
}

export const BotService = new TradingBotEngine();

export type TradeEvent = {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
};

type TradeCallback = (trade: TradeEvent) => void;

export class WebSocketDataFeed {
  private ws: WebSocket | null = null;
  private apiKey: string | undefined;
  private symbols: Set<string> = new Set();
  private onTradeCallback: TradeCallback | null = null;
  
  // Fallback simulator variables
  private simulatorInterval: number | null = null;
  private mockPrices: Record<string, number> = {};

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  setCallback(cb: TradeCallback) {
    this.onTradeCallback = cb;
  }

  connect() {
    if (typeof window === 'undefined') return;

    if (this.apiKey) {
      this.connectFinnhub();
    } else {
      console.warn("No VITE_FINNHUB_API_KEY provided. Using local simulated WebSocket feed.");
      this.startSimulator();
    }
  }

  private connectFinnhub() {
    if (this.ws) return;
    
    this.ws = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);

    this.ws.onopen = () => {
      console.log("Finnhub WebSocket connected.");
      // Subscribe to all currently registered symbols
      this.symbols.forEach(sym => {
        this.ws?.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'trade' && data.data) {
          data.data.forEach((t: any) => {
            if (this.onTradeCallback) {
              this.onTradeCallback({
                symbol: t.s,
                price: t.p,
                volume: t.v,
                timestamp: t.t,
              });
            }
          });
        }
      } catch (e) {
        console.error("Error parsing Finnhub message", e);
      }
    };

    this.ws.onclose = () => {
      console.log("Finnhub WebSocket closed. Reconnecting in 5s...");
      this.ws = null;
      setTimeout(() => this.connectFinnhub(), 5000);
    };
  }

  private startSimulator() {
    if (this.simulatorInterval) return;
    
    // Simulate high-frequency trading ticks
    this.simulatorInterval = window.setInterval(() => {
      if (!this.onTradeCallback) return;
      
      const activeSymbols = Array.from(this.symbols);
      if (activeSymbols.length === 0) return;
      
      // Randomly pick a few symbols to tick this cycle
      const numToTick = Math.max(1, Math.floor(Math.random() * 3));
      
      for (let i = 0; i < numToTick; i++) {
        const sym = activeSymbols[Math.floor(Math.random() * activeSymbols.length)];
        
        // Initialize mock price if not set
        if (!this.mockPrices[sym]) {
          this.mockPrices[sym] = 100 + Math.random() * 400; // Arbitrary base price
        }
        
        // Random walk
        const volatility = 0.0005; // 0.05% per tick max
        const change = this.mockPrices[sym] * volatility * (Math.random() - 0.48); // Slight upward drift
        
        this.mockPrices[sym] += change;
        
        this.onTradeCallback({
          symbol: sym,
          price: Number(this.mockPrices[sym].toFixed(2)),
          volume: Math.floor(Math.random() * 500) + 1,
          timestamp: Date.now()
        });
      }
    }, 800); // Tick every 800ms
  }

  subscribe(symbol: string, initialPrice?: number) {
    if (!this.symbols.has(symbol)) {
      this.symbols.add(symbol);
      
      if (initialPrice && !this.mockPrices[symbol]) {
        this.mockPrices[symbol] = initialPrice;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
      }
    }
  }

  unsubscribe(symbol: string) {
    if (this.symbols.has(symbol)) {
      this.symbols.delete(symbol);
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.simulatorInterval) {
      clearInterval(this.simulatorInterval);
      this.simulatorInterval = null;
    }
  }
}

export const wsFeed = new WebSocketDataFeed(import.meta.env.VITE_FINNHUB_API_KEY);

import { MARKET_CONFIG, SYMBOLS, METADATA } from "./market-config";
import { MarketTicker, CandlePoint, Timeframe } from "./market-types";
import { useMarketStore } from "./market-state";
import { wsFeed } from "./websocket-engine";

import { IMarketDataProvider } from "./providers/types";
import { TwelveDataProvider } from "./providers/twelvedata-provider";
import { YahooProvider } from "./providers/yahoo-provider";
import { CoinGeckoProvider } from "./providers/coingecko-provider";

const FALLBACKS: Record<string, { price: number; change: number; changePct: number }> = {
  NVDA: { price: 215.25, change: -4.58, changePct: -2.08 },
  AAPL: { price: 189.84, change: 1.72, changePct: 0.92 },
  MSFT: { price: 428.52, change: 7.34, changePct: 1.74 },
  GOOGL: { price: 178.34, change: 2.12, changePct: 1.14 },
  META: { price: 512.78, change: 7.01, changePct: 1.38 },
  TSLA: { price: 248.12, change: -3.44, changePct: -1.38 },
  AMZN: { price: 187.45, change: 3.42, changePct: 1.86 },
  AMD: { price: 168.21, change: 3.48, changePct: 2.1 },
  AVGO: { price: 1442.82, change: 11.23, changePct: 0.84 },
  PLTR: { price: 21.84, change: 0.92, changePct: 4.39 },
  JPM: { price: 218.65, change: 2.1, changePct: 0.97 },
  "BRK.B": { price: 432.18, change: 1.8, changePct: 0.42 },
  V: { price: 282.4, change: 1.9, changePct: 0.67 },
  MA: { price: 472.9, change: 3.8, changePct: 0.81 },
  UNH: { price: 528.3, change: -2.1, changePct: -0.39 },
  XOM: { price: 118.42, change: 0.84, changePct: 0.71 },
  LLY: { price: 902.18, change: 8.7, changePct: 0.97 },
  COIN: { price: 218.74, change: 6.4, changePct: 3.02 },
  SHOP: { price: 78.54, change: 1.2, changePct: 1.55 },
  VOO: { price: 342.99, change: 0.00, changePct: 0.00 },
  SNOW: { price: 142.31, change: -1.9, changePct: -1.32 },
  "BTC/USD": { price: 68421.7, change: 842, changePct: 1.25 },
  "ETH/USD": { price: 3742.18, change: 58, changePct: 1.57 },
  "SOL/USD": { price: 182.4, change: 12, changePct: 7.04 },
  SPY: { price: 572.8, change: 2.8, changePct: 0.49 },
  QQQ: { price: 492.1, change: 3.2, changePct: 0.65 },
  GLD: { price: 248.2, change: -0.8, changePct: -0.32 },
  TLT: { price: 92.18, change: 0.4, changePct: 0.44 },
};

class MarketDataEngine {
  private twelveData: TwelveDataProvider;
  private yahoo: YahooProvider;
  private coinGecko: CoinGeckoProvider;

  // Deduplication tracking
  private inFlightQuotes: Promise<MarketTicker[]> | null = null;
  private inFlightCandles: Record<string, Promise<CandlePoint[]>> = {};

  constructor() {
    this.twelveData = new TwelveDataProvider(import.meta.env.VITE_TWELVEDATA_API_KEY || "");
    this.yahoo = new YahooProvider();
    this.coinGecko = new CoinGeckoProvider();
  }

  private getCachedTickers(): MarketTicker[] | null {
    try {
      const raw = localStorage.getItem(MARKET_CONFIG.CACHE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const isExpired = Date.now() - parsed.timestamp > MARKET_CONFIG.REFRESH_INTERVAL_MS;

      if (isExpired) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  public async fetchMarketData(): Promise<MarketTicker[]> {
    const cached = this.getCachedTickers();
    if (cached) {
      this.hydrateStore(cached);
      return cached;
    }

    if (this.inFlightQuotes) {
      return this.inFlightQuotes;
    }

    this.inFlightQuotes = this.executeFetchMarketData().finally(() => {
      this.inFlightQuotes = null;
    });

    const fresh = await this.inFlightQuotes;
    this.hydrateStore(fresh);
    return fresh;
  }

  private async executeFetchMarketData(): Promise<MarketTicker[]> {
    try {
      const cryptoSymbols = SYMBOLS.filter(s => METADATA[s]?.assetClass === "Crypto");
      const equitySymbols = SYMBOLS.filter(s => METADATA[s]?.assetClass !== "Crypto");

      const [cryptoTickers, equityTickers] = await Promise.all([
        this.fetchWithFailover(cryptoSymbols, [this.yahoo, this.coinGecko]),
        this.fetchWithFailover(equitySymbols, [this.yahoo, this.twelveData])
      ]);

      const allTickers = [...cryptoTickers, ...equityTickers];

      // Cache it
      localStorage.setItem(
        MARKET_CONFIG.CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), data: allTickers })
      );

      return allTickers;
    } catch (err) {
      console.error("All providers failed, using hardcoded fallback", err);
      return SYMBOLS.map((symbol) => {
        const fallback = FALLBACKS[symbol] || { price: 100, change: 0, changePct: 0 };
        const metadata = METADATA[symbol] || { name: symbol, sector: "Unknown", assetClass: "Unknown" };
        return {
          symbol,
          ...metadata,
          price: fallback.price,
          change: fallback.change,
          changePct: fallback.changePct,
        };
      });
    }
  }

  public async getCandles(symbol: string, timeframe: Timeframe): Promise<CandlePoint[]> {
    const cacheKey = `td-${symbol}-${timeframe}`;
    
    // Check local storage cache
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        if (Date.now() - parsed.timestamp < 1000 * 60 * 15) {
          return parsed.data;
        }
      }
    } catch { /* ignore */ }

    // Deduplication
    const flightKey = `${symbol}-${timeframe}`;
    if (flightKey in this.inFlightCandles) {
      return this.inFlightCandles[flightKey];
    }

    this.inFlightCandles[flightKey] = this.executeGetCandles(symbol, timeframe).then((data) => {
      try {
        if (data.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
        }
      } catch { /* ignore */ }
      return data;
    }).finally(() => {
      delete this.inFlightCandles[flightKey];
    });

    return this.inFlightCandles[flightKey];
  }

  private async executeGetCandles(symbol: string, timeframe: Timeframe): Promise<CandlePoint[]> {
    const isCrypto = METADATA[symbol]?.assetClass === "Crypto";
    const providers = isCrypto ? [this.yahoo, this.coinGecko] : [this.yahoo, this.twelveData];

    for (const provider of providers) {
      try {
        const data = await provider.getCandles(symbol, timeframe);
        if (data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn(`[MarketDataEngine] Provider ${provider.name} failed to get candles for ${symbol}:`, err);
      }
    }

    console.error(`[MarketDataEngine] All providers failed to fetch candles for ${symbol}, generating mock data`);
    return this.generateMockCandles(symbol, timeframe);
  }

  private generateMockCandles(symbol: string, timeframe: Timeframe): CandlePoint[] {
    const basePrice = FALLBACKS[symbol]?.price || 100;
    const count = timeframe === "1D" ? 30 : timeframe === "1M" ? 60 : 100;
    const out = [];
    let current = basePrice * 0.9;
    
    // Simple deterministic random
    let seed = symbol.charCodeAt(0) + symbol.charCodeAt(symbol.length - 1);
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const now = Date.now();
    const intervalMs = timeframe === "1D" ? 60 * 1000 : 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < count; i++) {
      const isUp = random() > 0.48;
      const volatility = current * 0.005;
      
      const open = current;
      const close = isUp ? open + (random() * volatility) : open - (random() * volatility);
      const high = Math.max(open, close) + (random() * volatility * 0.5);
      const low = Math.min(open, close) - (random() * volatility * 0.5);
      
      out.push({
        timestamp: Math.floor((now - (count - i) * intervalMs) / 1000),
        price: close,
        open,
        high,
        low,
        close,
        volume: Math.floor(random() * 1000000)
      });
      current = close;
    }
    
    return out;
  }

  private async fetchWithFailover(symbols: string[], providers: IMarketDataProvider[]): Promise<MarketTicker[]> {
    if (symbols.length === 0) return [];
    
    let lastError = null;

    for (const provider of providers) {
      try {
        const data = await provider.getQuotes(symbols);
        if (data && data.length > 0) {
          // Add remaining fallbacks for symbols that the provider might have missed
          const returnedSymbols = new Set(data.map(d => d.symbol));
          for (const s of symbols) {
            if (!returnedSymbols.has(s)) {
              data.push(this.getFallbackTicker(s));
            }
          }
          return data;
        }
      } catch (err) {
        console.warn(`[MarketDataEngine] Provider ${provider.name} failed for quotes:`, err);
        lastError = err;
      }
    }

    console.error(`[MarketDataEngine] All providers failed for batch fetch, using hard fallbacks. Last error:`, lastError);
    return symbols.map(s => this.getFallbackTicker(s));
  }

  private getFallbackTicker(symbol: string): MarketTicker {
    const fallback = FALLBACKS[symbol] || { price: 100, change: 0, changePct: 0 };
    const metadata = METADATA[symbol] || { name: symbol, sector: "Unknown", assetClass: "Unknown" };
    return {
      symbol,
      ...metadata,
      price: fallback.price,
      change: fallback.change,
      changePct: fallback.changePct,
    };
  }

  private hydrateStore(tickers: MarketTicker[]) {
    // Merge updates dynamically without overwriting unmodified fields (like aiScore) if needed
    // For now, doing a complete set
    useMarketStore.getState().setTickers(tickers);
    
    if (typeof window !== "undefined") {
      tickers.forEach(t => {
        wsFeed.subscribe(t.symbol, t.price);
      });
    }
  }
}

export const marketDataEngine = new MarketDataEngine();

import { IMarketDataProvider, ProviderCapabilities } from "./types";
import { MarketTicker, CandlePoint, Timeframe } from "../market-types";
import { SYMBOLS, METADATA } from "../market-config";

interface CandleRaw {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

export class TwelveDataProvider implements IMarketDataProvider {
  name = "TwelveData";
  capabilities: ProviderCapabilities = {
    supportsEquities: true,
    supportsCrypto: true,
    supportsIndices: true,
  };

  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getQuotes(symbols: string[]): Promise<MarketTicker[]> {
    if (!this.apiKey) throw new Error("TwelveData API key missing");
    if (symbols.length === 0) return [];

    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbols.join(",")}&apikey=${this.apiKey}`
    );

    if (!response.ok) {
      if (response.status === 429) throw new Error("RATE_LIMIT");
      throw new Error(`TwelveData HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.status === "error") {
      throw new Error(data.message || "TwelveData API error");
    }

    const tickers: MarketTicker[] = [];
    
    // If only one symbol was requested, TwelveData returns the object directly, not keyed by symbol
    const isSingle = symbols.length === 1;

    for (const symbol of symbols) {
      const live = isSingle ? data : data[symbol];
      if (!live || live.status === "error") continue;

      const metadata = METADATA[symbol] || { name: symbol, sector: "Unknown", assetClass: "Unknown" };

      const price = Number(live.close);
      const change = Number(live.change);
      const changePct = Number(live.percent_change);
      const volume = Number(live.volume);

      tickers.push({
        symbol,
        ...metadata,
        price: !Number.isNaN(price) ? price : 0,
        change: !Number.isNaN(change) ? change : 0,
        changePct: !Number.isNaN(changePct) ? changePct : 0,
        volume: !Number.isNaN(volume) ? volume : undefined,
      });
    }

    return tickers;
  }

  async getCandles(symbol: string, timeframe: Timeframe): Promise<CandlePoint[]> {
    if (!this.apiKey) throw new Error("TwelveData API key missing");

    const config = this.getIntervalConfig(timeframe);
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
      symbol
    )}&interval=${config.interval}&outputsize=${config.outputsize}&apikey=${this.apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) throw new Error("RATE_LIMIT");
      throw new Error(`TwelveData HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.status === "error") {
      if (data.code === 429) throw new Error("RATE_LIMIT");
      throw new Error(data.message || "TwelveData API error");
    }

    if (!data.values) return [];

    const formatted: CandlePoint[] = (data.values as CandleRaw[])
      .map((item) => ({
        timestamp: Math.floor(new Date(item.datetime).getTime() / 1000),
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
        volume: Number(item.volume ?? 0),
        price: Number(item.close),
      }))
      .reverse();

    return formatted;
  }

  private getIntervalConfig(timeframe: Timeframe) {
    switch (timeframe) {
      case "1D": return { interval: "5min", outputsize: 80 };
      case "5D": return { interval: "30min", outputsize: 120 };
      case "1M": return { interval: "1day", outputsize: 30 };
      case "6M": return { interval: "1day", outputsize: 130 };
      case "YTD": return { interval: "1day", outputsize: 260 };
      case "1Y": return { interval: "1day", outputsize: 320 };
      case "ALL": return { interval: "1week", outputsize: 520 };
      default: return { interval: "1day", outputsize: 120 };
    }
  }
}

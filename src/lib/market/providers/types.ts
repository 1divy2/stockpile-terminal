import { MarketTicker, CandlePoint, Timeframe } from "../market-types";

export interface ProviderCapabilities {
  supportsEquities: boolean;
  supportsCrypto: boolean;
  supportsIndices: boolean;
}

export interface IMarketDataProvider {
  name: string;
  capabilities: ProviderCapabilities;
  
  getQuotes(symbols: string[]): Promise<MarketTicker[]>;
  getCandles(symbol: string, timeframe: Timeframe): Promise<CandlePoint[]>;
}

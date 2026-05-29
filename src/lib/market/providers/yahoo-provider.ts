import { IMarketDataProvider, ProviderCapabilities } from "./types";
import { MarketTicker, CandlePoint, Timeframe } from "../market-types";
import { METADATA } from "../market-config";

export class YahooProvider implements IMarketDataProvider {
  name = "YahooFinance";
  capabilities: ProviderCapabilities = {
    supportsEquities: true,
    supportsCrypto: true, // Yahoo supports Crypto via BTC-USD etc
    supportsIndices: true,
  };

  private proxyUrl = "https://api.allorigins.win/get?url=";

  private formatSymbol(symbol: string): string {
    // Yahoo uses BTC-USD instead of BTC/USD
    return symbol.replace("/", "-").toUpperCase();
  }

  async getQuotes(symbols: string[]): Promise<MarketTicker[]> {
    if (symbols.length === 0) return [];

    const formattedSymbols = symbols.map(this.formatSymbol).join(",");
    // Use Yahoo's Query1 API via proxy
    const targetUrl = encodeURIComponent(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${formattedSymbols}`);
    
    const response = await fetch(`${this.proxyUrl}${targetUrl}`);
    if (!response.ok) {
      throw new Error(`Yahoo HTTP ${response.status}`);
    }

    const proxyData = await response.json();
    if (!proxyData.contents) throw new Error("Yahoo Proxy failed to return contents");

    const data = JSON.parse(proxyData.contents);
    const results = data?.quoteResponse?.result;
    
    if (!Array.isArray(results)) {
      throw new Error("Invalid Yahoo Quote format");
    }

    const tickers: MarketTicker[] = [];

    for (const quote of results) {
      // Reverse map the symbol back to our format if it was crypto
      const originalSymbol = quote.symbol.replace("-", "/");
      const metadata = METADATA[originalSymbol] || { name: quote.longName || quote.shortName || originalSymbol, sector: "Unknown", assetClass: "Unknown" };

      const price = Number(quote.regularMarketPrice);
      const change = Number(quote.regularMarketChange);
      const changePct = Number(quote.regularMarketChangePercent);

      tickers.push({
        symbol: originalSymbol,
        ...metadata,
        price: !Number.isNaN(price) ? price : 0,
        change: !Number.isNaN(change) ? change : 0,
        changePct: !Number.isNaN(changePct) ? changePct : 0,
        volume: Number(quote.regularMarketVolume),
        marketCap: Number(quote.marketCap),
        pe: Number(quote.trailingPE),
      });
    }

    return tickers;
  }

  async getCandles(symbol: string, timeframe: Timeframe): Promise<CandlePoint[]> {
    const formattedSymbol = this.formatSymbol(symbol);
    const config = this.getIntervalConfig(timeframe);

    const targetUrl = encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?range=${config.range}&interval=${config.interval}`);
    const response = await fetch(`${this.proxyUrl}${targetUrl}`);
    
    if (!response.ok) throw new Error(`Yahoo HTTP ${response.status}`);
    
    const proxyData = await response.json();
    const data = JSON.parse(proxyData.contents);

    const result = data?.chart?.result?.[0];
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) return [];

    const timestamps = result.timestamp as number[];
    const quote = result.indicators.quote[0];

    const formatted: CandlePoint[] = timestamps.map((ts, index) => ({
      timestamp: ts,
      open: Number(quote.open[index]),
      high: Number(quote.high[index]),
      low: Number(quote.low[index]),
      close: Number(quote.close[index]),
      volume: Number(quote.volume[index]),
      price: Number(quote.close[index])
    })).filter(c => c.close !== null && !Number.isNaN(c.close));

    return formatted;
  }

  private getIntervalConfig(timeframe: Timeframe) {
    switch (timeframe) {
      case "1D": return { range: "1d", interval: "5m" };
      case "5D": return { range: "5d", interval: "15m" };
      case "1M": return { range: "1mo", interval: "1d" };
      case "6M": return { range: "6mo", interval: "1d" };
      case "YTD": return { range: "ytd", interval: "1d" };
      case "1Y": return { range: "1y", interval: "1d" };
      case "ALL": return { range: "max", interval: "1wk" };
      default: return { range: "1mo", interval: "1d" };
    }
  }
}

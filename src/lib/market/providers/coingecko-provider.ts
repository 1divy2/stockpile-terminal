import { IMarketDataProvider, ProviderCapabilities } from "./types";
import { MarketTicker, CandlePoint, Timeframe } from "../market-types";
import { METADATA } from "../market-config";

export class CoinGeckoProvider implements IMarketDataProvider {
  name = "CoinGecko";
  capabilities: ProviderCapabilities = {
    supportsEquities: false,
    supportsCrypto: true,
    supportsIndices: false,
  };

  private symbolToId: Record<string, string> = {
    "BTC/USD": "bitcoin",
    "ETH/USD": "ethereum",
    "SOL/USD": "solana",
    "ADA/USD": "cardano",
    "DOGE/USD": "dogecoin",
    "DOT/USD": "polkadot",
    "AVAX/USD": "avalanche",
    "MATIC/USD": "matic-network",
    "LINK/USD": "chainlink",
    "UNI/USD": "uniswap",
  };

  async getQuotes(symbols: string[]): Promise<MarketTicker[]> {
    const cryptoSymbols = symbols.filter(s => this.symbolToId[s]);
    if (cryptoSymbols.length === 0) return [];

    const ids = cryptoSymbols.map(s => this.symbolToId[s]).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`;

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) throw new Error("RATE_LIMIT");
      throw new Error(`CoinGecko HTTP ${response.status}`);
    }

    const data = await response.json();
    const tickers: MarketTicker[] = [];

    for (const symbol of cryptoSymbols) {
      const id = this.symbolToId[symbol];
      const coinData = data[id];
      if (!coinData) continue;

      const metadata = METADATA[symbol] || { name: symbol, sector: "Crypto", assetClass: "Crypto" };

      tickers.push({
        symbol,
        ...metadata,
        price: Number(coinData.usd),
        changePct: Number(coinData.usd_24h_change),
        change: Number(coinData.usd) * (Number(coinData.usd_24h_change) / 100), // Approximate absolute change
        volume: Number(coinData.usd_24h_vol),
        marketCap: Number(coinData.usd_market_cap),
      });
    }

    return tickers;
  }

  async getCandles(symbol: string, timeframe: Timeframe): Promise<CandlePoint[]> {
    const id = this.symbolToId[symbol];
    if (!id) throw new Error(`CoinGecko unsupported symbol: ${symbol}`);

    const days = this.getDaysFromTimeframe(timeframe);
    const url = `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`;

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) throw new Error("RATE_LIMIT");
      throw new Error(`CoinGecko HTTP ${response.status}`);
    }

    const data: number[][] = await response.json();
    if (!Array.isArray(data)) return [];

    // CoinGecko OHLC format: [ timestamp, open, high, low, close ]
    const formatted: CandlePoint[] = data.map(item => ({
      timestamp: Math.floor(item[0] / 1000), // CG returns ms, convert to seconds
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
      price: item[4]
    }));

    return formatted;
  }

  private getDaysFromTimeframe(timeframe: Timeframe): number | string {
    switch (timeframe) {
      case "1D": return 1;
      case "5D": return 7;
      case "1M": return 30;
      case "6M": return 180;
      case "YTD": return 365;
      case "1Y": return 365;
      case "ALL": return "max";
      default: return 30;
    }
  }
}

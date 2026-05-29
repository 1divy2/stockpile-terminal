import { MarketTicker, CandlePoint, Timeframe, SectorSnapshot } from "./market-types";
import { evaluateTechnicals, TechnicalSignal } from "@/utils/indicators";
import { computeMarketBreadth, MarketBreadth, getSectorPerformance } from "@/utils/market-helpers";
import { marketDataEngine } from "./market-data-engine";

export type VolumeSpike = {
  symbol: string;
  volume: number;
  averageVolume: number;
  spikeRatio: number;
};

export class MarketAnalyticsEngine {
  
  /**
   * Evaluate technical indicators (RSI, MACD, BBands) for a ticker.
   * This computes dynamically over fetched candles.
   */
  public async getTechnicals(symbol: string, timeframe: Timeframe = "1D"): Promise<TechnicalSignal> {
    const candles = await marketDataEngine.getCandles(symbol, timeframe);
    return evaluateTechnicals(candles);
  }

  /**
   * Identify tickers experiencing unusual volume relative to their average.
   * Requires historical candles to establish an average.
   */
  public async getVolumeSpikes(tickers: MarketTicker[]): Promise<VolumeSpike[]> {
    const spikes: VolumeSpike[] = [];

    // Process in parallel, but limit to top 10 by market cap to avoid rate limits
    const topTickers = [...tickers].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)).slice(0, 10);

    await Promise.all(
      topTickers.map(async (ticker) => {
        try {
          const candles = await marketDataEngine.getCandles(ticker.symbol, "1D");
          if (candles.length < 10) return;

          let totalVol = 0;
          let count = 0;
          
          // Calculate 10-day average volume
          for (let i = Math.max(0, candles.length - 11); i < candles.length - 1; i++) {
            if (candles[i].volume) {
              totalVol += candles[i].volume!;
              count++;
            }
          }

          if (count === 0) return;
          const avgVol = totalVol / count;
          
          const latestVol = ticker.volume || candles[candles.length - 1].volume || 0;

          if (latestVol > avgVol * 1.5) { // 50% above average
            spikes.push({
              symbol: ticker.symbol,
              volume: latestVol,
              averageVolume: avgVol,
              spikeRatio: latestVol / avgVol
            });
          }
        } catch (e) {
          // ignore failures for individual tickers
        }
      })
    );

    return spikes.sort((a, b) => b.spikeRatio - a.spikeRatio);
  }

  /**
   * Get real-time sector performance snapshots.
   */
  public getSectors(tickers: MarketTicker[]): SectorSnapshot[] {
    const perfs = getSectorPerformance(tickers);
    return perfs.map(p => ({
      name: p.name,
      avgChange: p.avgChange,
      totalMarketCap: 0, // Approximated unless injected
      symbols: [p.topMover],
      count: p.tickerCount
    }));
  }

  /**
   * Get overall market breadth (Advancers vs Decliners)
   */
  public getBreadth(tickers: MarketTicker[]): MarketBreadth {
    return computeMarketBreadth(tickers);
  }
}

export const marketAnalyticsEngine = new MarketAnalyticsEngine();

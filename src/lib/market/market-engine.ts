import { MarketTicker, SectorSnapshot } from "./market-types";

export type MarketEngine = {
  tickers: MarketTicker[];

  tickerMap: Record<string, MarketTicker>;

  gainers: MarketTicker[];

  losers: MarketTicker[];

  sectors: SectorSnapshot[];

  averageMomentum: number;

  totalMarketCap: number;

  getTicker: (symbol: string) => MarketTicker | undefined;
};

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

export function buildMarketEngine(tickers: MarketTicker[]): MarketEngine {
  const tickerMap: Record<string, MarketTicker> = {};

  let totalMomentum = 0;

  let totalMarketCap = 0;

  const sectorMap: Record<string, SectorSnapshot> = {};

  for (const ticker of tickers) {
    const symbol = normalizeSymbol(ticker.symbol);

    tickerMap[symbol] = ticker;

    totalMomentum += ticker.changePct;

    totalMarketCap += ticker.marketCap ?? 0;

    const sector = ticker.sector || "Unknown";

    if (!sectorMap[sector]) {
      sectorMap[sector] = {
        name: sector,

        avgChange: 0,

        totalMarketCap: 0,

        symbols: [],

        count: 0,
      };
    }

    sectorMap[sector].avgChange += ticker.changePct;

    sectorMap[sector].totalMarketCap += ticker.marketCap ?? 0;

    sectorMap[sector].symbols.push(ticker.symbol);

    sectorMap[sector].count += 1;
  }

  const sectors = Object.values(sectorMap).map((sector) => ({
    ...sector,

    avgChange: sector.count > 0 ? sector.avgChange / sector.count : 0,
  }));

  const sorted = [...tickers].sort((a, b) => b.changePct - a.changePct);

  return {
    tickers,

    tickerMap,

    gainers: sorted.slice(0, 5),

    losers: [...sorted].reverse().slice(0, 5),

    sectors,

    averageMomentum: tickers.length > 0 ? totalMomentum / tickers.length : 0,

    totalMarketCap,

    getTicker: (symbol) => tickerMap[normalizeSymbol(symbol)],
  };
}

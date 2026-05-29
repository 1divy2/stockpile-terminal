export type MarketTicker = {
  symbol: string;
  name?: string;
  sector?: string;
  assetClass?: string;
  price: number;
  change: number;
  changePct: number;
  marketCap?: number;
  volume?: number;
  aiScore?: number;
  confidence?: number;
  sentiment?: number;
  pe?: number;
  beta?: number;
};

export type Timeframe = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "ALL";

export type CandlePoint = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  price: number;
};

export type SectorSnapshot = {
  name: string;
  avgChange: number;
  totalMarketCap: number;
  symbols: string[];
  count: number;
};

export type PortfolioSnapshot = {
  cash: number;
  positions: any[]; // To be expanded in Phase 4
  history: any[];
};

export type MarketSignal = {
  symbol: string;
  type: "BULLISH" | "BEARISH" | "NEUTRAL";
  strength: number;
  source: string;
  timestamp: number;
};

export type PortfolioMetrics = {
  totalValue: number;
  dayChange: number;
  dayChangePct: number;
  buyingPower: number;
};

export type MarketAnalytics = {
  breadth: { advancing: number; declining: number; unchanged: number };
  topMovers: MarketTicker[];
  worstMovers: MarketTicker[];
  sectors: SectorSnapshot[];
};

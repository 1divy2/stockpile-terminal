/**
 * Canonical market data types — single source of truth.
 *
 * Every component, hook, store, and engine should import from here
 * instead of defining its own copy of these types.
 */

/* ── Ticker ─────────────────────────────────────────────────────────── */

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
  pe?: number;
  beta?: number;
};

/* ── Candle / OHLCV ─────────────────────────────────────────────────── */

export type CandlePoint = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

/* ── Market Session ──────────────────────────────────────────────────── */

export type MarketSession = "PRE_MARKET" | "OPEN" | "AFTER_HOURS" | "CLOSED";

export type MarketSessionInfo = {
  label: string;
  tone: "positive" | "warn" | "negative";
  session: MarketSession;
  isTradingEnabled: boolean;
  description: string;
  nextEvent?: string;
};

/* ── News ────────────────────────────────────────────────────────────── */

export type MarketNewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source?: string;
  description?: string;
};

/* ── Sector Snapshot (from market engine) ─────────────────────────── */

export type SectorSnapshot = {
  name: string;
  avgChange: number;
  totalMarketCap: number;
  symbols: string[];
  count: number;
};

/* ── Paper Trading ──────────────────────────────────────────────────── */

export type PaperPosition = {
  symbol: string;
  shares: number;
  avgPrice: number;
};

export type TradeRecord = {
  id: string;
  type: "BUY" | "SELL";
  symbol: string;
  shares: number;
  price: number;
  timestamp: number;
};

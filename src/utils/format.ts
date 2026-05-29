/**
 * Shared formatting utilities for consistent display across all components.
 *
 * Replaces dozens of inline formatting snippets scattered throughout the codebase:
 *   changePct >= 0 ? "text-positive" : "text-negative"
 *   changePct >= 0 ? "+" : ""
 *   value.toLocaleString(...)
 */

/* ── Currency ──────────────────────────────────────────────────────── */

/**
 * Formats a number as USD currency.
 *   formatCurrency(1234.5)  → "$1,234.50"
 *   formatCurrency(1234567) → "$1,234,567.00"
 */
export function formatCurrency(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Compact currency for large numbers.
 *   formatCurrencyCompact(2_481_742) → "$2.48M"
 *   formatCurrencyCompact(68_421)     → "$68.4K"
 */
export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

/* ── Percentage ────────────────────────────────────────────────────── */

/**
 * Formats a percentage with explicit sign prefix.
 *   formatPercent(1.84)  → "+1.84%"
 *   formatPercent(-2.08) → "-2.08%"
 *   formatPercent(0)     → "0.00%"
 */
export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return `0.${'0'.repeat(decimals)}%`;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/* ── Compact Numbers ───────────────────────────────────────────────── */

/**
 * Compact number formatting for market caps, volumes, etc.
 *   formatCompact(1_200_000_000) → "1.20B"
 *   formatCompact(450_000_000)   → "450.00M"
 */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${abs.toFixed(2)}`;
}

/* ── Sign Prefix ───────────────────────────────────────────────────── */

/**
 * Returns "+" for positive values, "" for zero/negative (negative already has "-").
 */
export function getSignPrefix(value: number): string {
  return value > 0 ? "+" : "";
}

/* ── Bull / Bear Color ─────────────────────────────────────────────── */

/**
 * Returns the appropriate Tailwind color class for gain/loss display.
 *   getChangeColor(1.2)  → "text-positive"
 *   getChangeColor(-0.5) → "text-negative"
 *   getChangeColor(0)    → "text-muted-foreground"
 */
export function getChangeColor(value: number): string {
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted-foreground";
}

/**
 * Returns the appropriate background color class for gain/loss display.
 */
export function getChangeBgColor(value: number): string {
  if (value > 0) return "bg-positive/10";
  if (value < 0) return "bg-negative/10";
  return "bg-muted/10";
}

/* ── Price Formatting ──────────────────────────────────────────────── */

/**
 * Smart price formatting — more decimals for small prices, fewer for large.
 *   formatPrice(68421.70) → "68,421.70"
 *   formatPrice(0.0842)   → "0.0842"
 *   formatPrice(182.40)   → "182.40"
 */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  
  if (value >= 1000) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (value >= 1) {
    return value.toFixed(2);
  }
  return value.toFixed(4);
}

/* ── Relative Time ─────────────────────────────────────────────────── */

/**
 * Formats a timestamp as a human-readable relative time string.
 *   formatRelativeTime(Date.now() - 30000) → "30s ago"
 *   formatRelativeTime(Date.now() - 300000) → "5m ago"
 */
export function formatRelativeTime(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export type MarketSession = "PRE_MARKET" | "OPEN" | "AFTER_HOURS" | "CLOSED";

export type MarketSessionInfo = {
  label: string;

  tone: "positive" | "warn" | "negative";

  session: MarketSession;

  isTradingEnabled: boolean;

  description: string;

  nextEvent?: string;
};

function formatTime(hours: number, minutes: number) {
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getMarketSession(): MarketSessionInfo {
  const now = new Date();

  const nyParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",

    hour12: false,

    weekday: "short",

    hour: "2-digit",

    minute: "2-digit",
  }).formatToParts(now);

  const weekday = nyParts.find((p) => p.type === "weekday")?.value;

  const hour = Number(nyParts.find((p) => p.type === "hour")?.value);

  const minute = Number(nyParts.find((p) => p.type === "minute")?.value);

  const totalMinutes = hour * 60 + minute;

  const weekend = weekday === "Sat" || weekday === "Sun";

  const PRE_MARKET_START = 4 * 60;

  const MARKET_OPEN = 9 * 60 + 30;

  const MARKET_CLOSE = 16 * 60;

  const AFTER_HOURS_CLOSE = 20 * 60;

  if (weekend) {
    return {
      label: "MARKET CLOSED",

      tone: "negative",

      session: "CLOSED",

      isTradingEnabled: false,

      description: "US equity markets are closed for the weekend.",

      nextEvent: "Pre-market opens Monday at 4:00 AM ET",
    };
  }

  if (totalMinutes >= PRE_MARKET_START && totalMinutes < MARKET_OPEN) {
    return {
      label: "PRE-MARKET",

      tone: "warn",

      session: "PRE_MARKET",

      isTradingEnabled: true,

      description: "Extended-hours trading session with reduced liquidity and higher volatility.",

      nextEvent: `Regular market opens at ${formatTime(9, 30)} ET`,
    };
  }

  if (totalMinutes >= MARKET_OPEN && totalMinutes < MARKET_CLOSE) {
    return {
      label: "MARKET OPEN",

      tone: "positive",

      session: "OPEN",

      isTradingEnabled: true,

      description: "US equity markets are trading live under normal session conditions.",

      nextEvent: `Market closes at ${formatTime(16, 0)} ET`,
    };
  }

  if (totalMinutes >= MARKET_CLOSE && totalMinutes < AFTER_HOURS_CLOSE) {
    return {
      label: "AFTER HOURS",

      tone: "warn",

      session: "AFTER_HOURS",

      isTradingEnabled: true,

      description: "After-hours trading session with thinner order books and wider spreads.",

      nextEvent: `Extended trading closes at ${formatTime(20, 0)} ET`,
    };
  }

  return {
    label: "MARKET CLOSED",

    tone: "negative",

    session: "CLOSED",

    isTradingEnabled: false,

    description: "US equity markets are currently closed.",

    nextEvent: "Pre-market opens at 4:00 AM ET",
  };
}

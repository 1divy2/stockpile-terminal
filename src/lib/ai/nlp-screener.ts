import { MarketTicker } from "@/lib/market/market-types";

export type ScreenerFilter = {
  field: "price" | "changePct" | "marketCap" | "volume" | "sector" | "name";
  operator: "gt" | "lt" | "eq" | "gte" | "lte" | "contains";
  value: number | string;
};

export type NLPScreenerResult = {
  query: string;
  filters: ScreenerFilter[];
  explanation: string;
};

export async function parseNaturalLanguageQuery(query: string): Promise<NLPScreenerResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (apiKey) {
    const result = await parseWithGemini(query, apiKey);
    if (result) return result;
  }

  // Fallback to keyword-based parsing
  return parseWithKeywords(query);
}

async function parseWithGemini(query: string, apiKey: string): Promise<NLPScreenerResult | null> {
  const prompt = `You are a stock screening query parser. Convert the following natural language query into structured filters.

QUERY: "${query}"

Available filter fields and their meanings:
- "price": current stock price in USD
- "changePct": daily percentage change (positive = up, negative = down)
- "marketCap": market capitalization in USD
- "volume": trading volume
- "sector": sector name (Technology, Financial Services, Healthcare, Energy, Consumer, etc.)
- "name": company name or stock symbol

Available operators:
- "gt": greater than
- "lt": less than
- "gte": greater than or equal
- "lte": less than or equal
- "eq": equals (for exact matches)
- "contains": contains text (for sector/name)

Respond with JSON exactly matching:
{
  "filters": [
    { "field": "<field>", "operator": "<operator>", "value": <number or "string"> }
  ],
  "explanation": "<1 sentence explaining what the filters do>"
}
Return ONLY valid JSON. No markdown.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1
          }
        })
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);

    return {
      query,
      filters: parsed.filters || [],
      explanation: parsed.explanation || "Filters parsed from your query."
    };
  } catch (err) {
    console.error("NLP screener Gemini call failed:", err);
    return null;
  }
}

function parseWithKeywords(query: string): NLPScreenerResult {
  const filters: ScreenerFilter[] = [];
  const lq = query.toLowerCase();

  // Sector detection
  const sectorMap: Record<string, string> = {
    tech: "Technology",
    technology: "Technology",
    finance: "Financial Services",
    financial: "Financial Services",
    bank: "Financial Services",
    health: "Healthcare",
    healthcare: "Healthcare",
    pharma: "Healthcare",
    energy: "Energy",
    oil: "Energy",
    consumer: "Consumer",
    retail: "Consumer",
    crypto: "Crypto"
  };

  for (const [keyword, sector] of Object.entries(sectorMap)) {
    if (lq.includes(keyword)) {
      filters.push({ field: "sector", operator: "contains", value: sector });
      break;
    }
  }

  // Price thresholds
  const priceAbove = lq.match(/price\s*(?:above|over|greater than|>)\s*\$?(\d+)/);
  if (priceAbove) {
    filters.push({ field: "price", operator: "gt", value: Number(priceAbove[1]) });
  }

  const priceBelow = lq.match(/price\s*(?:below|under|less than|<)\s*\$?(\d+)/);
  if (priceBelow) {
    filters.push({ field: "price", operator: "lt", value: Number(priceBelow[1]) });
  }

  // Change percentage
  if (lq.includes("gaining") || lq.includes("up today") || lq.includes("positive momentum") || lq.includes("momentum")) {
    filters.push({ field: "changePct", operator: "gt", value: 0 });
  }
  if (lq.includes("losing") || lq.includes("down today") || lq.includes("negative")) {
    filters.push({ field: "changePct", operator: "lt", value: 0 });
  }

  const changeAbove = lq.match(/(?:change|move|gain)\s*(?:above|over|greater than|>)\s*(\d+)%?/);
  if (changeAbove) {
    filters.push({ field: "changePct", operator: "gt", value: Number(changeAbove[1]) });
  }

  // Large cap / small cap
  if (lq.includes("large cap") || lq.includes("mega cap")) {
    filters.push({ field: "marketCap", operator: "gt", value: 100_000_000_000 });
  }
  if (lq.includes("small cap") || lq.includes("penny")) {
    filters.push({ field: "price", operator: "lt", value: 50 });
  }

  return {
    query,
    filters,
    explanation: filters.length > 0
      ? `Parsed ${filters.length} filter(s) from your query using keyword matching.`
      : "No filters could be parsed. Try being more specific (e.g., 'tech stocks with price above $200')."
  };
}

export function applyFilters(tickers: MarketTicker[], filters: ScreenerFilter[]): MarketTicker[] {
  return tickers.filter(ticker => {
    return filters.every(filter => {
      let value: number | string;

      switch (filter.field) {
        case "price": value = ticker.price; break;
        case "changePct": value = ticker.changePct; break;
        case "marketCap": value = ticker.marketCap || 0; break;
        case "volume": value = ticker.volume || 0; break;
        case "sector": value = (ticker.sector || "").toLowerCase(); break;
        case "name": value = `${ticker.symbol} ${ticker.name || ""}`.toLowerCase(); break;
        default: return true;
      }

      const target = filter.value;

      switch (filter.operator) {
        case "gt": return typeof value === "number" && typeof target === "number" && value > target;
        case "lt": return typeof value === "number" && typeof target === "number" && value < target;
        case "gte": return typeof value === "number" && typeof target === "number" && value >= target;
        case "lte": return typeof value === "number" && typeof target === "number" && value <= target;
        case "eq": return value === target;
        case "contains":
          return typeof value === "string" && typeof target === "string" && value.includes(target.toLowerCase());
        default: return true;
      }
    });
  });
}

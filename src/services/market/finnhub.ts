const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

const BASE_URL = "https://finnhub.io/api/v1";

async function request(path: string) {
  const response = await fetch(`${BASE_URL}${path}&token=${API_KEY}`);

  if (!response.ok) {
    throw new Error("Failed to fetch market data");
  }

  return response.json();
}

export async function getQuote(symbol: string) {
  return request(`/quote?symbol=${symbol}`);
}

export async function getMarketNews() {
  return request("/news?category=general");
}

export async function getCompanyProfile(symbol: string) {
  return request(`/stock/profile2?symbol=${symbol}`);
}

export async function getCandles(symbol: string, resolution = "D") {
  const now = Math.floor(Date.now() / 1000);

  const from = now - 60 * 60 * 24 * 30;

  return request(`/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${now}`);
}

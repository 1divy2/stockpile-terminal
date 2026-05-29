import { useQuery } from "@tanstack/react-query";
import { MARKET_CONFIG } from "@/lib/market/market-config";
import { marketDataEngine } from "@/lib/market/market-data-engine";
export type { MarketTicker } from "@/lib/market/market-types";

export function useMarketTickers() {
  return useQuery({
    queryKey: ["market-tickers"],
    queryFn: async () => {
      // The engine handles caching, fallback, and store hydration internally
      return await marketDataEngine.fetchMarketData();
    },
    staleTime: MARKET_CONFIG.REFRESH_INTERVAL_MS,
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    networkMode: "offlineFirst",
  });
}

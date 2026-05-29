import { useQuery } from "@tanstack/react-query";
import { marketDataEngine } from "@/lib/market/market-data-engine";
import { Timeframe } from "@/lib/market/market-types";

export function useCandles(symbol: string | undefined, timeframe: Timeframe = "1D") {
  return useQuery({
    queryKey: ["candles", symbol, timeframe],
    enabled: !!symbol,
    queryFn: async () => {
      if (!symbol) return [];
      return await marketDataEngine.getCandles(symbol, timeframe);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: false,
    refetchOnWindowFocus: false,
  });
}

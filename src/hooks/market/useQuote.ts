import { useQuery } from "@tanstack/react-query";

import { getQuote } from "@/services/market/finnhub";

export function useQuote(symbol: string) {
  return useQuery({
    queryKey: ["quote", symbol],

    queryFn: () => getQuote(symbol),

    refetchInterval: 15000,

    staleTime: 10000,
  });
}

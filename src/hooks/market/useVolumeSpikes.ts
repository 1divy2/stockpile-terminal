import { useState, useEffect } from "react";
import { useMarketStore } from "@/lib/market/market-state";
import { marketAnalyticsEngine, VolumeSpike } from "@/lib/market/market-analytics-engine";

export function useVolumeSpikes() {
  const tickers = useMarketStore((s) => s.tickers);
  const [spikes, setSpikes] = useState<VolumeSpike[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (tickers.length === 0) return;

    let mounted = true;
    setIsLoading(true);

    marketAnalyticsEngine.getVolumeSpikes(tickers)
      .then(result => {
        if (mounted) setSpikes(result.slice(0, 5)); // Keep top 5
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [tickers]);

  return { spikes, isLoading };
}

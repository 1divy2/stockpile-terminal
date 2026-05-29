import { Activity } from "lucide-react";
import { useVolumeSpikes } from "@/hooks/market/useVolumeSpikes";
import { Pill } from "@/components/widgets/AIInsightCard";
import { useMarketStore } from "@/lib/market/market-state";

export function VolumeSpikes() {
  const { spikes, isLoading } = useVolumeSpikes();
  const setSelectedTicker = useMarketStore((s) => s.setSelectedTicker);

  return (
    <div className="panel-elevated p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-warn h-4 w-4" />
          <h3 className="text-[13px] font-semibold">Volume Spikes</h3>
        </div>
        <Pill tone="warn">DETECTED</Pill>
      </div>

      {isLoading ? (
        <div className="text-[11px] text-muted-foreground">Scanning market for volume anomalies...</div>
      ) : spikes.length > 0 ? (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1 border-b border-border/40 pb-1">
            <span>TICKER</span>
            <span>MULTIPLE</span>
          </div>
          {spikes.map((s) => (
            <button
              key={s.symbol}
              onClick={() => setSelectedTicker(s.symbol)}
              className="flex w-full items-center justify-between py-1.5 border-b border-border/40 last:border-0 hover:bg-white/5 transition"
            >
              <div className="font-mono text-[11px]">{s.symbol}</div>
              <div className="tabular-nums text-[11px] text-warn font-mono">
                {s.spikeRatio.toFixed(1)}x
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-muted-foreground">No significant volume spikes detected.</div>
      )}
    </div>
  );
}

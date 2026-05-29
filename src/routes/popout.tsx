import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LightweightChart } from "@/components/charts/LightweightChart";
import { useMarketStore } from "@/lib/market/market-state";
import { useCandles } from "@/hooks/market/useCandles";

export const Route = createFileRoute("/popout")({
  head: () => ({ meta: [{ title: "Pop-out · StockPile" }] }),
  component: PopoutPage,
});

function PopoutPage() {
  const [widget, setWidget] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<string>("NVDA");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setWidget(params.get("widget"));
    if (params.get("symbol")) {
      setSymbol(params.get("symbol")!);
    }
  }, []);

  if (!widget) return <div className="p-4 bg-background h-screen text-foreground">No widget specified.</div>;

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col p-2">
      <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-border/40">
        <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{symbol} • {widget}</h3>
      </div>
      <div className="flex-1 min-h-0 relative">
        {widget === "chart" && (
          <ChartWrapper symbol={symbol} />
        )}
      </div>
    </div>
  );
}

function ChartWrapper({ symbol }: { symbol: string }) {
  const { data: candleData = [] } = useCandles(symbol, "1D");
  return <LightweightChart candles={candleData as any[]} height={550} showVolume={true} />;
}

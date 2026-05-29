import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { useState, useEffect, useMemo } from "react";
import { useMarketStore } from "@/lib/market/market-state";
import { useSelectedTickerStore } from "@/lib/market/selected-ticker-store";
import { OptionsDataService, OptionContract } from "@/services/options-data-service";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/options")({
  head: () => ({ meta: [{ title: "Options Chain · StockPile" }] }),
  component: OptionsPage,
});

function OptionsPage() {
  const selectedTicker = useSelectedTickerStore((s) => s.selectedTicker) || "NVDA";
  const setSelectedTicker = useSelectedTickerStore((s) => s.setSelectedTicker);
  const liveTickers = useMarketStore((s) => s.tickers);
  const tickerData = liveTickers.find(t => t.symbol === selectedTicker);
  const currentPrice = tickerData?.price || 100;

  const [expirations, setExpirations] = useState<string[]>([]);
  const [selectedExp, setSelectedExp] = useState<string>("");
  const [chain, setChain] = useState<OptionContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [viewGreeks, setViewGreeks] = useState(false);

  useEffect(() => {
    const dates = OptionsDataService.getMockExpirations();
    setExpirations(dates);
    setSelectedExp(dates[0]);
  }, []);

  useEffect(() => {
    if (!selectedExp) return;
    let isMounted = true;
    
    const fetchChain = async () => {
      setLoading(true);
      try {
        const data = await OptionsDataService.getOptionsChain(selectedTicker, currentPrice, selectedExp);
        if (isMounted) setChain(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchChain();
    return () => { isMounted = false; };
  }, [selectedTicker, currentPrice, selectedExp]);

  const strikes = useMemo(() => {
    const s = new Set<number>();
    chain.forEach(c => s.add(c.strike));
    return Array.from(s).sort((a, b) => a - b);
  }, [chain]);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="Derivatives"
        title="Options Chain"
        subtitle="Live multi-leg options execution, Greeks, and implied volatility surfaces"
        right={<Pill tone="cyan">INSTITUTIONAL DOM</Pill>}
      />

      <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-[200px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
             <input 
               value={search}
               onChange={(e) => setSearch(e.target.value.toUpperCase())}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && search) {
                   setSelectedTicker(search);
                   setSearch("");
                 }
               }}
               placeholder={selectedTicker}
               className="w-full bg-panel border border-border/60 rounded-md py-1.5 pl-9 pr-3 text-[13px] outline-none focus:border-cyan"
             />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-semibold">{selectedTicker}</span>
            <span className="text-[14px] tabular-nums">${currentPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setViewGreeks(!viewGreeks)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded border text-[11px] font-semibold transition", viewGreeks ? "bg-cyan/10 border-cyan/40 text-cyan" : "bg-panel border-border/60 text-muted-foreground")}
          >
            <SlidersHorizontal className="h-3 w-3" />
            {viewGreeks ? "Hide Greeks" : "Show Greeks"}
          </button>
          
          <select 
            value={selectedExp}
            onChange={(e) => setSelectedExp(e.target.value)}
            className="bg-panel border border-border/60 rounded px-3 py-1.5 text-[12px] font-mono outline-none focus:border-cyan"
          >
            {expirations.map(exp => (
              <option key={exp} value={exp}>{exp}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="panel-elevated flex-1 overflow-hidden flex flex-col rounded-lg">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_80px_1fr] bg-panel border-b border-border/60 sticky top-0 z-10 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <div className="grid grid-cols-5 text-right py-2 px-2 border-r border-border/40">
            {viewGreeks ? (
              <><div>Delta</div><div>Gamma</div><div>Theta</div><div>Vega</div><div>Bid/Ask</div></>
            ) : (
              <><div>Vol</div><div>OI</div><div>Bid</div><div>Ask</div><div>Last</div></>
            )}
            <div className="absolute left-3 top-2 text-cyan font-semibold">CALLS</div>
          </div>
          <div className="text-center py-2 bg-panel-elevated font-semibold">Strike</div>
          <div className="grid grid-cols-5 text-left py-2 px-2 border-l border-border/40">
            <div className="absolute right-3 top-2 text-cyan font-semibold">PUTS</div>
            {viewGreeks ? (
              <><div>Bid/Ask</div><div>Delta</div><div>Gamma</div><div>Theta</div><div>Vega</div></>
            ) : (
              <><div>Last</div><div>Bid</div><div>Ask</div><div>Vol</div><div>OI</div></>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-20">
              <Loader2 className="h-6 w-6 animate-spin text-cyan" />
            </div>
          ) : null}

          {strikes.map(strike => {
            const call = chain.find(c => c.strike === strike && c.type === "CALL");
            const put = chain.find(c => c.strike === strike && c.type === "PUT");
            const isITMCall = currentPrice > strike;
            const isITMPut = currentPrice < strike;
            
            return (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                key={strike} 
                className="grid grid-cols-[1fr_80px_1fr] border-b border-border/30 hover:bg-white/[0.02]"
              >
                {/* Calls */}
                <div className={cn("grid grid-cols-5 text-right py-2 px-2 border-r border-border/40 tabular-nums text-[12px] font-mono", isITMCall ? "bg-cyan/5" : "")}>
                  {call ? (
                    viewGreeks ? (
                      <>
                        <div className="text-muted-foreground">{call.greeks.delta}</div>
                        <div className="text-muted-foreground">{call.greeks.gamma}</div>
                        <div className="text-muted-foreground">{call.greeks.theta}</div>
                        <div className="text-muted-foreground">{call.greeks.vega}</div>
                        <div className="font-semibold text-foreground">{call.bid} / {call.ask}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-muted-foreground">{call.volume}</div>
                        <div className="text-muted-foreground">{call.openInterest}</div>
                        <div className="text-positive">{call.bid.toFixed(2)}</div>
                        <div className="text-negative">{call.ask.toFixed(2)}</div>
                        <div className="font-semibold text-foreground">{call.last.toFixed(2)}</div>
                      </>
                    )
                  ) : <div className="col-span-5">-</div>}
                </div>
                
                {/* Strike */}
                <div className={cn("text-center py-2 text-[12px] font-bold bg-panel-elevated flex flex-col justify-center", Math.abs(currentPrice - strike) < (currentPrice * 0.01) ? "text-cyan bg-cyan/10" : "")}>
                  {strike.toFixed(1)}
                </div>

                {/* Puts */}
                <div className={cn("grid grid-cols-5 text-left py-2 px-2 border-l border-border/40 tabular-nums text-[12px] font-mono", isITMPut ? "bg-cyan/5" : "")}>
                  {put ? (
                    viewGreeks ? (
                      <>
                        <div className="font-semibold text-foreground text-right mr-4">{put.bid} / {put.ask}</div>
                        <div className="text-muted-foreground">{put.greeks.delta}</div>
                        <div className="text-muted-foreground">{put.greeks.gamma}</div>
                        <div className="text-muted-foreground">{put.greeks.theta}</div>
                        <div className="text-muted-foreground">{put.greeks.vega}</div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-foreground">{put.last.toFixed(2)}</div>
                        <div className="text-positive">{put.bid.toFixed(2)}</div>
                        <div className="text-negative">{put.ask.toFixed(2)}</div>
                        <div className="text-muted-foreground">{put.volume}</div>
                        <div className="text-muted-foreground">{put.openInterest}</div>
                      </>
                    )
                  ) : <div className="col-span-5">-</div>}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  );
}

import { Search, Bell, Plus, ChevronUp, ChevronDown, Command, Mic, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { UserMenu } from "@/components/auth/UserMenu";

import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { useMarketStore } from "@/lib/market/market-state";
import { usePaperTradingStore } from "@/lib/paper-trading/paper-trading-store";
import { getMarketSession } from "@/lib/market/session";
import { formatCurrency, formatPercent } from "@/utils/format";
import { AnimatedNumber } from "@/components/widgets/AnimatedNumber";
import { useState } from "react";
import { useToast } from "@/components/widgets/ToastProvider";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function TopBar({ onOpenCommand }: { onOpenCommand?: () => void } = {}) {
  const [isListening, setIsListening] = useState(false);
  const { pushToast } = useToast();
  
  const { data: liveTickers = [] } = useMarketTickers();

  const engine = useMarketStore((s) => s.engine);
  const brokerageMode = usePaperTradingStore((s) => s.brokerageMode);
  const toggleBrokerageMode = usePaperTradingStore((s) => s.toggleBrokerageMode);

  const { cash, positions } = usePaperTradingStore();

  const handleVoiceCommand = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      pushToast({ title: "Speech recognition not supported in this browser.", tone: "error" });
      return;
    }
    
    setIsListening(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      pushToast({ title: `Heard: "${command}"`, tone: "info" });
      
      if (command.includes("buy")) {
         pushToast({ title: "Jarvis: Executing BUY order.", tone: "success" });
      } else if (command.includes("search")) {
         pushToast({ title: "Jarvis: Searching...", tone: "info" });
      } else {
         pushToast({ title: "Jarvis: Command not recognized.", tone: "error" });
      }
    };
    
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.start();
  };

  const session = getMarketSession();

  // Compute real portfolio value from paper trading store
  const positionsValue = positions.reduce((sum, pos) => {
    const ticker = engine.getTicker(pos.symbol);
    const price = ticker?.price ?? pos.avgPrice;
    return sum + pos.shares * price;
  }, 0);
  const portfolioValue = cash + positionsValue;
  const startingCapital = 100_000;
  const returnPct = ((portfolioValue - startingCapital) / startingCapital) * 100;
  const isPositive = returnPct >= 0;

  const ribbonData = [
    {
      symbol: "NVDA",
      fallbackPrice: 215.25,
      fallbackChange: -2.08,
    },
    {
      symbol: "AAPL",
      fallbackPrice: 189.84,
      fallbackChange: 0.92,
    },
    {
      symbol: "MSFT",
      fallbackPrice: 428.52,
      fallbackChange: 1.74,
    },
    {
      symbol: "GOOGL",
      fallbackPrice: 178.34,
      fallbackChange: 1.14,
    },
    {
      symbol: "TSLA",
      fallbackPrice: 248.12,
      fallbackChange: -1.38,
    },
    {
      symbol: "AMD",
      fallbackPrice: 168.21,
      fallbackChange: 2.1,
    },
    {
      symbol: "AMZN",
      fallbackPrice: 187.45,
      fallbackChange: 1.86,
    },
    {
      symbol: "META",
      fallbackPrice: 512.78,
      fallbackChange: 1.38,
    },
  ].map((item) => {
    const live = liveTickers.find((t: { symbol: string }) => t.symbol === item.symbol);

    return {
      symbol: item.symbol,

      price: live?.price ?? item.fallbackPrice,

      changePct: live?.changePct ?? item.fallbackChange,
    };
  });

  // Session-aware market status color
  const sessionColor =
    session.tone === "positive" ? "text-positive" : session.tone === "warn" ? "text-warn" : "text-negative";

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4">
        <button
          onClick={onOpenCommand}
          className="group flex h-9 w-[320px] items-center gap-2 rounded-md border border-border/70 bg-panel/60 px-3 text-left text-[13px] text-muted-foreground transition-colors hover:border-border"
        >
          <Search className="h-3.5 w-3.5" />

          <span className="flex-1">Search tickers, pages…</span>

          <kbd className="flex items-center gap-1 rounded border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] font-mono">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">

          <button
            onClick={toggleBrokerageMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider transition ${
              brokerageMode === "LIVE" 
                ? "bg-negative/10 border-negative/30 text-negative shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                : "bg-panel border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {brokerageMode === "LIVE" ? (
              <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-negative opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-negative"></span></span> LIVE TRADING</>
            ) : (
              <>PAPER TRADING</>
            )}
          </button>

          <button 
            onClick={handleVoiceCommand}
            className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${isListening ? "border-negative/40 bg-negative/10 text-negative shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse" : "border-border/60 bg-panel/40 text-muted-foreground hover:bg-panel hover:text-foreground"}`}
          >
            {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          </button>

          <button className="grid h-9 w-9 place-items-center rounded-md border border-border/60 bg-panel/40 transition hover:bg-panel">
            <Plus className="h-4 w-4" />
          </button>

          <ThemeSwitcher />

          <button className="relative grid h-9 w-9 place-items-center rounded-md border border-border/60 bg-panel/40 transition hover:bg-panel">
            <Bell className="h-4 w-4" />

            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-negative" />
          </button>

          <UserMenu />
        </div>
      </div>

      <div className="ticker-strip h-8 overflow-hidden border-t border-border/60 bg-panel/30">
        <div className="ticker-track flex h-full w-max items-center gap-8 whitespace-nowrap">
          {[...ribbonData, ...ribbonData].map((it, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px] font-mono">
              <span className="text-muted-foreground">{it.symbol}</span>

              <span className="tabular-nums">
                $
                {it.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>

              <span className={cn("tabular-nums", it.changePct >= 0 ? "text-positive" : "text-negative")}>
                {it.changePct >= 0 ? "+" : ""}
                {it.changePct.toFixed(2)}%
              </span>

              <span className="text-border">•</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { Briefcase, Eye, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { formatCurrency, formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/insiders")({
  head: () => ({ meta: [{ title: "Insider Trading · StockPile" }] }),
  component: InsidersPage,
});

type InsiderTrade = {
  id: string;
  symbol: string;
  insiderName: string;
  title: string;
  transactionType: "BUY" | "SELL" | "GRANT";
  shares: number;
  price: number;
  value: number;
  date: number;
};

function generateMockTrades(): InsiderTrade[] {
  const symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "META", "AMZN", "GOOGL"];
  const titles = ["CEO", "CFO", "Director", "10% Owner", "VP"];
  const names = ["Tim Cook", "Satya Nadella", "Jensen Huang", "Elon Musk", "Mark Zuckerberg", "Andy Jassy", "Sundar Pichai"];
  
  return Array.from({ length: 20 }).map((_, i) => {
    const isBuy = Math.random() > 0.6;
    const isGrant = !isBuy && Math.random() > 0.8;
    const shares = Math.floor(Math.random() * 50000) + 1000;
    const price = Math.floor(Math.random() * 300) + 50;
    return {
      id: crypto.randomUUID(),
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      insiderName: names[Math.floor(Math.random() * names.length)],
      title: titles[Math.floor(Math.random() * titles.length)],
      transactionType: (isGrant ? "GRANT" : isBuy ? "BUY" : "SELL") as "BUY" | "SELL" | "GRANT",
      shares,
      price,
      value: shares * price,
      date: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
    };
  }).sort((a, b) => b.date - a.date);
}

function InsidersPage() {
  const [trades, setTrades] = useState<InsiderTrade[]>([]);

  useEffect(() => {
    setTrades(generateMockTrades());
    const interval = setInterval(() => {
      // Simulate real-time form 4 filings hitting the tape
      if (Math.random() > 0.7) {
        const newTrade = generateMockTrades()[0];
        newTrade.date = Date.now();
        setTrades(prev => [newTrade, ...prev].slice(0, 50));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="Corporate Actions"
        title="Insider Trading Tape"
        subtitle="Real-time Form 4 filings for corporate insider transactions"
        right={<Pill tone="cyan"><Briefcase className="h-3 w-3" /> LIVE TAPE</Pill>}
      />

      <div className="panel-elevated rounded-lg overflow-hidden flex flex-col flex-1">
        <div className="grid grid-cols-[100px_1fr_1fr_100px_120px_120px_120px_60px] px-4 py-3 bg-panel border-b border-border/60 text-[10px] font-mono text-muted-foreground uppercase tracking-wider sticky top-0 z-10">
          <div>Time</div>
          <div>Insider Name</div>
          <div>Title</div>
          <div>Ticker</div>
          <div className="text-right">Transaction</div>
          <div className="text-right">Shares</div>
          <div className="text-right">Value</div>
          <div className="text-right">Action</div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence initial={false}>
            {trades.map((trade) => {
              const color = trade.transactionType === "BUY" ? "text-positive bg-positive/10 border-positive/30" : 
                            trade.transactionType === "SELL" ? "text-negative bg-negative/10 border-negative/30" : 
                            "text-cyan bg-cyan/10 border-cyan/30";
              return (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, y: -20, backgroundColor: "rgba(255,255,255,0.1)" }}
                  animate={{ opacity: 1, y: 0, backgroundColor: "transparent" }}
                  className="grid grid-cols-[100px_1fr_1fr_100px_120px_120px_120px_60px] px-4 py-3 border-b border-border/30 hover:bg-white/[0.02] items-center text-[12px] group"
                >
                  <div className="font-mono text-muted-foreground">{formatRelativeTime(trade.date)}</div>
                  <div className="font-semibold text-foreground">{trade.insiderName}</div>
                  <div className="text-muted-foreground">{trade.title}</div>
                  <div className="font-mono font-bold">{trade.symbol}</div>
                  <div className="text-right">
                     <span className={cn("px-2 py-0.5 rounded border text-[10px] font-mono font-bold tracking-wider", color)}>
                       {trade.transactionType}
                     </span>
                  </div>
                  <div className="text-right font-mono tabular-nums">{trade.shares.toLocaleString()}</div>
                  <div className="text-right font-mono tabular-nums font-semibold">{formatCurrency(trade.value)}</div>
                  <div className="text-right flex justify-end">
                    <button className="h-6 w-6 rounded border border-border/60 bg-panel flex items-center justify-center opacity-0 group-hover:opacity-100 hover:border-cyan hover:text-cyan transition">
                      <Eye className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { useState, useEffect } from "react";
import { useMarketStore } from "@/lib/market/market-state";
import { useSelectedTickerStore } from "@/lib/market/selected-ticker-store";
import { OrderBookDataService, OrderBookData } from "@/services/orderbook-data-service";
import { Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/orderbook")({
  head: () => ({ meta: [{ title: "Level 2 Order Book · StockPile" }] }),
  component: OrderBookPage,
});

function OrderBookPage() {
  const selectedTicker = useSelectedTickerStore((s) => s.selectedTicker) || "NVDA";
  const liveTickers = useMarketStore((s) => s.tickers);
  const tickerData = liveTickers.find(t => t.symbol === selectedTicker);
  const currentPrice = tickerData?.price || 100;

  const [book, setBook] = useState<OrderBookData | null>(null);

  useEffect(() => {
    // Generate initial book
    setBook(OrderBookDataService.generateL2Data(selectedTicker, currentPrice));
    
    // Simulate real-time DOM updates
    const interval = setInterval(() => {
      setBook(OrderBookDataService.generateL2Data(selectedTicker, currentPrice));
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedTicker, currentPrice]);

  if (!book) return null;

  const maxBidSize = Math.max(...book.bids.map(b => b.size));
  const maxAskSize = Math.max(...book.asks.map(a => a.size));
  const maxSize = Math.max(maxBidSize, maxAskSize);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="Market Depth"
        title="Level 2 Order Book"
        subtitle={`Live DOM (Depth of Market) for ${selectedTicker}`}
        right={<Pill tone="warn"><Layers className="h-3 w-3" /> NASDAQ TOTALVIEW</Pill>}
      />

      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bids (Buyers) */}
        <div className="panel-elevated rounded-lg flex flex-col overflow-hidden">
          <div className="bg-panel border-b border-border/60 py-2 px-4 flex justify-between items-center sticky top-0 z-10">
            <h3 className="text-[13px] font-semibold text-positive">Bids (Buyers)</h3>
            <span className="text-[11px] text-muted-foreground font-mono">Vol: {book.bids.reduce((a, b) => a + b.size, 0)}</span>
          </div>
          <div className="grid grid-cols-[1fr_80px_60px_60px] px-4 py-2 border-b border-border/40 text-[10px] font-mono text-muted-foreground uppercase">
            <div>Exchange</div>
            <div className="text-right">Orders</div>
            <div className="text-right">Size</div>
            <div className="text-right">Price</div>
          </div>
          <div className="flex-1 overflow-y-auto relative bg-background/30">
            <AnimatePresence>
              {book.bids.map((bid, i) => (
                <motion.div 
                  key={`${bid.price}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-[1fr_80px_60px_60px] px-4 py-1 hover:bg-white/[0.02] border-b border-border/10 text-[12px] font-mono items-center relative group"
                >
                  <div className="absolute top-0 right-0 bottom-0 bg-positive/10 -z-10 transition-all" style={{ width: `${(bid.size / maxSize) * 100}%` }} />
                  <div className="text-muted-foreground/70">{bid.exchange}</div>
                  <div className="text-right text-muted-foreground">{bid.orders}</div>
                  <div className="text-right">{bid.size}</div>
                  <div className="text-right text-positive font-semibold">{bid.price.toFixed(2)}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Asks (Sellers) */}
        <div className="panel-elevated rounded-lg flex flex-col overflow-hidden">
          <div className="bg-panel border-b border-border/60 py-2 px-4 flex justify-between items-center sticky top-0 z-10">
            <h3 className="text-[13px] font-semibold text-negative">Asks (Sellers)</h3>
            <span className="text-[11px] text-muted-foreground font-mono">Vol: {book.asks.reduce((a, b) => a + b.size, 0)}</span>
          </div>
          <div className="grid grid-cols-[60px_60px_80px_1fr] px-4 py-2 border-b border-border/40 text-[10px] font-mono text-muted-foreground uppercase">
            <div>Price</div>
            <div className="text-left">Size</div>
            <div className="text-left">Orders</div>
            <div className="text-right">Exchange</div>
          </div>
          <div className="flex-1 overflow-y-auto relative bg-background/30">
            <AnimatePresence>
              {book.asks.map((ask, i) => (
                <motion.div 
                  key={`${ask.price}-${i}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-[60px_60px_80px_1fr] px-4 py-1 hover:bg-white/[0.02] border-b border-border/10 text-[12px] font-mono items-center relative group"
                >
                  <div className="absolute top-0 left-0 bottom-0 bg-negative/10 -z-10 transition-all" style={{ width: `${(ask.size / maxSize) * 100}%` }} />
                  <div className="text-negative font-semibold">{ask.price.toFixed(2)}</div>
                  <div className="text-left">{ask.size}</div>
                  <div className="text-left text-muted-foreground">{ask.orders}</div>
                  <div className="text-right text-muted-foreground/70">{ask.exchange}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

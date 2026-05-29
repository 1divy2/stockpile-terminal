import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { MessageSquare, Twitter, TrendingUp, TrendingDown, Users } from "lucide-react";
import { useSelectedTickerStore } from "@/lib/market/selected-ticker-store";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/format";

export const Route = createFileRoute("/_app/social")({
  head: () => ({ meta: [{ title: "Alternative Data · StockPile" }] }),
  component: SocialPage,
});

function SocialPage() {
  const selectedTicker = useSelectedTickerStore((s) => s.selectedTicker) || "NVDA";
  const [posts, setPosts] = useState<{ id: string, user: string, text: string, sentiment: "BULLISH" | "BEARISH", platform: "TWITTER" | "REDDIT", time: number }[]>([]);

  useEffect(() => {
    // Generate mock social feed
    const base = [
      { id: "1", user: "@wallstreet_bets", text: `I think ${selectedTicker} is about to go parabolic. Gamma squeeze inbound! 🚀💎🙌`, sentiment: "BULLISH", platform: "REDDIT", time: Date.now() - 1000 * 60 * 5 },
      { id: "2", user: "@quant_fund", text: `${selectedTicker} forward P/E is looking historically stretched. Initiating short position.`, sentiment: "BEARISH", platform: "TWITTER", time: Date.now() - 1000 * 60 * 45 },
      { id: "3", user: "@retail_king", text: `Bought the dip on ${selectedTicker}. Earnings are next week and AI demand is still insane.`, sentiment: "BULLISH", platform: "TWITTER", time: Date.now() - 1000 * 60 * 120 },
    ] as any;
    
    setPosts(base);
    
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        setPosts(prev => [{
          id: crypto.randomUUID(),
          user: Math.random() > 0.5 ? "@day_trader" : "@algobot",
          text: `Just executed a block trade on ${selectedTicker}. Volume profile is heavily skewed to the ${Math.random() > 0.5 ? 'upside' : 'downside'}.`,
          sentiment: (Math.random() > 0.5 ? "BULLISH" : "BEARISH") as "BULLISH" | "BEARISH",
          platform: (Math.random() > 0.5 ? "TWITTER" : "REDDIT") as "TWITTER" | "REDDIT",
          time: Date.now()
        }, ...prev].slice(0, 50));
      }
    }, 4000);
    
    return () => clearInterval(interval);
  }, [selectedTicker]);

  const bullishCount = posts.filter(p => p.sentiment === "BULLISH").length;
  const bearishCount = posts.filter(p => p.sentiment === "BEARISH").length;
  const total = bullishCount + bearishCount;
  const bullishPct = total > 0 ? Math.round((bullishCount / total) * 100) : 50;

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="Alternative Data"
        title="Social Sentiment Engine"
        subtitle={`Live Twitter & Reddit NLP tracking for ${selectedTicker}`}
        right={<Pill tone="cyan"><Users className="h-3 w-3" /> RETAIL SENTIMENT</Pill>}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[65vh]">
        {/* Sentiment Gauge */}
        <div className="md:col-span-4 panel-elevated rounded-lg p-5 flex flex-col h-min">
           <h3 className="text-[13px] font-semibold mb-4 text-cyan">Live NLP Sentiment</h3>
           
           <div className="flex items-center justify-between mb-2">
              <span className="text-positive font-bold flex items-center gap-1"><TrendingUp className="h-4 w-4" /> {bullishPct}%</span>
              <span className="text-negative font-bold flex items-center gap-1">{100 - bullishPct}% <TrendingDown className="h-4 w-4" /></span>
           </div>
           
           <div className="h-3 w-full bg-panel rounded-full overflow-hidden flex">
              <div className="h-full bg-positive transition-all duration-500" style={{ width: `${bullishPct}%` }} />
              <div className="h-full bg-negative transition-all duration-500" style={{ width: `${100 - bullishPct}%` }} />
           </div>
           
           <div className="mt-6 space-y-3">
              <div className="bg-panel border border-border/40 p-3 rounded flex justify-between items-center">
                 <span className="text-[12px] text-muted-foreground flex items-center gap-1.5"><Twitter className="h-3.5 w-3.5 text-[#1DA1F2]" /> Twitter Velocity</span>
                 <span className="font-mono text-[13px] font-bold">142 tweets/hr</span>
              </div>
              <div className="bg-panel border border-border/40 p-3 rounded flex justify-between items-center">
                 <span className="text-[12px] text-muted-foreground flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-[#FF4500]" /> Reddit Mentions</span>
                 <span className="font-mono text-[13px] font-bold">89 posts/hr</span>
              </div>
           </div>
        </div>

        {/* Live Feed */}
        <div className="md:col-span-8 panel-elevated rounded-lg flex flex-col overflow-hidden h-full">
           <div className="bg-panel border-b border-border/60 py-3 px-5 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-[13px] font-semibold">Live Social Feed</h3>
              <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-cyan"></span></span>
           </div>
           
           <div className="flex-1 overflow-y-auto">
              {posts.map(post => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-5 py-4 border-b border-border/30 hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                       {post.platform === "TWITTER" ? <Twitter className="h-3.5 w-3.5 text-[#1DA1F2]" /> : <MessageSquare className="h-3.5 w-3.5 text-[#FF4500]" />}
                       <span className="font-bold text-[13px]">{post.user}</span>
                       <span className="text-[11px] text-muted-foreground font-mono">{formatRelativeTime(post.time)}</span>
                     </div>
                     <Pill tone={post.sentiment === "BULLISH" ? "positive" : "negative"}>{post.sentiment}</Pill>
                  </div>
                  <p className="text-[14px] text-foreground/90 leading-relaxed">
                     {post.text}
                  </p>
                </motion.div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

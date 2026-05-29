import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { Copy, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/widgets/ToastProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/copy-trading")({
  head: () => ({ meta: [{ title: "Copy Trading · StockPile" }] }),
  component: CopyTradingPage,
});

const topTraders = [
  { id: "1", name: "Renaissance_Bot", return: 45.2, followers: 12400, risk: "High", isFollowing: false },
  { id: "2", name: "Value_King", return: 18.4, followers: 8900, risk: "Low", isFollowing: true },
  { id: "3", name: "Momentum_Surfer", return: 32.1, followers: 5600, risk: "Medium", isFollowing: false },
  { id: "4", name: "Yield_Farmer", return: 12.8, followers: 3200, risk: "Low", isFollowing: false },
];

function CopyTradingPage() {
  const { pushToast } = useToast();
  const [traders, setTraders] = useState(topTraders);

  const toggleFollow = (id: string) => {
    setTraders(traders.map(t => {
      if (t.id === id) {
        const following = !t.isFollowing;
        if (following) {
          pushToast({ title: `Now copying trades from ${t.name}`, tone: "success" });
        } else {
          pushToast({ title: `Stopped copying ${t.name}`, tone: "error" });
        }
        return { ...t, isFollowing: following };
      }
      return t;
    }));
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="Community"
        title="Copy Trading Platform"
        subtitle="Mirror the portfolios and live trades of top-performing quants"
        right={<Pill tone="cyan"><Users className="h-3 w-3" /> 45,210 ACTIVE USERS</Pill>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
        {traders.map(trader => (
          <div key={trader.id} className="panel-elevated rounded-lg p-5 flex flex-col items-center text-center relative overflow-hidden group">
             {trader.isFollowing && (
               <div className="absolute top-0 right-0 bg-positive text-positive-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                 <CheckCircle2 className="h-3 w-3" /> COPYING
               </div>
             )}
             
             <div className="h-16 w-16 bg-gradient-to-br from-cyan/20 to-blue-500/20 rounded-full flex items-center justify-center mb-4 border border-cyan/30 group-hover:scale-110 transition">
                <Users className="h-7 w-7 text-cyan" />
             </div>
             
             <h3 className="font-bold text-[16px] mb-1">{trader.name}</h3>
             
             <div className="flex items-center gap-3 text-[12px] text-muted-foreground mb-4">
                <span className="flex items-center gap-1 text-positive font-bold"><TrendingUp className="h-3.5 w-3.5" /> {trader.return}% YTD</span>
                <span>•</span>
                <span className="font-mono">{trader.followers.toLocaleString()} followers</span>
             </div>
             
             <div className="w-full bg-panel p-3 rounded mb-4 text-left border border-border/40">
                <div className="text-[10px] text-muted-foreground uppercase font-mono mb-1">Risk Profile</div>
                <div className={cn("text-[13px] font-semibold", trader.risk === "High" ? "text-negative" : trader.risk === "Medium" ? "text-warn" : "text-positive")}>{trader.risk}</div>
             </div>
             
             <button
               onClick={() => toggleFollow(trader.id)}
               className={cn("w-full py-2 rounded text-[13px] font-bold transition flex items-center justify-center gap-2", trader.isFollowing ? "bg-panel border border-border/60 hover:bg-negative/10 hover:text-negative hover:border-negative/40" : "bg-cyan text-cyan-foreground hover:bg-cyan/90 glow-cyan")}
             >
                {trader.isFollowing ? "Stop Copying" : <><Copy className="h-4 w-4" /> Copy Portfolio</>}
             </button>
          </div>
        ))}
      </div>
    </div>
  );
}

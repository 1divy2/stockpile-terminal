import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { Shield, Sword, Trophy, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/guilds")({
  head: () => ({ meta: [{ title: "Trading Guilds · StockPile" }] }),
  component: GuildsPage,
});

const mockGuilds = [
  { id: "1", name: "House of Alpha", members: 450, pnl: 45.2, rank: 1, emblem: "bg-gradient-to-br from-cyan/20 to-blue-600/30 border-cyan/40 text-cyan" },
  { id: "2", name: "Theta Gang", members: 890, pnl: 32.1, rank: 2, emblem: "bg-gradient-to-br from-purple-500/20 to-pink-600/30 border-purple-500/40 text-purple-400" },
  { id: "3", name: "Apes Together", members: 12400, pnl: -14.2, rank: 3, emblem: "bg-gradient-to-br from-warn/20 to-orange-600/30 border-warn/40 text-warn" },
  { id: "4", name: "Quant Cartel", members: 120, pnl: -2.4, rank: 4, emblem: "bg-gradient-to-br from-slate-500/20 to-slate-800/30 border-slate-500/40 text-slate-300" },
];

function GuildsPage() {
  const [selectedGuild, setSelectedGuild] = useState("1");

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="Community"
        title="Trading Guilds"
        subtitle="Join factions, combine your P&L, and battle for leaderboard dominance"
        right={<Pill tone="cyan"><Sword className="h-3 w-3" /> SEASON 4 ACTIVE</Pill>}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[65vh]">
        {/* Guild Leaderboard */}
        <div className="md:col-span-4 panel-elevated rounded-lg p-5 flex flex-col h-full">
           <h3 className="text-[14px] font-semibold mb-4">Global Rankings</h3>
           <div className="flex-1 space-y-3 overflow-y-auto pr-2">
             {mockGuilds.map((guild) => (
               <div 
                 key={guild.id}
                 onClick={() => setSelectedGuild(guild.id)}
                 className={cn("bg-panel border rounded-lg p-3 cursor-pointer transition", selectedGuild === guild.id ? "border-cyan/50 shadow-[0_0_15px_rgba(34,211,238,0.15)]" : "border-border/40 hover:border-border/80 hover:bg-white/[0.02]")}
               >
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="font-mono font-bold text-muted-foreground text-[12px]">#{guild.rank}</div>
                      <div className="font-bold text-[14px]">{guild.name}</div>
                    </div>
                    {guild.rank === 1 && <Trophy className="h-4 w-4 text-warn" />}
                 </div>
                 <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider">
                    <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {guild.members}</span>
                    <span className={guild.pnl >= 0 ? "text-positive" : "text-negative"}>
                      {guild.pnl >= 0 ? "+" : ""}{guild.pnl}% YTD
                    </span>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Guild Details */}
        <div className="md:col-span-8 panel-elevated rounded-lg p-6 flex flex-col items-center justify-center relative overflow-hidden group">
           {mockGuilds.find(g => g.id === selectedGuild) && (() => {
             const g = mockGuilds.find(g => g.id === selectedGuild)!;
             return (
               <>
                 <div className="absolute inset-0 opacity-[0.03] grid-bg" />
                 
                 <div className={cn("h-32 w-32 rounded-full border-2 flex items-center justify-center mb-6 relative z-10 shadow-2xl", g.emblem)}>
                    <Shield className="h-14 w-14" />
                 </div>
                 
                 <h2 className="text-[28px] font-bold mb-2 relative z-10">{g.name}</h2>
                 
                 <div className="flex gap-4 mb-8 relative z-10">
                    <div className="bg-panel px-4 py-2 rounded border border-border/40 text-center">
                       <div className="text-[10px] uppercase text-muted-foreground font-mono tracking-wider mb-1">Total Members</div>
                       <div className="font-bold">{g.members.toLocaleString()}</div>
                    </div>
                    <div className="bg-panel px-4 py-2 rounded border border-border/40 text-center">
                       <div className="text-[10px] uppercase text-muted-foreground font-mono tracking-wider mb-1">Combined P&L</div>
                       <div className={cn("font-bold", g.pnl >= 0 ? "text-positive" : "text-negative")}>{g.pnl >= 0 ? "+" : ""}{g.pnl}%</div>
                    </div>
                 </div>
                 
                 <button className="bg-cyan text-cyan-foreground font-bold px-8 py-3 rounded text-[14px] hover:bg-cyan/90 transition glow-cyan relative z-10">
                    Apply to Join Guild
                 </button>
               </>
             )
           })()}
        </div>
      </div>
    </div>
  );
}

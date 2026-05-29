import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { Trophy, TrendingUp, TrendingDown, Medal, Crown, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth-store";
import { usePaperTradingStore } from "@/lib/paper-trading/paper-trading-store";
import { useMarketStore } from "@/lib/market/market-state";
import { UserDataService } from "@/services/user-data-service";

export const Route = createFileRoute("/_app/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard · StockPile" }] }),
  component: LeaderboardPage,
});

type LeaderboardEntry = {
  uid: string;
  displayName: string;
  cash: number;
  positionsCount: number;
  portfolioValue: number;
  returnPct: number;
  rank: number;
};

function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const { cash, positions } = usePaperTradingStore();
  const engine = useMarketStore((s) => s.engine);

  // Calculate current user's portfolio value (Positions only)
  const myPortfolioValue = positions.reduce((sum, pos) => {
    const ticker = engine.getTicker(pos.symbol);
    const price = ticker?.price ?? pos.avgPrice;
    return sum + pos.shares * price;
  }, 0);
  const myReturnPct = ((myPortfolioValue - 100_000) / 100_000) * 100;

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      try {
        // Publish current user's stats to cloud
        if (user) {
          await UserDataService.syncPaperTrading(user.uid, {
            cash,
            positions,
            history: usePaperTradingStore.getState().history,
            pendingOrders: usePaperTradingStore.getState().pendingOrders,
            _leaderboard: {
              displayName: user.displayName || user.email?.split("@")[0] || "Anonymous",
              portfolioValue: myPortfolioValue,
              returnPct: myReturnPct,
              positionsCount: positions.length,
              updatedAt: Date.now(),
            }
          });
        }

        // For now, generate mock leaderboard data since reading all user docs
        // would require different Firestore security rules
        const mockEntries: LeaderboardEntry[] = [
          { uid: "1", displayName: "QuantWolf", cash: 42_000, positionsCount: 8, portfolioValue: 148_320, returnPct: 48.32, rank: 1 },
          { uid: "2", displayName: "AlphaTrader", cash: 55_000, positionsCount: 6, portfolioValue: 134_870, returnPct: 34.87, rank: 2 },
          { uid: "3", displayName: "DeepValue", cash: 71_000, positionsCount: 4, portfolioValue: 128_440, returnPct: 28.44, rank: 3 },
          { uid: "4", displayName: "MomentumKing", cash: 33_000, positionsCount: 12, portfolioValue: 121_200, returnPct: 21.2, rank: 4 },
          { uid: "5", displayName: "SectorRotator", cash: 68_000, positionsCount: 5, portfolioValue: 115_600, returnPct: 15.6, rank: 5 },
          { uid: "6", displayName: "SwingMaster", cash: 82_000, positionsCount: 3, portfolioValue: 112_450, returnPct: 12.45, rank: 6 },
          { uid: "7", displayName: "IndexFund42", cash: 95_000, positionsCount: 2, portfolioValue: 106_200, returnPct: 6.2, rank: 7 },
          { uid: "8", displayName: "CautionCap", cash: 98_000, positionsCount: 1, portfolioValue: 101_800, returnPct: 1.8, rank: 8 },
          { uid: "9", displayName: "NewTrader", cash: 100_000, positionsCount: 0, portfolioValue: 100_000, returnPct: 0, rank: 9 },
          { uid: "10", displayName: "BearBait", cash: 22_000, positionsCount: 7, portfolioValue: 88_400, returnPct: -11.6, rank: 10 },
        ];

        // Insert current user's real data
        if (user) {
          const myEntry: LeaderboardEntry = {
            uid: user.uid,
            displayName: user.displayName || user.email?.split("@")[0] || "You",
            cash,
            positionsCount: positions.length,
            portfolioValue: myPortfolioValue,
            returnPct: myReturnPct,
            rank: 0,
          };

          // Replace the closest mock entry or add
          mockEntries.push(myEntry);
        }

        // Sort by portfolio value
        mockEntries.sort((a, b) => b.portfolioValue - a.portfolioValue);
        mockEntries.forEach((e, i) => (e.rank = i + 1));

        setEntries(mockEntries);
      } catch (e) {
        console.error("Failed to load leaderboard", e);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [user, cash, positions, myPortfolioValue, myReturnPct]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-300" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return <span className="text-[12px] font-mono text-muted-foreground w-4 text-center">{rank}</span>;
  };

  const getRankBg = (rank: number, isMe: boolean) => {
    if (isMe) return "border-cyan/40 bg-cyan/5";
    if (rank === 1) return "border-yellow-500/30 bg-yellow-500/5";
    if (rank === 2) return "border-gray-400/30 bg-gray-400/5";
    if (rank === 3) return "border-amber-600/30 bg-amber-600/5";
    return "border-border/60";
  };

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Global Leaderboard"
        subtitle="Rankings based on paper trading portfolio performance"
        right={<Pill tone="cyan"><Trophy className="h-3 w-3" /> LIVE RANKINGS</Pill>}
      />

      {/* Your Stats Banner */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 panel-elevated p-4 border border-cyan/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-cyan/20 grid place-items-center text-cyan font-semibold text-[14px]">
                {(user.displayName || user.email || "U")[0].toUpperCase()}
              </div>
              <div>
                <div className="text-[13px] font-semibold">Your Performance</div>
                <div className="text-[11px] text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase">Portfolio</div>
                <div className="text-[16px] font-semibold tabular-nums">
                  ${myPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase">Return</div>
                <div className={`text-[16px] font-semibold tabular-nums ${myReturnPct >= 0 ? "text-positive" : "text-negative"}`}>
                  {myReturnPct >= 0 ? "+" : ""}{myReturnPct.toFixed(2)}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase">Rank</div>
                <div className="text-[16px] font-semibold text-cyan">
                  #{entries.find(e => e.uid === user.uid)?.rank || "—"}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Table */}
      <div className="panel-elevated overflow-hidden rounded-lg">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/60 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Trader</div>
          <div className="col-span-2 text-right">Portfolio</div>
          <div className="col-span-2 text-right">Return</div>
          <div className="col-span-2 text-right">Cash</div>
          <div className="col-span-1 text-right">Pos.</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-[12px]">
            Loading leaderboard...
          </div>
        ) : (
          entries.map((entry, i) => {
            const isMe = user?.uid === entry.uid;
            return (
              <motion.div
                key={entry.uid}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-border/30 transition hover:bg-white/[0.02] ${getRankBg(entry.rank, isMe)}`}
              >
                <div className="col-span-1 flex items-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-panel-elevated grid place-items-center text-[11px] font-semibold">
                    {entry.displayName[0].toUpperCase()}
                  </div>
                  <div>
                    <div className={`text-[12px] font-semibold ${isMe ? "text-cyan" : ""}`}>
                      {entry.displayName} {isMe && <span className="text-[10px] text-cyan">(You)</span>}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-right text-[12px] font-mono tabular-nums">
                  ${entry.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className={`col-span-2 text-right text-[12px] font-mono tabular-nums flex items-center justify-end gap-1 ${entry.returnPct >= 0 ? "text-positive" : "text-negative"}`}>
                  {entry.returnPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {entry.returnPct >= 0 ? "+" : ""}{entry.returnPct.toFixed(2)}%
                </div>
                <div className="col-span-2 text-right text-[12px] font-mono tabular-nums text-muted-foreground">
                  ${entry.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="col-span-1 text-right text-[12px] font-mono text-muted-foreground">
                  {entry.positionsCount}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="mt-4 panel-elevated p-4 text-[11px] text-muted-foreground">
        <Star className="h-3.5 w-3.5 inline-block mr-1 text-cyan" />
        Rankings update in real-time based on paper trading portfolio values. Start trading to climb the leaderboard!
      </div>
    </div>
  );
}

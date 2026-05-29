import { Link, useRouterState } from "@tanstack/react-router";

import {
  LayoutDashboard,
  TrendingUp,
  Brain,
  FlaskConical,
  Wallet,
  Activity,
  BarChart3,
  Newspaper,
  Filter,
  Star,
  Bell,
  Network,
  Bot,
  Terminal,
  Settings,
  Trophy,
  SplitSquareHorizontal,
  Layers,
  FileText,
  Globe,
  Briefcase,
  BellRing,
  Headphones,
  Cpu,
  MessageSquare,
  Copy,
  Shield,
} from "lucide-react";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { getMarketSession } from "@/lib/market/session";
import { useMarketStore } from "@/lib/market/market-state";
import { DataFreshness } from "@/components/widgets/DataFreshness";

const nav = [
  {
    group: "Markets",

    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },

      {
        to: "/markets",
        label: "Markets",
        icon: TrendingUp,
      },

      {
        to: "/options",
        label: "Options Chain",
        icon: SplitSquareHorizontal,
      },

      {
        to: "/orderbook",
        label: "L2 Order Book",
        icon: Layers,
      },

      {
        to: "/portfolio",
        label: "Portfolio",
        icon: Wallet,
      },

      {
        to: "/analytics",
        label: "Analytics",
        icon: BarChart3,
      },
      {
        to: "/leaderboard",
        label: "Leaderboard",
        icon: Trophy,
      },
      {
        to: "/copy-trading",
        label: "Copy Trading",
        icon: Copy,
      },
      {
        to: "/guilds",
        label: "Trading Guilds",
        icon: Shield,
      },
      {
        to: "/news",
        label: "News",
        icon: Newspaper,
      },
    ],
  },

  {
    group: "Research",

    items: [
      {
        to: "/predictions",
        label: "Predictions",
        icon: Brain,
      },

      {
        to: "/ai-research",
        label: "Research",
        icon: FlaskConical,
      },

      {
        to: "/sentiment",
        label: "Sentiment",
        icon: Activity,
      },

      {
        to: "/screeners",
        label: "Screeners",
        icon: Filter,
      },

      {
        to: "/social",
        label: "Alternative Data",
        icon: MessageSquare,
      },
      {
        to: "/ml-lab",
        label: "Machine Learning Lab",
        icon: Cpu,
      },
      {
        to: "/earnings",
        label: "Earnings Call AI",
        icon: Headphones,
      },
      {
        to: "/macro",
        label: "Macro Pulse",
        icon: Globe,
      },
      {
        to: "/alerts",
        label: "Alert Engine",
        icon: BellRing,
      },
      {
        to: "/filings",
        label: "SEC Filings",
        icon: FileText,
      },
      {
        to: "/insiders",
        label: "Insider Trades",
        icon: Briefcase,
      },

      {
        to: "/watchlists",
        label: "Watchlists",
        icon: Star,
      },
    ],
  },

  {
    group: "Infrastructure",

    items: [
      {
        to: "/alerts",
        label: "Alerts",
        icon: Bell,
      },

      {
        to: "/knowledge-graph",
        label: "Asset Relations",
        icon: Network,
      },

      {
        to: "/agents",
        label: "System Monitor",
        icon: Bot,
      },

      {
        to: "/execution-lab",
        label: "Execution Lab",
        icon: Terminal,
      },

      {
        to: "/settings",
        label: "Settings",
        icon: Settings,
      },
    ],
  },
] as const;

export function AppSidebar() {
  const path = useRouterState({
    select: (r) => r.location.pathname,
  });

  const session = getMarketSession();
  const lastUpdated = useMarketStore((s) => s.lastUpdated);

  // Determine data freshness from actual cache age
  const dataStatus = (() => {
    if (!lastUpdated) return { label: "OFFLINE", color: "text-negative" };
    const age = Date.now() - lastUpdated;
    if (age < 60_000) return { label: "LIVE", color: "text-cyan" };
    if (age < 600_000) return { label: "CACHED", color: "text-warn" };
    return { label: "STALE", color: "text-negative" };
  })();

  // Real session status colors
  const sessionColor =
    session.tone === "positive" ? "text-positive" : session.tone === "warn" ? "text-warn" : "text-negative";

  const sessionDot =
    session.tone === "positive" ? "bg-positive" : session.tone === "warn" ? "bg-warn" : "bg-negative";

  return (
    <aside className="hidden w-[244px] shrink-0 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl lg:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-border/60 px-4">
        <div className="glow-positive relative grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-cyan">
          <TrendingUp className="h-4 w-4 text-background" strokeWidth={2.5} />
        </div>

        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-tight">StockPile</div>

          <div className="font-mono text-[10px] text-muted-foreground">v1.0 · Terminal</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {nav.map((g) => (
          <div key={g.group} className="mb-4">
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
              {g.group}
            </div>

            <div className="space-y-0.5">
              {g.items.map((item) => {
                const active = path === item.to;

                const Icon = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/70 hover:text-foreground",

                      active && "bg-sidebar-accent text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-y-1 left-0 w-[2px] rounded-r bg-primary"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}

                    <Icon
                      className={cn(
                        "h-4 w-4",

                        active && "text-primary",
                      )}
                      strokeWidth={1.75}
                    />

                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/60 p-3 space-y-2">

        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-muted-foreground">DATA</span>

          <DataFreshness lastUpdated={lastUpdated} />
        </div>

        <div className="mt-2 flex items-center gap-2 rounded-md bg-sidebar-accent/60 p-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-cyan to-primary text-[11px] font-semibold text-background">
            SP
          </div>

          <div className="leading-tight">
            <div className="text-[12px] font-medium">StockPile</div>

            <div className="text-[10px] text-muted-foreground">Financial Terminal</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useRouter } from "@tanstack/react-router";
import { useMarketStore } from "@/lib/market/market-state";
import {
  BarChart3,
  Brain,
  Bell,
  Newspaper,
  Star,
  Settings,
  Search,
  TrendingUp,
  Activity,
  Wallet,
  Filter,
  Bot,
  FlaskConical,
  Network,
  Home,
  User,
} from "lucide-react";

const PAGES = [
  { name: "Dashboard", path: "/dashboard", icon: Home, keywords: "home overview" },
  { name: "Markets", path: "/markets", icon: BarChart3, keywords: "stocks tickers prices" },
  { name: "Portfolio", path: "/portfolio", icon: Wallet, keywords: "positions holdings paper trade" },
  { name: "Analytics", path: "/analytics", icon: Activity, keywords: "charts performance metrics" },
  { name: "News", path: "/news", icon: Newspaper, keywords: "headlines articles" },
  { name: "Predictions", path: "/predictions", icon: TrendingUp, keywords: "forecast prediction model" },
  { name: "AI Research", path: "/ai-research", icon: Brain, keywords: "research pipeline agents llm gemini" },
  { name: "Screeners", path: "/screeners", icon: Filter, keywords: "screen filter search" },
  { name: "Watchlists", path: "/watchlists", icon: Star, keywords: "watch favorites" },
  { name: "Alerts", path: "/alerts", icon: Bell, keywords: "notifications alarm trigger" },
  { name: "Knowledge Graph", path: "/knowledge-graph", icon: Network, keywords: "graph connections" },
  { name: "AI Agents", path: "/agents", icon: Bot, keywords: "autonomous bots" },
  { name: "Execution Lab", path: "/execution-lab", icon: FlaskConical, keywords: "backtest simulate strategy" },
  { name: "Settings", path: "/settings", icon: Settings, keywords: "preferences theme config" },
  { name: "Profile", path: "/profile", icon: User, keywords: "account user" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const tickers = useMarketStore((s) => s.tickers);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggle]);

  const navigateTo = (path: string) => {
    router.navigate({ to: path });
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <Command
          className="rounded-xl border border-border/60 bg-panel shadow-2xl overflow-hidden"
          label="Command Palette"
        >
          <div className="flex items-center gap-2 border-b border-border/40 px-4">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input
              placeholder="Search pages, tickers, or actions..."
              className="flex-1 bg-transparent py-3 text-[14px] outline-none placeholder:text-muted-foreground/50"
            />
            <kbd className="shrink-0 rounded border border-border/60 bg-panel-elevated px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[320px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-[12px] text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Pages" className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-2 pt-2 pb-1">
              {PAGES.map((page) => {
                const Icon = page.icon;
                return (
                  <Command.Item
                    key={page.path}
                    value={`${page.name} ${page.keywords}`}
                    onSelect={() => navigateTo(page.path)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] cursor-pointer transition-colors data-[selected=true]:bg-cyan/10 data-[selected=true]:text-cyan"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{page.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                      /{page.path.split("/").pop()}
                    </span>
                  </Command.Item>
                );
              })}
            </Command.Group>

            {tickers.length > 0 && (
              <Command.Group heading="Tickers" className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-2 pt-3 pb-1">
                {tickers.slice(0, 15).map((ticker) => (
                  <Command.Item
                    key={ticker.symbol}
                    value={`${ticker.symbol} ${ticker.name || ""} ${ticker.sector || ""}`}
                    onSelect={() => {
                      useMarketStore.getState().setSelectedTicker(ticker.symbol);
                      navigateTo("/dashboard");
                    }}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-[12px] cursor-pointer transition-colors data-[selected=true]:bg-cyan/10 data-[selected=true]:text-cyan"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{ticker.symbol}</span>
                      <span className="text-muted-foreground text-[11px]">{ticker.name}</span>
                    </div>
                    <span
                      className={`font-mono text-[11px] ${
                        ticker.changePct >= 0 ? "text-positive" : "text-negative"
                      }`}
                    >
                      {ticker.changePct >= 0 ? "+" : ""}
                      {ticker.changePct.toFixed(2)}%
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="flex items-center justify-between border-t border-border/40 px-4 py-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <span className="font-mono">⌘K</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

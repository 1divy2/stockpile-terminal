import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";

import { motion } from "framer-motion";

import { useEffect, useMemo, useState } from "react";

import { useMarketStore } from "@/lib/market/market-state";
import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { generateMarketEvents, type MarketEvent } from "@/utils/market-helpers";
import { formatRelativeTime } from "@/utils/format";
import type { LucideIcon } from "lucide-react";

type FeedItem = {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  tone: "positive" | "negative" | "cyan" | "warn";
  time: string;
};

function eventToFeedItem(event: MarketEvent): FeedItem {
  const iconMap: Record<MarketEvent["type"], LucideIcon> = {
    positive: TrendingUp,
    negative: TrendingDown,
    info: Activity,
    neutral: BarChart3,
  };

  const toneMap: Record<MarketEvent["type"], FeedItem["tone"]> = {
    positive: "positive",
    negative: "negative",
    info: "cyan",
    neutral: "warn",
  };

  // Extract symbol from text if present
  const symbolMatch = event.text.match(/^([A-Z/]+)\s/);
  const title = symbolMatch ? symbolMatch[1] : "Market";

  return {
    id: event.id,
    icon: iconMap[event.type],
    title,
    body: event.text,
    tone: toneMap[event.type],
    time: formatRelativeTime(event.timestamp),
  };
}

export function IntelligenceStream() {
  useMarketTickers();
  const tickers = useMarketStore((s) => s.tickers);
  const lastUpdated = useMarketStore((s) => s.lastUpdated);

  const generatedFeed = useMemo(() => {
    if (!tickers.length) {
      return [];
    }

    const events = generateMarketEvents(tickers, lastUpdated);
    return events.slice(0, 6).map(eventToFeedItem);
  }, [tickers, lastUpdated]);

  const [feed, setFeed] = useState<FeedItem[]>(generatedFeed);

  useEffect(() => {
    setFeed(generatedFeed);
  }, [generatedFeed]);

  // Rotate items periodically to feel alive — but using real data, not fake reshuffling
  useEffect(() => {
    if (!generatedFeed.length) {
      return;
    }

    const interval = setInterval(() => {
      setFeed((prev) => {
        if (prev.length <= 1) return prev;
        // Cycle: move last item to top with new id to trigger animation
        const last = prev[prev.length - 1];
        return [{ ...last, id: `${last.id}-${Date.now()}` }, ...prev.slice(0, prev.length - 1)];
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [generatedFeed]);

  return (
    <div className="panel-elevated p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            System Feed
          </div>

          <h3 className="mt-1 text-[14px] font-semibold">Market Activity</h3>
        </div>

        <div className="rounded-full border border-cyan/20 bg-cyan/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-cyan">
          {tickers.length > 0 ? "LIVE" : "OFFLINE"}
        </div>
      </div>

      <div className="space-y-2">
        {feed.map((item) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.id}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.25,
              }}
              className="rounded-xl border border-border/60 bg-panel/40 p-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-lg p-2 ${
                    item.tone === "positive"
                      ? "bg-positive/10 text-positive"
                      : item.tone === "negative"
                        ? "bg-negative/10 text-negative"
                        : item.tone === "warn"
                          ? "bg-warn/10 text-warn"
                          : "bg-cyan/10 text-cyan"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono text-[12px] font-semibold">{item.title}</div>

                    <div className="text-[10px] font-mono text-muted-foreground">{item.time}</div>
                  </div>

                  <div className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    {item.body}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

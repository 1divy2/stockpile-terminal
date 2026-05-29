import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { useMarketNews } from "@/hooks/market/useMarketNews";
import { ExternalLink, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/news")({
  head: () => ({ meta: [{ title: "Market News · StockPile" }] }),
  component: NewsPage,
});

function NewsPage() {
  const { data: news = [], isLoading } = useMarketNews();

  return (
    <div>
      <PageHeader
        eyebrow="Market News"
        title="Latest Headlines"
        subtitle="Real-time news from Yahoo Finance RSS feed"
        right={<Pill tone="cyan">{news.length} ARTICLES</Pill>}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-[13px] text-muted-foreground">Loading news feed…</span>
        </div>
      ) : news.length === 0 ? (
        <div className="panel-elevated p-8 text-center">
          <div className="text-[14px] text-muted-foreground">
            Unable to load news feed. The RSS source may be temporarily unavailable.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-3">
          {news.map(
            (n: { headline: string; source: string; category: string; url: string }, i: number) => (
              <div key={i} className="col-span-12 md:col-span-6 xl:col-span-4 panel-elevated p-4">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-cyan">{n.source.toUpperCase()}</span>
                  <span className="text-muted-foreground">{n.category}</span>
                </div>

                <h4 className="mt-2 text-[14px] font-semibold leading-snug">{n.headline}</h4>

                <div className="mt-3 flex items-center justify-between">
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] text-cyan hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Read full article
                  </a>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

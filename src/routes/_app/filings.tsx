import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { useState, useEffect } from "react";
import { useSelectedTickerStore } from "@/lib/market/selected-ticker-store";
import { SECDataService, SECFiling } from "@/services/sec-data-service";
import { FileText, Loader2, Sparkles, ExternalLink, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/filings")({
  head: () => ({ meta: [{ title: "SEC Filings · StockPile" }] }),
  component: FilingsPage,
});

function FilingsPage() {
  const selectedTicker = useSelectedTickerStore((s) => s.selectedTicker) || "NVDA";
  const [filings, setFilings] = useState<SECFiling[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const data = await SECDataService.getFilings(selectedTicker);
      if (isMounted) setFilings(data);
      if (isMounted) setLoading(false);
    };
    load();
    return () => { isMounted = false; };
  }, [selectedTicker]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="Corporate Actions"
        title="SEC Filings Analyzer"
        subtitle={`Live EDGAR ingestion and AI summarization for ${selectedTicker}`}
        right={<Pill tone="cyan"><FileText className="h-3 w-3" /> EDGAR FEED</Pill>}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filings.map((filing, i) => (
            <motion.div 
              key={filing.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="panel-elevated p-5 rounded-lg border border-border/60 hover:border-cyan/30 transition-colors group"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded bg-panel border border-border/60 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[14px] font-bold text-foreground">{filing.type}</span>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-foreground group-hover:text-cyan transition-colors">{filing.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatRelativeTime(new Date(filing.filedAt).getTime())}</span>
                      <span>•</span>
                      <a href={filing.url} className="hover:text-cyan flex items-center gap-1">View Original <ExternalLink className="h-3 w-3" /></a>
                    </div>
                  </div>
                </div>
                
                <Pill tone={filing.sentiment === "POSITIVE" ? "positive" : filing.sentiment === "NEGATIVE" ? "negative" : "warn"}>
                  {filing.sentiment}
                </Pill>
              </div>

              <div className="bg-panel/50 border border-border/40 rounded p-4">
                <div className="flex items-center gap-2 mb-2 text-cyan">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">AI Summary</span>
                </div>
                <p className="text-[13px] leading-relaxed text-foreground/90">
                  {filing.aiSummary}
                </p>
              </div>
            </motion.div>
          ))}
          
          {filings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-[13px]">
              No recent filings found for {selectedTicker}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

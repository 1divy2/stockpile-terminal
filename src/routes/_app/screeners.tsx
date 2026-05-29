import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/widgets/Primitives";
import { MarketTable } from "@/components/widgets/MarketWidgets";
import { Pill } from "@/components/widgets/AIInsightCard";
import { Filter, Search, Sparkles, Loader2, X } from "lucide-react";
import { useMarketStore } from "@/lib/market/market-state";
import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { parseNaturalLanguageQuery, applyFilters, type ScreenerFilter, type NLPScreenerResult } from "@/lib/ai/nlp-screener";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_app/screeners")({
  head: () => ({ meta: [{ title: "Screeners · StockPile" }] }),
  component: ScreenerPage,
});

function ScreenerPage() {
  useMarketTickers();
  const tickers = useMarketStore((s) => s.tickers);

  const [selectedSector, setSelectedSector] = useState("All");
  const [selectedAsset, setSelectedAsset] = useState("All");
  const [minChange, setMinChange] = useState("");
  const [maxChange, setMaxChange] = useState("");

  // NLP Screener state
  const [nlpQuery, setNlpQuery] = useState("");
  const [nlpResult, setNlpResult] = useState<NLPScreenerResult | null>(null);
  const [nlpLoading, setNlpLoading] = useState(false);
  const [nlpFilters, setNlpFilters] = useState<ScreenerFilter[]>([]);

  // Derive unique sectors and asset classes from live data
  const sectors = useMemo(
    () => ["All", ...new Set(tickers.map((t) => t.sector).filter(Boolean) as string[])],
    [tickers],
  );
  const assetClasses = useMemo(
    () => ["All", ...new Set(tickers.map((t) => t.assetClass).filter(Boolean) as string[])],
    [tickers],
  );

  const filtered = useMemo(() => {
    let result = tickers.filter((t) => {
      if (selectedSector !== "All" && t.sector !== selectedSector) return false;
      if (selectedAsset !== "All" && t.assetClass !== selectedAsset) return false;
      if (minChange && t.changePct < parseFloat(minChange)) return false;
      if (maxChange && t.changePct > parseFloat(maxChange)) return false;
      return true;
    });

    // Apply NLP filters on top
    if (nlpFilters.length > 0) {
      result = applyFilters(result, nlpFilters);
    }

    return result;
  }, [tickers, selectedSector, selectedAsset, minChange, maxChange, nlpFilters]);

  const handleNlpSearch = async () => {
    if (!nlpQuery.trim()) return;
    setNlpLoading(true);
    try {
      const result = await parseNaturalLanguageQuery(nlpQuery);
      setNlpResult(result);
      setNlpFilters(result.filters);
    } catch (e) {
      console.error(e);
    } finally {
      setNlpLoading(false);
    }
  };

  const clearNlpFilters = () => {
    setNlpQuery("");
    setNlpResult(null);
    setNlpFilters([]);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Markets"
        title="Stock Screener"
        subtitle="Filter instruments by sector, asset class, and performance"
        right={<Pill tone="cyan">{filtered.length} MATCHES</Pill>}
      />

      {/* NLP Search Bar */}
      <div className="mb-4 panel-elevated p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-cyan" />
          <h3 className="text-[13px] font-semibold">AI-Powered Natural Language Search</h3>
          <Pill tone="cyan">BETA</Pill>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={nlpQuery}
              onChange={(e) => setNlpQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNlpSearch()}
              placeholder='Try: "Tech stocks with price above $200 and positive momentum"'
              className="w-full bg-panel border border-border/60 rounded-md pl-9 pr-3 py-2.5 text-[12px] outline-none focus:border-cyan/50 transition placeholder:text-muted-foreground/40"
            />
          </div>
          <button
            onClick={handleNlpSearch}
            disabled={nlpLoading || !nlpQuery.trim()}
            className={`rounded-md px-4 h-10 text-[11px] font-semibold transition flex items-center gap-1.5 ${
              nlpLoading
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-cyan text-cyan-foreground hover:bg-cyan/90 glow-cyan"
            }`}
          >
            {nlpLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Parsing...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" /> Search
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {nlpResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="flex items-center justify-between bg-panel rounded-md border border-border/60 p-3">
                <div>
                  <div className="text-[11px] text-muted-foreground">{nlpResult.explanation}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {nlpResult.filters.map((f, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-md bg-cyan/10 border border-cyan/20 px-2 py-0.5 text-[10px] font-mono text-cyan"
                      >
                        {f.field} {f.operator} {String(f.value)}
                      </span>
                    ))}
                    {nlpResult.filters.length === 0 && (
                      <span className="text-[10px] text-muted-foreground italic">No filters parsed — try a more specific query</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={clearNlpFilters}
                  className="shrink-0 ml-3 h-6 w-6 rounded-md border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 xl:col-span-3 panel-elevated p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-cyan" />
            <h3 className="text-[13px] font-semibold">Filters</h3>
          </div>

          {/* Sector filter */}
          <div className="py-2 border-b border-border/40">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Sector
            </div>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full bg-panel border border-border/60 rounded-md px-2 py-1.5 text-[12px] outline-none"
            >
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Asset class filter */}
          <div className="py-2 border-b border-border/40">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Asset Class
            </div>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full bg-panel border border-border/60 rounded-md px-2 py-1.5 text-[12px] outline-none"
            >
              {assetClasses.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Change % range */}
          <div className="py-2 border-b border-border/40">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Min Change %
            </div>
            <input
              type="number"
              step="0.1"
              value={minChange}
              onChange={(e) => setMinChange(e.target.value)}
              placeholder="e.g. -5"
              className="w-full bg-panel border border-border/60 rounded-md px-2 py-1.5 text-[12px] font-mono outline-none placeholder:text-muted-foreground/40"
            />
          </div>

          <div className="py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Max Change %
            </div>
            <input
              type="number"
              step="0.1"
              value={maxChange}
              onChange={(e) => setMaxChange(e.target.value)}
              placeholder="e.g. 10"
              className="w-full bg-panel border border-border/60 rounded-md px-2 py-1.5 text-[12px] font-mono outline-none placeholder:text-muted-foreground/40"
            />
          </div>

          <button
            onClick={() => {
              setSelectedSector("All");
              setSelectedAsset("All");
              setMinChange("");
              setMaxChange("");
              clearNlpFilters();
            }}
            className="mt-3 w-full rounded-md border border-border/60 text-[12px] font-medium h-9 text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset All Filters
          </button>
        </div>
        <div className="col-span-12 xl:col-span-9 panel-elevated p-4">
          <MarketTable tickers={filtered} limit={20} />
        </div>
      </div>
    </div>
  );
}

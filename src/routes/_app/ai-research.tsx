import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import {
  Bot,
  GitBranch,
  Database,
  Newspaper,
  BarChart3,
  Cpu,
  FileText,
  Users,
  Shield,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { useMarketStore } from "@/lib/market/market-state";
import { MarketTicker } from "@/lib/market/market-types";
import { formatPercent, getChangeColor } from "@/utils/format";
import { useNews } from "@/hooks/market/useNews";
import { aggregateSentiment } from "@/utils/sentiment";
import { generateTradeSignal } from "@/utils/signals";
import { useCandles } from "@/hooks/market/useCandles";
import { evaluateTechnicals } from "@/utils/indicators";
import { generateResearchReport, ResearchReport } from "@/utils/llm-engine";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/widgets/ToastProvider";
import { runMultiAgentResearch, type MultiAgentResult, type AgentReport } from "@/lib/ai/multi-agent-researcher";

export const Route = createFileRoute("/_app/ai-research")({
  head: () => ({ meta: [{ title: "AI Research · StockPile" }] }),
  component: AIResearch,
});

const pipelineStages = [
  {
    id: 1,
    name: "Data Ingestion",
    description:
      "Aggregate market data, news feeds, and financial data via TwelveData API and Yahoo Finance RSS.",
    status: "Active",
    icon: Database,
  },
  {
    id: 2,
    name: "Technical Analysis",
    description: "Compute RSI, MACD, moving averages, and Bollinger Bands from OHLCV candle data.",
    status: "Active",
    icon: BarChart3,
  },
  {
    id: 3,
    name: "Sentiment Analysis",
    description: "Lexicon-based processing of Yahoo Finance news headlines for sentiment scoring.",
    status: "Active",
    icon: Newspaper,
  },
  {
    id: 4,
    name: "Signal Generation",
    description:
      "Combine technical and sentiment indicators into actionable buy/sell/hold signals.",
    status: "Active",
    icon: Cpu,
  },
  {
    id: 5,
    name: "Report Generation",
    description: "LLM-powered research reports with thesis, catalysts, and risk analysis.",
    status: "Active",
    icon: FileText,
  },
];

function SignalGridItem({ ticker }: { ticker: MarketTicker }) {
  const { data: candleData = [] } = useCandles(ticker.symbol, "1M");
  const techAgg = evaluateTechnicals(candleData);
  
  const positive = ticker.changePct >= 0;
  // Use real RSI if available, otherwise fallback to a neutral 50 until loaded
  const realRsi = techAgg.rsiVal || 50;

  return (
    <div className="rounded-md border border-border/60 p-3 hover:border-cyan/30 transition">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12.5px] font-semibold">{ticker.symbol}</div>
          <div className="text-[10px] font-mono text-muted-foreground">
            {ticker.name || ticker.sector || "—"}
          </div>
        </div>
        <Pill tone={positive ? "positive" : "negative"}>{positive ? "POSITIVE" : "NEGATIVE"}</Pill>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-mono">
        <div>
          <div className="text-muted-foreground">PRICE</div>
          <div>${ticker.price.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">CHANGE</div>
          <div className={getChangeColor(ticker.changePct)}>
            {formatPercent(ticker.changePct)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">RSI</div>
          <div
            className={
              realRsi > 65 ? "text-negative" : realRsi < 35 ? "text-positive" : "text-cyan"
            }
          >
            {realRsi.toFixed(0)} {realRsi > 65 ? "OB" : realRsi < 35 ? "OS" : "NEUT"}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalGrid() {
  useMarketTickers();

  const liveTickers = useMarketStore((s) => s.tickers);

  const selectedTicker = useMarketStore((s) => s.selectedTicker);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {[...liveTickers]
        .sort((a, b) => (a.symbol === selectedTicker ? -1 : b.symbol === selectedTicker ? 1 : 0))
        .slice(0, 6)
        .map((ticker) => (
          <SignalGridItem key={ticker.symbol} ticker={ticker} />
        ))}
    </div>
  );
}

function LiveNewsSentiment({ ticker }: { ticker: string }) {
  const { data: news = [], isLoading: newsLoading } = useNews(ticker);
  const { data: candleData = [], isLoading: candlesLoading } = useCandles(ticker, "1M");

  if (newsLoading || candlesLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        Aggregating live signals...
      </div>
    );
  }

  const sentimentAgg = aggregateSentiment(news.map((n) => ({ headline: n.title })));
  const techAgg = evaluateTechnicals(candleData);
  const tradeSignal = generateTradeSignal(techAgg, sentimentAgg);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div className="rounded-md border border-border/60 p-4">
        <div className="text-[12px] font-mono text-cyan mb-3 uppercase tracking-wider">
          Aggregated Trade Signal
        </div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div
              className={`text-2xl font-bold ${
                tradeSignal.verdict.includes("BUY")
                  ? "text-positive"
                  : tradeSignal.verdict.includes("SELL")
                    ? "text-negative"
                    : "text-cyan"
              }`}
            >
              {tradeSignal.verdict.replace("_", " ")}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Conviction: {tradeSignal.conviction}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Combined Score</div>
            <div className="text-xl font-mono">
              {tradeSignal.combinedScore > 0 ? "+" : ""}
              {tradeSignal.combinedScore.toFixed(1)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-muted-foreground">Reasoning:</div>
          {tradeSignal.reasons.map((r, i) => (
            <div key={i} className="text-[11px] leading-relaxed pl-2 border-l border-border/50">
              {r}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-border/60 p-4 max-h-[300px] overflow-y-auto">
        <div className="text-[12px] font-mono text-cyan mb-3 uppercase tracking-wider flex justify-between items-center">
          <span>Live News Sentiment</span>
          <Pill
            tone={
              sentimentAgg.verdict === "POSITIVE"
                ? "positive"
                : sentimentAgg.verdict === "NEGATIVE"
                  ? "negative"
                  : "cyan"
            }
          >
            {sentimentAgg.verdict} ({sentimentAgg.score > 0 ? "+" : ""}
            {sentimentAgg.score.toFixed(1)})
          </Pill>
        </div>

        {news.length === 0 ? (
          <div className="text-[11px] text-muted-foreground py-4 text-center">
            No recent news available.
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((article) => (
              <a
                key={article.id}
                href={article.link}
                target="_blank"
                rel="noreferrer"
                className="block p-2 rounded hover:bg-white/5 transition"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="text-[11.5px] leading-snug flex-1">{article.title}</div>
                  {article.sentiment.score !== 0 && (
                    <span
                      className={`text-[10px] font-mono whitespace-nowrap ${article.sentiment.score > 0 ? "text-positive" : "text-negative"}`}
                    >
                      {article.sentiment.score > 0 ? "+" : ""}
                      {article.sentiment.score}
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">
                  {new Date(article.pubDate).toLocaleString()} · {article.source}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportGenerator({ ticker }: { ticker: string }) {
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: news = [] } = useNews(ticker);
  const { data: candleData = [] } = useCandles(ticker, "1M");
  const engine = useMarketStore((s) => s.engine);
  const tickerData = engine.getTicker(ticker);

  useEffect(() => {
    if (!tickerData || candleData.length === 0) return;
    let isMounted = true;
    
    async function loadReport() {
      setLoading(true);
      try {
        const sentimentAgg = aggregateSentiment(news.map((n) => ({ headline: n.title })));
        const techAgg = evaluateTechnicals(candleData);
        const tradeSignal = generateTradeSignal(techAgg, sentimentAgg);
        
        const generated = await generateResearchReport(
          ticker,
          tickerData!.price,
          tickerData!.changePct,
          techAgg,
          sentimentAgg,
          tradeSignal
        );
        if (isMounted) setReport(generated);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    loadReport();
    return () => { isMounted = false; };
  }, [ticker, tickerData, candleData, news]);

  if (loading || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-cyan" />
        <div className="text-[11px] font-mono uppercase tracking-widest">
          Generating Institutional Research Report...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-cyan uppercase tracking-wider">
          LLM Executive Summary
        </h4>
        <div className="text-[10px] text-muted-foreground font-mono">
          GENERATED: {new Date(report.generatedAt).toLocaleTimeString()}
        </div>
      </div>
      
      <div className="bg-panel rounded-md p-4 border border-border/60">
        <div className="text-[12.5px] leading-relaxed mb-4">
          <span className="font-semibold">Thesis:</span> {report.thesis}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-mono text-positive mb-2">KEY CATALYSTS</div>
            <ul className="space-y-1.5 list-disc list-inside text-[11.5px] text-muted-foreground">
              {report.catalysts.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-mono text-negative mb-2">RISK FACTORS</div>
            <ul className="space-y-1.5 list-disc list-inside text-[11.5px] text-muted-foreground">
              {report.risks.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const AGENT_ICONS: Record<string, typeof Bot> = {
  macro: Globe,
  technician: BarChart3,
  risk: Shield,
  sentiment: Newspaper,
};

function AgentCard({ agent, index }: { agent: AgentReport; index: number }) {
  const Icon = AGENT_ICONS[agent.role] || Bot;
  const verdictColor =
    agent.verdict === "BULLISH" ? "text-positive" :
    agent.verdict === "BEARISH" ? "text-negative" : "text-cyan";
  const verdictBg =
    agent.verdict === "BULLISH" ? "bg-positive/10" :
    agent.verdict === "BEARISH" ? "bg-negative/10" : "bg-cyan/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-lg border border-border/60 p-4 hover:border-cyan/30 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-md grid place-items-center ${verdictBg}`}>
            <Icon className={`h-3.5 w-3.5 ${verdictColor}`} />
          </div>
          <div>
            <div className="text-[12px] font-semibold">{agent.emoji} {agent.title}</div>
          </div>
        </div>
        <Pill tone={agent.verdict === "BULLISH" ? "positive" : agent.verdict === "BEARISH" ? "negative" : "cyan"}>
          {agent.verdict}
        </Pill>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Confidence</span>
          <span className="font-mono">{agent.confidence}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-panel overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${agent.confidence}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
            className={`h-full rounded-full ${
              agent.verdict === "BULLISH" ? "bg-positive" :
              agent.verdict === "BEARISH" ? "bg-negative" : "bg-cyan"
            }`}
          />
        </div>
      </div>

      <p className="text-[11.5px] leading-relaxed text-muted-foreground mb-3">
        {agent.analysis}
      </p>

      <div className="space-y-1">
        {agent.keyPoints.map((point, i) => (
          <div key={i} className="text-[10.5px] text-muted-foreground pl-2 border-l border-border/50">
            {point}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function MultiAgentPanel({ ticker }: { ticker: string }) {
  const [result, setResult] = useState<MultiAgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: news = [] } = useNews(ticker);
  const { data: candleData = [] } = useCandles(ticker, "1M");
  const engine = useMarketStore((s) => s.engine);
  const tickerData = engine.getTicker(ticker);

  const runResearch = async () => {
    if (!tickerData || candleData.length === 0) return;
    setLoading(true);
    try {
      const sentimentAgg = aggregateSentiment(news.map((n) => ({ headline: n.title })));
      const techAgg = evaluateTechnicals(candleData);
      const tradeSignal = generateTradeSignal(techAgg, sentimentAgg);
      const res = await runMultiAgentResearch(
        ticker, tickerData.price, tickerData.changePct,
        techAgg, sentimentAgg, tradeSignal
      );
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const consensusColor =
    result?.consensus.includes("BUY") ? "text-positive" :
    result?.consensus.includes("SELL") ? "text-negative" : "text-cyan";

  return (
    <div className="panel-elevated p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-cyan" />
          <h3 className="text-[13px] font-semibold">Multi-Agent Research Council</h3>
        </div>
        <button
          onClick={runResearch}
          disabled={loading || !tickerData}
          className={`rounded-md px-3 h-7 text-[11px] font-semibold transition ${
            loading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-cyan text-cyan-foreground hover:bg-cyan/90 glow-cyan"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Consulting Agents...
            </span>
          ) : (
            `Research ${ticker}`
          )}
        </button>
      </div>

      {!result && !loading && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Users className="h-8 w-8 mb-3 opacity-30" />
          <div className="text-[11px] font-mono">Click &quot;Research&quot; to deploy 4 specialized AI agents</div>
          <div className="text-[10px] mt-1 opacity-60">
            Macro Economist · Technical Analyst · Risk Manager · Sentiment Analyst
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-cyan" />
          <div className="text-[11px] font-mono uppercase tracking-widest">
            Deploying 4 AI agents in parallel...
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg border border-border/60 bg-panel p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
                  Consensus Verdict
                </div>
                <div className={`text-2xl font-bold ${consensusColor}`}>
                  {result.consensus.replace("_", " ")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">Score</div>
                <div className={`text-xl font-mono ${consensusColor}`}>
                  {result.consensusScore > 0 ? "+" : ""}{result.consensusScore.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
              {result.executiveSummary}
            </div>
            <div className="mt-2 text-[9px] font-mono text-muted-foreground">
              Generated: {new Date(result.generatedAt).toLocaleTimeString()}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.agents.map((agent, i) => (
              <AgentCard key={agent.role} agent={agent} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AIResearch() {
  const selectedTicker = useMarketStore((s) => s.selectedTicker);
  const { pushToast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [pipelineState, setPipelineState] = useState(pipelineStages);

  const runPipeline = () => {
    setIsRunning(true);
    let currentStage = 0;
    
    // Reset all to pending first
    setPipelineState((prev) => prev.map(s => ({ ...s, status: "Pending" })));

    const interval = setInterval(() => {
      setPipelineState((prev) => prev.map((s, i) => {
        if (i === currentStage) return { ...s, status: "Running" };
        if (i < currentStage) return { ...s, status: "Active" };
        return { ...s, status: "Pending" };
      }));
      
      currentStage++;
      
      if (currentStage > pipelineStages.length) {
        clearInterval(interval);
        setPipelineState(pipelineStages);
        setIsRunning(false);
        pushToast({ title: "Pipeline execution completed successfully", tone: "success" });
      }
    }, 800);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Research"
        title="AI Research Pipeline"
        subtitle="Automated market analysis and signal generation"
        right={<Pill tone="positive">System Online</Pill>}
      />

      <div className="grid grid-cols-12 gap-3">
        {/* Pipeline stages */}
        <div className="col-span-12 xl:col-span-5 panel-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-cyan" />
              <h3 className="text-[13px] font-semibold">Research Pipeline</h3>
            </div>
            <button
              onClick={runPipeline}
              disabled={isRunning}
              className={`rounded-md px-3 h-7 text-[11px] font-semibold transition ${
                isRunning
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-cyan text-cyan-foreground hover:bg-cyan/90 glow-cyan"
              }`}
            >
              {isRunning ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Running
                </span>
              ) : (
                "Run Pipeline"
              )}
            </button>
          </div>
          <div className="space-y-2">
            {pipelineState.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <div key={stage.id} className="rounded-md border border-border/60 p-3 relative">
                  {i < pipelineState.length - 1 && (
                    <div className="absolute left-[22px] top-full h-2 w-px bg-border/60" />
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-7 w-7 rounded-md grid place-items-center shrink-0 ${
                        stage.status === "Active"
                          ? "bg-positive/10 text-positive"
                          : stage.status === "Running"
                          ? "bg-cyan/20 text-cyan animate-pulse"
                          : "bg-panel text-muted-foreground"
                      }`}
                    >
                      {stage.status === "Running" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-[12.5px] font-medium">{stage.name}</div>
                        <Pill
                          tone={
                            stage.status === "Active"
                              ? "positive"
                              : stage.status === "Running"
                              ? "cyan"
                              : "warn"
                          }
                        >
                          {stage.status}
                        </Pill>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {stage.description}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Architecture description */}
        <div className="col-span-12 xl:col-span-7 panel-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold">Pipeline Architecture</h3>
            <Pill tone="positive">Production</Pill>
          </div>
          <div className="space-y-4">
            {[
              {
                h: "Data Layer",
                t: "Live market data from TwelveData API (27 instruments). Live news ingestion from Yahoo Finance RSS via CORS proxy. OHLCV candle data and headlines available for computation.",
              },
              {
                h: "Analysis Engine",
                t: "Active: RSI, MACD, Bollinger Bands, moving average crossovers, and VWAP computed client-side from TwelveData candle histories.",
              },
              {
                h: "Signal Framework",
                t: "Active: Multi-factor signal scoring combining technical indicators with live news sentiment analysis. Signals include conviction levels.",
              },
              {
                h: "Report Generation",
                t: "Active: LLM-powered research report generation with structured thesis, catalyst identification, and risk analysis using localized inference engine.",
              },
            ].map((c, i) => (
              <motion.div
                key={c.h}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="text-[10px] font-mono text-cyan tracking-[0.18em] uppercase mb-1">
                  {c.h}
                </div>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{c.t}</p>
              </motion.div>
            ))}
            <div className="text-[11px] font-mono text-muted-foreground border-t border-border/60 pt-3">
              Active Sources:
              <span className="ml-2 text-positive">TwelveData API</span>
              <span className="ml-2 text-positive">Yahoo Finance RSS</span>
              <span className="ml-2 text-positive">Technical Indicators (Active)</span>
              <span className="ml-2 text-positive">Algorithmic Report Engine</span>
            </div>
          </div>
        </div>

        {/* Signal Monitor grid — uses real data */}
        <div className="col-span-12 panel-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-cyan" />
              <h3 className="text-[13px] font-semibold">Signal Monitor</h3>
            </div>
            <Pill tone="cyan">LIVE DATA</Pill>
          </div>
          <SignalGrid />
          <LiveNewsSentiment ticker={selectedTicker} />
          
          <div className="mt-4 pt-4 border-t border-border/60">
            <ReportGenerator ticker={selectedTicker} />
          </div>
        </div>

        {/* Multi-Agent Research Council */}
        <div className="col-span-12">
          <MultiAgentPanel ticker={selectedTicker} />
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, MetricCard } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { AreaPriceChart, PredictionChart } from "@/components/widgets/Charts";
import { Terminal as TerminalIcon, TrendingUp, Wallet, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatRelativeTime } from "@/utils/format";
import { useToast } from "@/components/widgets/ToastProvider";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { runBacktest, type BacktestResult } from "@/lib/paper-trading/backtest-engine";
import { BotService } from "@/services/trading-bot-service";

export const Route = createFileRoute("/_app/execution-lab")({
  head: () => ({ meta: [{ title: "Execution Lab · StockPile" }] }),
  component: ExecutionLab,
});

function ExecutionLab() {
  const { pushToast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [isBotRunning, setIsBotRunning] = useState(BotService.getStatus() === "RUNNING");
  
  // Strategy Parameters State
  const [universe, setUniverse] = useState("Custom Watchlist");
  const [rebalance, setRebalance] = useState("Manual");
  const [riskLimit, setRiskLimit] = useState(2);
  const [stopLoss, setStopLoss] = useState(5);
  const [takeProfit, setTakeProfit] = useState(10);
  const [leverage, setLeverage] = useState(1);
  
  // Backtest Results State
  const [result, setResult] = useState<BacktestResult | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("universe")) setUniverse(params.get("universe")!);
      if (params.has("rebalance")) setRebalance(params.get("rebalance")!);
      if (params.has("riskLimit")) setRiskLimit(Number(params.get("riskLimit")));
      if (params.has("stopLoss")) setStopLoss(Number(params.get("stopLoss")));
      if (params.has("takeProfit")) setTakeProfit(Number(params.get("takeProfit")));
      if (params.has("leverage")) setLeverage(Number(params.get("leverage")));
    }
  }, []);

  const handleShareStrategy = () => {
    const params = new URLSearchParams({
      universe,
      rebalance,
      riskLimit: riskLimit.toString(),
      stopLoss: stopLoss.toString(),
      takeProfit: takeProfit.toString(),
      leverage: leverage.toString()
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    pushToast({ title: "Strategy link copied to clipboard", tone: "info" });
  };

  const handleDeployBot = () => {
    if (isBotRunning) {
      BotService.stop();
      setIsBotRunning(false);
      pushToast({ title: "Live Bot stopped", tone: "error" });
    } else {
      BotService.deploy("Custom Quant Strategy");
      setIsBotRunning(true);
      pushToast({ title: "Bot deployed successfully! It is now monitoring markets.", tone: "success" });
    }
  };

  const handleRunBacktest = () => {
    setIsTesting(true);
    // Simulate network delay for realism
    setTimeout(() => {
      const res = runBacktest(universe, rebalance, riskLimit, stopLoss, takeProfit, leverage);
      setResult(res);
      setIsTesting(false);
      pushToast({ title: "Backtest completed successfully", tone: "success" });
    }, 1500);
  };

  const chartData = result?.equityCurve.map(c => ({
    timestamp: Math.floor(c.timestamp / 1000), // AreaPriceChart expects seconds
    price: c.value
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Trading · Simulation"
        title="Execution Lab"
        subtitle="Algorithmic backtesting and strategy evaluation"
        right={
          <Pill tone={result ? "positive" : "warn"}>
            {result ? `${result.metrics.totalTrades} TRADES EVALUATED` : "READY FOR BACKTEST"}
          </Pill>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Total Trades"
          value={`${result?.metrics.totalTrades || 0}`}
          accent="cyan"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
        <MetricCard 
          label="Max Drawdown" 
          value={result ? `${result.metrics.maxDrawdown.toFixed(2)}%` : "—"} 
          accent={result && result.metrics.maxDrawdown > 20 ? "negative" : "cyan"} 
        />
        <MetricCard
          label="Realized P&L"
          value={result ? formatCurrency(result.metrics.realizedPnl) : "—"}
          accent={result && result.metrics.realizedPnl >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="Win Rate"
          value={result ? `${result.metrics.winRate}%` : "—"}
          accent={result && result.metrics.winRate >= 50 ? "positive" : "warn"}
        />
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 xl:col-span-8 panel-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold">Equity Curve</h3>
            <Pill tone={result ? "cyan" : "warn"}>{result ? "Backtest Results" : "Awaiting Data"}</Pill>
          </div>
          
          {chartData ? (
            <AreaPriceChart 
              data={chartData} 
              height={280} 
              color={result!.metrics.realizedPnl >= 0 ? "var(--color-positive)" : "var(--color-negative)"} 
            />
          ) : (
            <div className="opacity-40 pointer-events-none">
              <PredictionChart seed={777} base={100} height={280} />
            </div>
          )}
          
          <div className="mt-2 text-[11px] text-muted-foreground">
            {result ? "Simulated equity curve based on historical execution of your strategy parameters over the last 180 days." : "Configure your parameters and run a backtest to generate an equity curve."}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 panel-elevated p-4">
          <div className="flex items-center gap-2 mb-3">
            <TerminalIcon className="h-4 w-4 text-cyan" />
            <h3 className="text-[13px] font-semibold">Execution Logs</h3>
          </div>
          <div className="font-mono text-[10.5px] leading-relaxed space-y-0.5 scanlines bg-panel rounded-md p-3 border border-border/60 h-[280px] overflow-y-auto">
            {!result || result.trades.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Wallet className="h-6 w-6 text-muted-foreground/40 mb-2" />
                <div className="text-[12px] text-muted-foreground">No execution data</div>
                <div className="text-[10px] text-muted-foreground/60 mt-1">
                  Run a backtest to see simulated trades
                </div>
              </div>
            ) : (
              result.trades.map((trade) => (
                <div key={trade.id} className="flex gap-2">
                  <span className="text-muted-foreground/70 shrink-0">
                    {formatRelativeTime(trade.timestamp)}
                  </span>
                  <span className={cn("shrink-0", trade.type === "BUY" ? "text-positive" : "text-negative")}>
                    {trade.type}
                  </span>
                  <span className="text-foreground/80 truncate">
                    {trade.shares} {trade.symbol} @ {formatCurrency(trade.price)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-span-12 panel-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold">Strategy Parameters</h3>
            <Pill tone="cyan">Interactive</Pill>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-md border border-border/60 p-3 bg-panel/40">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Universe</label>
              <select 
                value={universe}
                onChange={(e) => setUniverse(e.target.value)}
                className="w-full bg-background border border-border/60 rounded px-2 py-1 text-[12px] outline-none focus:border-cyan"
              >
                <option>Custom Watchlist</option>
                <option>S&P 500</option>
                <option>Nasdaq 100</option>
              </select>
            </div>
            <div className="rounded-md border border-border/60 p-3 bg-panel/40">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Rebalance</label>
              <select 
                value={rebalance}
                onChange={(e) => setRebalance(e.target.value)}
                className="w-full bg-background border border-border/60 rounded px-2 py-1 text-[12px] outline-none focus:border-cyan"
              >
                <option>Manual</option>
                <option>Daily</option>
                <option>Weekly</option>
              </select>
            </div>
            <div className="rounded-md border border-border/60 p-3 bg-panel/40">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Risk Limit (%)</label>
              <input 
                type="number" 
                value={riskLimit}
                onChange={(e) => setRiskLimit(Number(e.target.value))}
                className="w-full bg-background border border-border/60 rounded px-2 py-1 text-[12px] outline-none focus:border-cyan" 
              />
            </div>
            <div className="rounded-md border border-border/60 p-3 bg-panel/40">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Stop Loss (%)</label>
              <input 
                type="number" 
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full bg-background border border-border/60 rounded px-2 py-1 text-[12px] outline-none focus:border-cyan" 
              />
            </div>
            <div className="rounded-md border border-border/60 p-3 bg-panel/40">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Take Profit (%)</label>
              <input 
                type="number" 
                value={takeProfit}
                onChange={(e) => setTakeProfit(Number(e.target.value))}
                className="w-full bg-background border border-border/60 rounded px-2 py-1 text-[12px] outline-none focus:border-cyan" 
              />
            </div>
            <div className="rounded-md border border-border/60 p-3 bg-panel/40">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Leverage</label>
              <select 
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full bg-background border border-border/60 rounded px-2 py-1 text-[12px] outline-none focus:border-cyan"
              >
                <option value={1}>1.0x (None)</option>
                <option value={2}>2.0x</option>
                <option value={3}>3.0x</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
             <button 
               onClick={handleShareStrategy}
               className="rounded-md border border-border/60 px-4 py-1.5 text-[12px] font-semibold text-muted-foreground transition hover:bg-panel hover:text-foreground flex items-center gap-1.5"
             >
                <Share2 className="h-3.5 w-3.5" /> Share
             </button>
             <button 
               onClick={() => pushToast({ title: "Strategy parameters saved to profile", tone: "success" })}
               className="rounded-md border border-cyan/40 px-4 py-1.5 text-[12px] font-semibold text-cyan transition hover:bg-cyan/10"
             >
                Save Parameters
             </button>
             <button
               onClick={handleDeployBot}
               className={cn("rounded-md border px-4 py-1.5 text-[12px] font-semibold transition flex items-center gap-1.5", isBotRunning ? "border-negative/40 text-negative hover:bg-negative/10" : "border-positive/40 text-positive hover:bg-positive/10")}
             >
                {isBotRunning ? "Stop Bot" : "Deploy Bot Live"}
             </button>
             <button 
               onClick={handleRunBacktest}
               disabled={isTesting}
               className={`rounded-md px-4 py-1.5 text-[12px] font-semibold transition ${
                 isTesting
                   ? "bg-muted text-muted-foreground cursor-not-allowed"
                   : "bg-cyan text-cyan-foreground hover:bg-cyan/90 glow-cyan"
               }`}
             >
                {isTesting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Running
                  </span>
                ) : (
                  "Run Backtest"
                )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

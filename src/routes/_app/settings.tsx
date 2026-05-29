import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { cn } from "@/lib/utils";
import { usePaperTradingStore } from "@/lib/paper-trading/paper-trading-store";
import { getMarketSession } from "@/lib/market/session";
import { formatCurrency } from "@/utils/format";
import { useSettingsStore } from "@/store/settings-store";
import { useToast } from "@/components/widgets/ToastProvider";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings · StockPile" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { 
    theme, density, animationsEnabled, setTheme, setDensity, setAnimationsEnabled,
    defaultChartTimeframe, numberFormat, refreshInterval, showWatchlistInline,
    setDefaultChartTimeframe, setNumberFormat, setRefreshInterval, setShowWatchlistInline
  } = useSettingsStore();
  const { cash, positions, history } = usePaperTradingStore();
  const session = getMarketSession();
  const { pushToast } = useToast();

  const apiKeyConfigured = Boolean(import.meta.env.VITE_TWELVEDATA_API_KEY);

  const sections = [
    {
      name: "Paper Trading",
      items: [
        ["Starting Capital", "$100,000.00"],
        ["Current Cash", formatCurrency(cash)],
        ["Active Positions", `${positions.length}`],
        ["Total Trades", `${history.length}`],
      ],
    },
    {
      name: "Data Source",
      items: [
        ["Provider", "TwelveData API"],
        ["API Key", apiKeyConfigured ? "Configured ✓" : "Not configured"],
        ["Cache Duration", "10 minutes"],
        ["News Source", "Yahoo Finance RSS"],
      ],
    },
    {
      name: "Market Session",
      items: [
        ["Current Session", session.label],
        ["Trading Enabled", session.isTradingEnabled ? "Yes" : "No"],
        ["Exchange", "NYSE / NASDAQ"],
        ["Next Event", session.nextEvent || "—"],
      ],
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        subtitle="Application configuration and appearance"
        right={<Pill tone="cyan">v1.0</Pill>}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="panel-elevated p-5 md:col-span-2">
          <h3 className="text-[14px] font-semibold mb-4 text-cyan uppercase tracking-wider">Appearance & Experience</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Theme</label>
              <select 
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value as any);
                  pushToast({ title: "Theme updated", tone: "success" });
                }}
                className="w-full bg-panel border border-border/60 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan transition"
              >
                <option value="dark">Institutional Dark</option>
                <option value="light">Research Light</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">UI Density</label>
              <select 
                value={density}
                onChange={(e) => {
                  setDensity(e.target.value as any);
                  pushToast({ title: "Density updated", tone: "success" });
                }}
                className="w-full bg-panel border border-border/60 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan transition"
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact Data</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Micro-Animations</label>
              <div className="flex items-center h-[38px]">
                <button
                  onClick={() => {
                    setAnimationsEnabled(!animationsEnabled);
                    pushToast({ title: animationsEnabled ? "Animations disabled" : "Animations enabled", tone: "success" });
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-background ${
                    animationsEnabled ? "bg-cyan" : "bg-panel border border-border"
                  }`}
                  role="switch"
                  aria-checked={animationsEnabled}
                >
                  <span className="sr-only">Use animations</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute left-0.5 inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      animationsEnabled ? "translate-x-4" : "translate-x-0 bg-muted-foreground"
                    }`}
                  />
                </button>
                <span className="ml-3 text-[13px] text-muted-foreground">
                  {animationsEnabled ? "Enabled" : "Disabled (Reduced Motion)"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="panel-elevated p-5 md:col-span-2 mt-4">
          <h3 className="text-[14px] font-semibold mb-4 text-cyan uppercase tracking-wider">Trading Preferences</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Default Timeframe</label>
              <select 
                value={defaultChartTimeframe}
                onChange={(e) => {
                  setDefaultChartTimeframe(e.target.value as any);
                  pushToast({ title: "Default timeframe updated", tone: "success" });
                }}
                className="w-full bg-panel border border-border/60 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan transition"
              >
                <option value="1D">1 Day</option>
                <option value="1W">1 Week</option>
                <option value="1M">1 Month</option>
                <option value="3M">3 Months</option>
                <option value="1Y">1 Year</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Number Format</label>
              <select 
                value={numberFormat}
                onChange={(e) => {
                  setNumberFormat(e.target.value as any);
                  pushToast({ title: "Number format updated", tone: "success" });
                }}
                className="w-full bg-panel border border-border/60 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan transition"
              >
                <option value="standard">Standard (1,234.56)</option>
                <option value="compact">Compact (1.23K)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Refresh Interval</label>
              <select 
                value={refreshInterval}
                onChange={(e) => {
                  setRefreshInterval(e.target.value as any);
                  pushToast({ title: "Refresh interval updated", tone: "success" });
                }}
                className="w-full bg-panel border border-border/60 rounded-md px-3 py-2 text-[13px] outline-none focus:border-cyan transition"
              >
                <option value="realtime">Real-time (WebSocket)</option>
                <option value="10s">Every 10 seconds</option>
                <option value="30s">Every 30 seconds</option>
                <option value="60s">Every 60 seconds</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Inline Watchlists</label>
              <div className="flex items-center h-[38px]">
                <button
                  onClick={() => {
                    setShowWatchlistInline(!showWatchlistInline);
                    pushToast({ title: showWatchlistInline ? "Inline watchlists hidden" : "Inline watchlists shown", tone: "success" });
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-background ${
                    showWatchlistInline ? "bg-cyan" : "bg-panel border border-border"
                  }`}
                  role="switch"
                  aria-checked={showWatchlistInline}
                >
                  <span className="sr-only">Show watchlists inline</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute left-0.5 inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showWatchlistInline ? "translate-x-4" : "translate-x-0 bg-muted-foreground"
                    }`}
                  />
                </button>
                <span className="ml-3 text-[13px] text-muted-foreground">
                  {showWatchlistInline ? "Shown" : "Hidden"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {sections.map((s) => (
          <div key={s.name} className="panel-elevated p-4">
            <h3 className="text-[13px] font-semibold mb-3 text-cyan">{s.name}</h3>
            {s.items.map(([l, v], i) => (
              <div
                key={l}
                className={cn(
                  "flex items-center justify-between py-2.5",
                  i < s.items.length - 1 && "border-b border-border/40",
                )}
              >
                <div className="text-[12px] text-muted-foreground">{l}</div>
                <div className="text-[12.5px] font-mono">{v}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

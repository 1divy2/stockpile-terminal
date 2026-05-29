import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { BellRing, Plus, Smartphone, Webhook, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/widgets/ToastProvider";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({ meta: [{ title: "Alerts Engine · StockPile" }] }),
  component: AlertsPage,
});

type AlertConfig = {
  id: string;
  symbol: string;
  condition: "ABOVE" | "BELOW" | "EARNINGS";
  targetPrice?: number;
  delivery: "SMS" | "WEBHOOK";
  active: boolean;
};

function AlertsPage() {
  const { pushToast } = useToast();
  const [alerts, setAlerts] = useState<AlertConfig[]>([
    { id: "1", symbol: "NVDA", condition: "ABOVE", targetPrice: 150, delivery: "SMS", active: true },
    { id: "2", symbol: "TSLA", condition: "BELOW", targetPrice: 160, delivery: "WEBHOOK", active: true },
    { id: "3", symbol: "AAPL", condition: "EARNINGS", delivery: "SMS", active: false },
  ]);

  const [symbol, setSymbol] = useState("MSFT");
  const [condition, setCondition] = useState<AlertConfig["condition"]>("ABOVE");
  const [target, setTarget] = useState("450");
  const [delivery, setDelivery] = useState<AlertConfig["delivery"]>("SMS");

  const handleAdd = () => {
    setAlerts([...alerts, {
      id: crypto.randomUUID(),
      symbol,
      condition,
      targetPrice: condition !== "EARNINGS" ? Number(target) : undefined,
      delivery,
      active: true
    }]);
    pushToast({ title: "Alert rule created", tone: "success" });
  };

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="Monitoring"
        title="Custom Alert Engine"
        subtitle="Configure SMS and Webhook triggers for live market events"
        right={<Pill tone="cyan"><BellRing className="h-3 w-3" /> ENGINE ONLINE</Pill>}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 panel-elevated p-5 rounded-lg h-min">
          <h3 className="text-[14px] font-semibold mb-4">Create New Alert</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Ticker Symbol</label>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} className="w-full bg-panel border border-border/60 rounded px-3 py-1.5 outline-none focus:border-cyan text-[13px] font-mono" />
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Trigger Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value as any)} className="w-full bg-panel border border-border/60 rounded px-3 py-1.5 outline-none focus:border-cyan text-[13px]">
                <option value="ABOVE">Price Goes Above</option>
                <option value="BELOW">Price Drops Below</option>
                <option value="EARNINGS">Earnings Date Approaching</option>
              </select>
            </div>

            {condition !== "EARNINGS" && (
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Target Price ($)</label>
                <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="w-full bg-panel border border-border/60 rounded px-3 py-1.5 outline-none focus:border-cyan text-[13px] font-mono" />
              </div>
            )}

            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Delivery Method</label>
              <div className="flex gap-2">
                <button onClick={() => setDelivery("SMS")} className={cn("flex-1 py-1.5 rounded border text-[12px] flex items-center justify-center gap-1.5 transition", delivery === "SMS" ? "bg-cyan/10 border-cyan/40 text-cyan" : "bg-panel border-border/40 text-muted-foreground hover:bg-white/[0.02]")}>
                  <Smartphone className="h-3.5 w-3.5" /> SMS
                </button>
                <button onClick={() => setDelivery("WEBHOOK")} className={cn("flex-1 py-1.5 rounded border text-[12px] flex items-center justify-center gap-1.5 transition", delivery === "WEBHOOK" ? "bg-cyan/10 border-cyan/40 text-cyan" : "bg-panel border-border/40 text-muted-foreground hover:bg-white/[0.02]")}>
                  <Webhook className="h-3.5 w-3.5" /> Webhook
                </button>
              </div>
            </div>

            <button onClick={handleAdd} className="w-full bg-cyan text-cyan-foreground font-semibold rounded py-2 mt-4 text-[13px] flex items-center justify-center gap-2 hover:bg-cyan/90 transition glow-cyan">
              <Plus className="h-4 w-4" /> Create Alert Rule
            </button>
          </div>
        </div>

        <div className="md:col-span-8 panel-elevated rounded-lg overflow-hidden flex flex-col">
          <div className="grid grid-cols-[100px_1fr_100px_80px] bg-panel border-b border-border/60 px-5 py-3 text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
            <div>Ticker</div>
            <div>Condition</div>
            <div>Delivery</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-[13px]">No active alerts.</div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="grid grid-cols-[100px_1fr_100px_80px] border-b border-border/30 hover:bg-white/[0.02] px-5 py-4 items-center group">
                  <div className="font-mono font-bold text-[14px]">{alert.symbol}</div>
                  <div className="text-[13px] text-muted-foreground flex items-center gap-2">
                    {alert.condition === "EARNINGS" ? (
                      <span>Earnings Approaching</span>
                    ) : (
                      <>
                        Price {alert.condition.toLowerCase()} <span className="font-mono font-semibold text-foreground">${alert.targetPrice}</span>
                      </>
                    )}
                  </div>
                  <div>
                    {alert.delivery === "SMS" ? (
                      <span className="flex items-center gap-1 text-[11px] text-cyan bg-cyan/10 px-2 py-0.5 rounded-full w-max"><Smartphone className="h-3 w-3" /> SMS</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full w-max"><Webhook className="h-3 w-3" /> Webhook</span>
                    )}
                  </div>
                  <div className="text-right">
                    <button onClick={() => removeAlert(alert.id)} className="text-muted-foreground hover:text-negative transition opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

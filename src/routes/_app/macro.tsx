import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { Globe, CalendarClock, TrendingUp, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatRelativeTime } from "@/utils/format";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/macro")({
  head: () => ({ meta: [{ title: "Macroeconomics · StockPile" }] }),
  component: MacroPage,
});

const yieldCurveData = [
  { maturity: "1M", rate: 5.33, prev: 5.35 },
  { maturity: "3M", rate: 5.38, prev: 5.41 },
  { maturity: "6M", rate: 5.36, prev: 5.40 },
  { maturity: "1Y", rate: 5.12, prev: 5.20 },
  { maturity: "2Y", rate: 4.88, prev: 4.95 },
  { maturity: "3Y", rate: 4.65, prev: 4.70 },
  { maturity: "5Y", rate: 4.42, prev: 4.48 },
  { maturity: "7Y", rate: 4.41, prev: 4.46 },
  { maturity: "10Y", rate: 4.40, prev: 4.44 },
  { maturity: "20Y", rate: 4.62, prev: 4.65 },
  { maturity: "30Y", rate: 4.54, prev: 4.58 },
];

const economicEvents = [
  { id: 1, time: new Date(Date.now() - 3600000).toISOString(), country: "US", event: "Non Farm Payrolls", actual: "275K", forecast: "198K", previous: "229K", impact: "HIGH" },
  { id: 2, time: new Date(Date.now() - 3600000).toISOString(), country: "US", event: "Unemployment Rate", actual: "3.9%", forecast: "3.7%", previous: "3.7%", impact: "HIGH" },
  { id: 3, time: new Date(Date.now() + 86400000).toISOString(), country: "US", event: "CPI m/m", actual: "-", forecast: "0.4%", previous: "0.3%", impact: "HIGH" },
  { id: 4, time: new Date(Date.now() + 86400000).toISOString(), country: "US", event: "Core CPI m/m", actual: "-", forecast: "0.3%", previous: "0.4%", impact: "HIGH" },
  { id: 5, time: new Date(Date.now() + 172800000).toISOString(), country: "US", event: "PPI m/m", actual: "-", forecast: "0.3%", previous: "0.3%", impact: "MEDIUM" },
  { id: 6, time: new Date(Date.now() + 432000000).toISOString(), country: "US", event: "FOMC Economic Projections", actual: "-", forecast: "-", previous: "-", impact: "HIGH" },
  { id: 7, time: new Date(Date.now() + 432000000).toISOString(), country: "US", event: "FOMC Statement", actual: "-", forecast: "-", previous: "-", impact: "HIGH" },
  { id: 8, time: new Date(Date.now() + 432000000).toISOString(), country: "US", event: "Federal Funds Rate", actual: "-", forecast: "5.50%", previous: "5.50%", impact: "HIGH" },
];

function MacroPage() {
  const isYieldCurveInverted = yieldCurveData.find(d => d.maturity === "2Y")!.rate > yieldCurveData.find(d => d.maturity === "10Y")!.rate;

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="Global Economy"
        title="Macroeconomic Data"
        subtitle="Live Treasury yield curves, central bank rates, and economic calendars"
        right={<Pill tone="warn"><Globe className="h-3 w-3" /> MACRO DESK</Pill>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Yield Curve */}
        <div className="col-span-1 xl:col-span-8 panel-elevated p-4 rounded-lg flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan" />
                <h3 className="text-[14px] font-semibold">US Treasury Yield Curve</h3>
             </div>
             {isYieldCurveInverted && (
               <Pill tone="negative"><AlertTriangle className="h-3 w-3" /> INVERTED (2Y &gt; 10Y)</Pill>
             )}
          </div>
          
          <div className="h-[350px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yieldCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} vertical={false} />
                <XAxis dataKey="maturity" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: 'var(--color-foreground)' }}
                  formatter={(value: any) => [`${value}%`, 'Yield']}
                />
                <Line type="monotone" dataKey="rate" stroke="var(--color-cyan)" strokeWidth={3} dot={{ fill: 'var(--color-cyan)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} name="Current" />
                <Line type="monotone" dataKey="prev" stroke="var(--color-muted-foreground)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="1 Month Ago" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Economic Calendar */}
        <div className="col-span-1 xl:col-span-4 panel-elevated p-4 rounded-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-cyan" />
                <h3 className="text-[14px] font-semibold">Economic Calendar</h3>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
             {economicEvents.map((ev, i) => {
               const isPast = new Date(ev.time).getTime() < Date.now();
               return (
                 <motion.div 
                   key={ev.id}
                   initial={{ opacity: 0, y: 5 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className={cn("p-3 rounded border border-border/40", isPast ? "bg-panel/40 opacity-70" : "bg-panel border-cyan/20")}
                 >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[12px] font-semibold flex items-center gap-1.5">
                        <span className="text-[10px] bg-panel-elevated px-1 py-0.5 rounded border border-border/60">{ev.country}</span>
                        {ev.event}
                      </div>
                      <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider", ev.impact === "HIGH" ? "bg-negative/20 text-negative border border-negative/30" : "bg-warn/20 text-warn border border-warn/30")}>
                        {ev.impact}
                      </span>
                    </div>
                    
                    <div className="text-[11px] text-muted-foreground mb-3 font-mono">
                      {formatRelativeTime(new Date(ev.time).getTime())}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-center">
                      <div className="bg-background rounded p-1">
                        <div className="text-muted-foreground mb-0.5 uppercase">Actual</div>
                        <div className={cn("font-semibold", ev.actual !== "-" ? "text-cyan" : "text-foreground")}>{ev.actual}</div>
                      </div>
                      <div className="bg-background rounded p-1">
                        <div className="text-muted-foreground mb-0.5 uppercase">Forecast</div>
                        <div className="text-foreground">{ev.forecast}</div>
                      </div>
                      <div className="bg-background rounded p-1">
                        <div className="text-muted-foreground mb-0.5 uppercase">Previous</div>
                        <div className="text-foreground">{ev.previous}</div>
                      </div>
                    </div>
                 </motion.div>
               )
             })}
          </div>
        </div>
      </div>
    </div>
  );
}

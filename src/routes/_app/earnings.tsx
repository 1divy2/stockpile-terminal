import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { Headphones, Volume2, Sparkles, AlertCircle } from "lucide-react";
import { useSelectedTickerStore } from "@/lib/market/selected-ticker-store";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_app/earnings")({
  head: () => ({ meta: [{ title: "Earnings Call AI · StockPile" }] }),
  component: EarningsPage,
});

const mockTranscript = [
  { speaker: "Operator", text: "Welcome to the Q3 Earnings Call. I will now turn the floor over to the CEO." },
  { speaker: "CEO", text: "Thank you. We delivered record revenue this quarter, driven by strong cloud adoption." },
  { speaker: "CEO", text: "However, we did see some softness in our hardware division due to supply chain constraints." },
  { speaker: "CFO", text: "Operating margins expanded by 200 basis points. We expect this trend to continue into Q4." },
  { speaker: "Analyst", text: "Can you comment on the forward guidance being slightly below consensus?" },
  { speaker: "CEO", text: "We are taking a conservative approach given the macroeconomic uncertainty in Europe." }
];

function EarningsPage() {
  const selectedTicker = useSelectedTickerStore((s) => s.selectedTicker) || "NVDA";
  const [transcript, setTranscript] = useState<{ speaker: string, text: string }[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < mockTranscript.length) {
        setTranscript(prev => [...prev, mockTranscript[index]]);
        index++;
      } else {
        setIsLive(false);
        clearInterval(interval);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedTicker]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="AI Research"
        title="Live Earnings Call Analysis"
        subtitle={`Real-time transcript ingestion and NLP sentiment extraction for ${selectedTicker}`}
        right={<Pill tone={isLive ? "negative" : "cyan"}><Volume2 className="h-3 w-3" /> {isLive ? "LIVE BROADCAST" : "REPLAY"}</Pill>}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[60vh]">
        {/* Transcript Area */}
        <div className="md:col-span-8 panel-elevated rounded-lg flex flex-col overflow-hidden h-full">
          <div className="bg-panel border-b border-border/60 py-3 px-5 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold flex items-center gap-2">
              <Headphones className="h-4 w-4 text-cyan" /> 
              Raw Transcript Feed
            </h3>
            {isLive && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-negative opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-negative"></span></span>}
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background/30">
             <AnimatePresence>
               {transcript.map((line, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="flex gap-4"
                 >
                   <div className="w-[80px] shrink-0 text-right text-[12px] font-semibold text-muted-foreground pt-1">
                     {line.speaker}
                   </div>
                   <div className="flex-1 bg-panel/50 border border-border/40 rounded-lg p-3 text-[13px] leading-relaxed">
                     {line.text}
                   </div>
                 </motion.div>
               ))}
             </AnimatePresence>
             
             {isLive && (
               <div className="flex gap-4 opacity-50">
                  <div className="w-[80px]" />
                  <div className="flex gap-1 items-center p-3">
                    <span className="w-1.5 h-1.5 bg-cyan rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-cyan rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-cyan rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
               </div>
             )}
          </div>
        </div>

        {/* AI Analysis Area */}
        <div className="md:col-span-4 panel-elevated rounded-lg flex flex-col p-5 h-full">
          <div className="flex items-center gap-2 mb-4 text-cyan">
             <Sparkles className="h-4 w-4" />
             <h3 className="text-[13px] font-semibold tracking-wider uppercase font-mono">Gemini NLP Engine</h3>
          </div>
          
          <div className="space-y-4">
             <div className="bg-panel border border-border/40 rounded-lg p-4">
               <div className="text-[10px] uppercase text-muted-foreground mb-2 font-mono tracking-wider">Overall Tone</div>
               <div className="text-[24px] font-bold text-positive">Cautiously Optimistic</div>
             </div>
             
             <div className="bg-panel border border-border/40 rounded-lg p-4">
               <div className="text-[10px] uppercase text-muted-foreground mb-2 font-mono tracking-wider">Key Extracted Topics</div>
               <div className="flex flex-wrap gap-2">
                 <Pill tone="positive">Record Revenue</Pill>
                 <Pill tone="positive">Margin Expansion</Pill>
                 <Pill tone="negative">Supply Chain</Pill>
                 <Pill tone="negative">Macro Uncertainty</Pill>
               </div>
             </div>
             
             <div className="bg-panel border border-border/40 rounded-lg p-4 border-warn/30">
               <div className="flex items-center gap-1.5 text-[10px] uppercase text-warn mb-2 font-mono tracking-wider">
                 <AlertCircle className="h-3 w-3" /> Risk Flag
               </div>
               <p className="text-[12px] text-foreground/80 leading-relaxed">
                 CEO explicitly mentioned "macroeconomic uncertainty in Europe" causing downward pressure on forward guidance.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

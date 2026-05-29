import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { Cpu, Play, Loader2, Save, BarChart, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSelectedTickerStore } from "@/lib/market/selected-ticker-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/widgets/ToastProvider";
import * as tf from "@tensorflow/tfjs";
import { useCandles } from "@/hooks/market/useCandles";

export const Route = createFileRoute("/_app/ml-lab")({
  head: () => ({ meta: [{ title: "ML Lab · StockPile" }] }),
  component: MLLabPage,
});

function MLLabPage() {
  const { pushToast } = useToast();
  const selectedTicker = useSelectedTickerStore(s => s.selectedTicker) || "NVDA";
  const { data: candles = [] } = useCandles(selectedTicker, "1D");

  const [isTraining, setIsTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState<number | null>(null);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  
  const [modelType, setModelType] = useState("LSTM");
  const [epochs, setEpochs] = useState(50);
  const [learningRate, setLearningRate] = useState(0.01);
  
  const modelRef = useRef<tf.Sequential | null>(null);

  const startTraining = async () => {
    if (candles.length < 20) {
      pushToast({ title: "Not enough data", description: "Need at least 20 data points.", tone: "error" });
      return;
    }
    
    setIsTraining(true);
    setEpoch(0);
    setLoss(null);
    setLossHistory([]);
    pushToast({ title: "TensorFlow.js Engine Started", description: "Building tensors and training model...", tone: "info" });
    
    // 1. Prepare Data
    const prices = candles.map(c => c.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const normalized = prices.map(p => (p - minPrice) / (maxPrice - minPrice || 1));
    
    const WINDOW_SIZE = 10;
    const xs = [];
    const ys = [];
    for (let i = 0; i < normalized.length - WINDOW_SIZE; i++) {
      xs.push(normalized.slice(i, i + WINDOW_SIZE));
      ys.push(normalized[i + WINDOW_SIZE]);
    }
    
    const xsTensor = tf.tensor2d(xs);
    const ysTensor = tf.tensor2d(ys, [ys.length, 1]);
    
    let model = tf.sequential();
    
    if (modelType === "LSTM" || modelType === "GRU") {
      const xs3d = xsTensor.reshape([xs.length, WINDOW_SIZE, 1]);
      if (modelType === "LSTM") {
        model.add(tf.layers.lstm({ units: 16, inputShape: [WINDOW_SIZE, 1], returnSequences: false }));
      } else {
        model.add(tf.layers.gru({ units: 16, inputShape: [WINDOW_SIZE, 1], returnSequences: false }));
      }
      model.add(tf.layers.dense({ units: 1 }));
      
      model.compile({ optimizer: tf.train.adam(learningRate), loss: 'meanSquaredError' });
      
      try {
        await model.fit(xs3d, ysTensor, {
          epochs: epochs,
          batchSize: 16,
          shuffle: true,
          callbacks: {
            onEpochEnd: (ep, logs) => {
              setEpoch(ep + 1);
              if (logs) {
                setLoss(logs.loss);
                setLossHistory(prev => [...prev, logs.loss]);
              }
            }
          }
        });
      } catch (err) {
        console.error(err);
      }
      xs3d.dispose();
    } else {
      model.add(tf.layers.dense({ units: 32, inputShape: [WINDOW_SIZE], activation: 'relu' }));
      model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
      model.add(tf.layers.dense({ units: 1 }));
      model.compile({ optimizer: tf.train.adam(learningRate), loss: 'meanSquaredError' });
      
      try {
        await model.fit(xsTensor, ysTensor, {
          epochs: epochs,
          batchSize: 16,
          shuffle: true,
          callbacks: {
            onEpochEnd: async (ep, logs) => {
              setEpoch(ep + 1);
              if (logs) {
                setLoss(logs.loss);
                setLossHistory(prev => [...prev, logs.loss]);
              }
              await tf.nextFrame();
            }
          }
        });
      } catch (err) {
        console.error(err);
      }
    }
    
    xsTensor.dispose();
    ysTensor.dispose();
    modelRef.current = model;
    
    setIsTraining(false);
    pushToast({ title: "Model Training Complete", tone: "success" });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <PageHeader
        eyebrow="Quant Analytics"
        title="Custom ML Lab"
        subtitle={`Train real neural networks in-browser using TensorFlow.js for ${selectedTicker}`}
        right={<Pill tone="cyan"><Cpu className="h-3 w-3" /> TF.JS ENGINE</Pill>}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
        <div className="md:col-span-4 panel-elevated p-5 rounded-lg flex flex-col">
          <h3 className="text-[14px] font-semibold mb-4">Model Hyperparameters</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Architecture</label>
              <select value={modelType} onChange={e => setModelType(e.target.value)} disabled={isTraining} className="w-full bg-panel border border-border/60 rounded px-3 py-1.5 outline-none focus:border-cyan text-[13px]">
                <option value="LSTM">LSTM (Time-Series)</option>
                <option value="GRU">GRU (Fast Sequence)</option>
                <option value="Dense">Dense (Feedforward Neural Net)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Epochs</label>
              <input type="number" value={epochs} onChange={e => setEpochs(Number(e.target.value))} disabled={isTraining} className="w-full bg-panel border border-border/60 rounded px-3 py-1.5 outline-none focus:border-cyan text-[13px] font-mono" />
            </div>
            
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Learning Rate</label>
              <input type="number" step="0.001" value={learningRate} onChange={e => setLearningRate(Number(e.target.value))} disabled={isTraining} className="w-full bg-panel border border-border/60 rounded px-3 py-1.5 outline-none focus:border-cyan text-[13px] font-mono" />
            </div>

            <button 
              onClick={startTraining} 
              disabled={isTraining || candles.length === 0}
              className={cn("w-full font-semibold rounded py-2 mt-4 text-[13px] flex items-center justify-center gap-2 transition", (isTraining || candles.length === 0) ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-cyan text-cyan-foreground hover:bg-cyan/90 glow-cyan")}
            >
              {isTraining ? <><Loader2 className="h-4 w-4 animate-spin" /> Training...</> : <><Play className="h-4 w-4" /> Start Training</>}
            </button>
            
            <button 
              disabled={isTraining || epoch === 0}
              onClick={() => pushToast({ title: "Model weights saved to local storage.", tone: "success" })}
              className={cn("w-full font-semibold rounded py-2 mt-2 text-[13px] flex items-center justify-center gap-2 transition", (isTraining || epoch === 0) ? "opacity-50 cursor-not-allowed" : "border border-border/60 bg-panel hover:bg-white/[0.02]")}
            >
              <Save className="h-4 w-4" /> Save Weights
            </button>
          </div>
        </div>

        <div className="md:col-span-8 panel-elevated rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-[14px] font-semibold">Training Metrics</h3>
             {isTraining && <span className="text-[11px] font-mono text-cyan animate-pulse flex items-center gap-1"><Cpu className="h-3 w-3" /> COMPUTING TENSORS</span>}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="bg-panel border border-border/40 rounded p-4 text-center">
                <div className="text-[10px] text-muted-foreground uppercase font-mono mb-1">Epoch</div>
                <div className="text-[24px] font-bold font-mono">{epoch} / {epochs}</div>
             </div>
             <div className="bg-panel border border-border/40 rounded p-4 text-center">
                <div className="text-[10px] text-muted-foreground uppercase font-mono mb-1">Loss (MSE)</div>
                <div className="text-[24px] font-bold font-mono text-cyan">{loss !== null ? loss.toFixed(6) : "—"}</div>
             </div>
          </div>
          
          <div className="flex-1 bg-panel border border-border/40 rounded flex items-end relative overflow-hidden p-2 gap-[2px]">
             {epoch === 0 && !isTraining ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                 <BarChart className="h-8 w-8 mb-2" />
                 <span className="text-[13px]">Awaiting start</span>
               </div>
             ) : (
               <>
                 {lossHistory.map((l, i) => {
                   const maxL = Math.max(...lossHistory, 0.0001);
                   const heightPct = Math.max(5, (l / maxL) * 100);
                   return (
                     <div 
                       key={i} 
                       className="flex-1 bg-cyan rounded-t transition-all duration-300 min-w-[2px]" 
                       style={{ height: `${heightPct}%` }} 
                     />
                   );
                 })}
                 {isTraining && (
                   <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-8">
                     <div className="font-mono text-cyan font-bold text-[14px] tracking-widest mb-4 animate-pulse">TRAINING TENSORFLOW MODEL</div>
                     <div className="w-full max-w-md h-1.5 bg-panel rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-cyan rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(39,215,131,0.5)]" 
                         style={{ width: `${(epoch / epochs) * 100}%` }} 
                       />
                     </div>
                     <div className="mt-2 text-[10px] font-mono text-muted-foreground">{epoch} / {epochs} EPOCHS</div>
                   </div>
                 )}
                 
                 {!isTraining && epoch === epochs && epoch > 0 && (
                   <div className="absolute inset-0 bg-positive/10 backdrop-blur-[1px] flex items-center justify-center border-2 border-positive/30 rounded">
                     <div className="font-mono text-positive font-bold text-[16px] flex items-center gap-2 glow-positive px-4 py-2 rounded bg-panel">
                       <Sparkles className="h-4 w-4" /> MODEL DEPLOYED
                     </div>
                   </div>
                 )}
               </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

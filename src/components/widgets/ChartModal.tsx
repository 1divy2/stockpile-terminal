import { X } from "lucide-react";

import { CandlestickChart } from "@/components/widgets/Charts";

type CandlePoint = {
  timestamp: number;

  open?: number;

  high?: number;

  low?: number;

  close?: number;

  volume?: number;

  price: number;
};

type Props = {
  open: boolean;

  onClose: () => void;

  symbol: string;

  data: CandlePoint[];

  timeframe: string;

  onTimeframeChange: (value: string) => void;
};

const ranges = ["1D", "5D", "1M", "6M", "YTD", "1Y", "ALL"];

export function ChartModal({ open, onClose, symbol, data, timeframe, onTimeframeChange }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="relative flex h-[88vh] w-[92vw] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#050816] shadow-[0_0_80px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between border-b border-white/6 px-6 py-5">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-[0.35em] text-cyan-400">
              Advanced Market View
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-semibold text-white">{symbol}</h2>

              <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-cyan-300">
                Candlestick
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-all hover:border-white/20 hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
          <div className="flex items-center gap-2">
            {ranges.map((range) => (
              <button
                key={range}
                onClick={() => onTimeframeChange(range)}
                className={`rounded-xl border px-4 py-2 text-sm transition-all ${
                  timeframe === range
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                    : "border-white/8 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-300">
              Live Market Structure
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <CandlestickChart data={data} height={640} />
        </div>
      </div>
    </div>
  );
}

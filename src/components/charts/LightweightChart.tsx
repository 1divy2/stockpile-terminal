import { useEffect, useRef, memo, useState } from "react";
import { createChart, type IChartApi, type ISeriesApi, ColorType, LineStyle, type CandlestickData, type Time } from "lightweight-charts";
import { CandlePoint } from "@/lib/market/market-types";

type LightweightChartProps = {
  candles: CandlePoint[];
  height?: number;
  showVolume?: boolean;
};

function prepareChartData(candles: CandlePoint[]) {


  const formattedCandles: CandlestickData<Time>[] = [];
  const formattedVolume: any[] = [];
  const seenTimes = new Set<number | string>();
  let lastTimeNum = 0;

  const sortedCandles = [...candles].sort((a, b) => a.timestamp - b.timestamp);

  for (const c of sortedCandles) {
    let timeVal: Time;
    let numVal = Math.floor(c.timestamp);
    
    if (numVal > 10000000000) {
      numVal = Math.floor(numVal / 1000);
    }

    if (numVal <= lastTimeNum) {
      numVal = lastTimeNum + 60;
    }
    timeVal = numVal as Time;
    lastTimeNum = numVal;

    seenTimes.add(timeVal as string | number);

    formattedCandles.push({
      time: timeVal,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    });

    formattedVolume.push({
      time: timeVal,
      value: c.volume || 0,
      color: c.close >= c.open ? "rgba(38,166,91,0.25)" : "rgba(214,69,65,0.25)",
    });
  }

  return { formattedCandles, formattedVolume };
}

function LightweightChartInner({ candles, height = 400, showVolume = true }: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.5)",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.02)", style: LineStyle.SparseDotted },
        horzLines: { color: "rgba(255,255,255,0.02)", style: LineStyle.SparseDotted },
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          color: "rgba(39, 215, 131, 0.4)", // Cyan/Positive tint
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1a1e24",
        },
        horzLine: {
          color: "rgba(39, 215, 131, 0.4)",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#1a1e24",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.05)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.05)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      kineticScroll: {
        mouse: true,
        touch: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#27D783",
      downColor: "#EE3838",
      borderVisible: false,
      wickUpColor: "#27D783",
      wickDownColor: "#EE3838",
    });

    candleSeriesRef.current = candleSeries;
    chartRef.current = chart;

    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      volumeSeriesRef.current = volumeSeries;
    }

    // Resize observer
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [height, showVolume]);

  // Update data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    try {
      const { formattedCandles, formattedVolume } = prepareChartData(candles);
      candleSeriesRef.current.setData(formattedCandles);

      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(formattedVolume);
      }

      chartRef.current?.timeScale().fitContent();
      setErrorMsg(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || String(err));
    }
  }, [candles]);

  return (
    <div className="relative w-full h-full">
      {errorMsg && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-500/20 text-red-500 font-mono text-xs p-4 overflow-auto">
          CHART ERROR: {errorMsg}
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full rounded-md overflow-hidden border border-border/40"
      />
    </div>
  );
}

export const LightweightChart = memo(LightweightChartInner);

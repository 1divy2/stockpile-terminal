import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/widgets/Primitives";
import { Pill } from "@/components/widgets/AIInsightCard";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useMarketStore } from "@/lib/market/market-state";
import { useMarketTickers } from "@/hooks/market/useMarketTickers";
import { formatPrice, formatPercent, getChangeColor } from "@/utils/format";

export const Route = createFileRoute("/_app/knowledge-graph")({
  head: () => ({ meta: [{ title: "Asset Relations · StockPile" }] }),
  component: KG,
});

function KG() {
  useMarketTickers();
  const tickers = useMarketStore((s) => s.tickers);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Build nodes from real tickers in a circular layout
  const { nodeList, edges } = useMemo(() => {
    const items = tickers.slice(0, 12);
    if (items.length === 0) return { nodeList: [], edges: [] };

    const nodeList = items.map((t, i) => {
      const angle = (2 * Math.PI * i) / items.length;
      const cx = 50 + 35 * Math.cos(angle);
      const cy = 50 + 35 * Math.sin(angle);
      return {
        id: t.symbol,
        sector: t.sector || "Other",
        x: cx,
        y: cy,
        r: 18,
        price: t.price,
        changePct: t.changePct,
        name: t.name || t.symbol,
      };
    });

    // Draw edges between tickers in the same sector
    const edgeList: { from: string; to: string; w: number }[] = [];
    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        if (nodeList[i].sector === nodeList[j].sector && nodeList[i].sector !== "Other") {
          edgeList.push({
            from: nodeList[i].id,
            to: nodeList[j].id,
            w: 0.6,
          });
        }
      }
    }
    return { nodeList, edges: edgeList };
  }, [tickers]);

  const sectorColor = (sector: string) => {
    const map: Record<string, string> = {
      Technology: "var(--color-cyan)",
      "Consumer Cyclical": "var(--color-positive)",
      Crypto: "var(--color-warn)",
      Commodities: "var(--color-warn)",
      "Fixed Income": "var(--color-muted-foreground)",
    };
    return map[sector] || "var(--color-cyan)";
  };

  const selectedTicker = nodeList.find((n) => n.id === selectedNode);
  const connections = edges.filter((e) => e.from === selectedNode || e.to === selectedNode);

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Asset Relations"
        subtitle="Sector and correlation-based asset relationships"
        right={
          <>
            <Pill tone="cyan">{nodeList.length} nodes</Pill>
            <Pill tone="positive">{edges.length} edges</Pill>
          </>
        }
      />
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 xl:col-span-9 panel-elevated p-4 grid-bg">
          <div className="relative aspect-[16/10] w-full">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
            >
              <defs>
                <linearGradient id="edge" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--color-positive)" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              {edges.map((l, i) => {
                const a = nodeList.find((n) => n.id === l.from)!;
                const b = nodeList.find((n) => n.id === l.to)!;
                const isHighlighted =
                  selectedNode && (l.from === selectedNode || l.to === selectedNode);
                return (
                  <line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={isHighlighted ? "var(--color-cyan)" : "url(#edge)"}
                    strokeWidth={isHighlighted ? 0.5 : 0.25}
                    strokeOpacity={isHighlighted ? 0.8 : 0.4}
                  />
                );
              })}
            </svg>
            {nodeList.map((n) => {
              const color = sectorColor(n.sector);
              const isSelected = selectedNode === n.id;
              return (
                <motion.div
                  key={n.id}
                  drag
                  dragMomentum={false}
                  whileDrag={{ scale: 1.2, zIndex: 50 }}
                  onClick={() => setSelectedNode(isSelected ? null : n.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full grid place-items-center text-[10px] font-mono backdrop-blur-sm cursor-grab active:cursor-grabbing hover:scale-110 transition-colors"
                  style={{
                    left: `${n.x}%`,
                    top: `${n.y}%`,
                    width: n.r * 2,
                    height: n.r * 2,
                    background: `radial-gradient(circle, color-mix(in oklab, ${color} ${isSelected ? "50" : "30"}%, transparent), transparent 70%)`,
                    border: `1px solid ${color}`,
                    color,
                    boxShadow: isSelected
                      ? `0 0 32px color-mix(in oklab, ${color} 50%, transparent)`
                      : `0 0 24px color-mix(in oklab, ${color} 20%, transparent)`,
                  }}
                >
                  {n.id}
                </motion.div>
              );
            })}
          </div>
        </div>
        <div className="col-span-12 xl:col-span-3 panel-elevated p-4">
          <h3 className="text-[13px] font-semibold mb-3">
            {selectedTicker ? `Selected: ${selectedTicker.id}` : "Select a node"}
          </h3>
          {selectedTicker ? (
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-mono text-right max-w-[140px] truncate">
                  {selectedTicker.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sector</span>
                <span className="font-mono">{selectedTicker.sector}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-mono">${formatPrice(selectedTicker.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Change</span>
                <span className={`font-mono ${getChangeColor(selectedTicker.changePct)}`}>
                  {formatPercent(selectedTicker.changePct)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connections</span>
                <span className="font-mono text-cyan">{connections.length}</span>
              </div>
              {connections.length > 0 && (
                <div className="mt-3 border-t border-border/60 pt-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    Connected via sector
                  </div>
                  {connections.map((e, i) => {
                    const peer = e.from === selectedNode ? e.to : e.from;
                    return (
                      <div key={i} className="text-[11px] text-muted-foreground">
                        → {peer} ({selectedTicker.sector})
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-[12px] text-muted-foreground">
              Click a node in the graph to view ticker details and sector connections.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

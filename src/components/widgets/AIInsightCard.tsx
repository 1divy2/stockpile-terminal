import { Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export function AIInsightCard({
  title,
  body,
  confidence,
  tags = [],
  onClick,
}: {
  title: string;
  body: ReactNode;
  confidence: number;
  tags?: string[];
  onClick?: () => void;
}) {
  return (
    <div
      className="panel-elevated p-4 group hover:border-cyan/40 transition cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-cyan to-primary grid place-items-center shrink-0">
          <Sparkles className="h-4 w-4 text-background" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[13px] font-semibold tracking-tight">{title}</h4>
            <span className="text-[10px] font-mono text-cyan">CONF · {confidence}%</span>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{body}</p>
          {tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-panel border border-border/60 text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-cyan transition" />
      </div>
    </div>
  );
}

export function ConfidenceBar({
  value,
  color = "var(--color-cyan)",
  label,
}: {
  value: number;
  color?: string;
  label?: string;
}) {
  return (
    <div>
      {label && (
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-panel overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 60%, white))`,
          }}
        />
      </div>
    </div>
  );
}

export function Pill({
  tone = "default",
  children,
  className,
}: {
  tone?: "default" | "positive" | "negative" | "cyan" | "warn";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    default: "bg-panel text-muted-foreground border-border",
    positive: "bg-positive/10 text-positive border-positive/30",
    negative: "bg-negative/10 text-negative border-negative/30",
    cyan: "bg-cyan/10 text-cyan border-cyan/30",
    warn: "bg-warn/10 text-warn border-warn/30",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border",
        tones,
        className,
      )}
    >
      {children}
    </span>
  );
}

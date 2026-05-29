import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  right,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4 mb-4", className)}>
      <div>
        {eyebrow && (
          <div className="text-[10px] tracking-[0.18em] uppercase text-cyan font-mono mb-1">
            {eyebrow}
          </div>
        )}
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function PageHeader({ ...p }: React.ComponentProps<typeof SectionHeader>) {
  return <SectionHeader {...p} className={cn("mb-6", p.className)} />;
}

export function MetricCard({
  label,
  value,
  delta,
  hint,
  accent = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  hint?: string;
  accent?: "default" | "positive" | "negative" | "cyan" | "warn";
  icon?: ReactNode;
}) {
  const accentClass = {
    default: "",
    positive: "before:bg-positive",
    negative: "before:bg-negative",
    cyan: "before:bg-cyan",
    warn: "before:bg-warn",
  }[accent];
  return (
    <div
      className={cn(
        "panel-elevated hover-lift relative overflow-hidden p-4 before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[2px] before:rounded-r",
        accentClass,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-[11px] font-mono">
        {typeof delta === "number" && (
          <span className={cn("tabular-nums", delta >= 0 ? "text-positive" : "text-negative")}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

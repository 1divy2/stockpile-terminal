import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/utils/format";

interface DataFreshnessProps {
  lastUpdated: number | null;
  className?: string;
}

export function DataFreshness({ lastUpdated, className = "" }: DataFreshnessProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!lastUpdated) {
    return (
      <div className={`flex items-center gap-1.5 font-mono text-[10px] text-negative ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-negative animate-pulse" />
        DATA OFFLINE
      </div>
    );
  }

  const age = Date.now() - lastUpdated;
  const isStale = age >= 900_000; // 15 min
  const isCached = age >= 300_000 && age < 900_000; // 5 min

  let pulseColor = "bg-positive";
  let textColor = "text-positive";
  let statusText = "LIVE";

  if (isStale) {
    pulseColor = "bg-negative";
    textColor = "text-negative";
    statusText = "STALE";
  } else if (isCached) {
    pulseColor = "bg-warn";
    textColor = "text-warn";
    statusText = "CACHED";
  }

  return (
    <div className={`flex items-center gap-2 font-mono text-[11px] ${textColor} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${pulseColor} animate-pulse`} />
      <span>{statusText}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">{formatRelativeTime(lastUpdated)}</span>
    </div>
  );
}

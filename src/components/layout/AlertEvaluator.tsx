import { useEffect } from "react";
import { useMarketStore } from "@/lib/market/market-state";
import { alertEngine } from "@/lib/alerts/alert-engine";
import { useToast } from "@/components/widgets/ToastProvider";

export function AlertEvaluator() {
  const { pushToast } = useToast();
  const lastUpdated = useMarketStore((s) => s.lastUpdated);

  useEffect(() => {
    alertEngine.setDispatcher(pushToast);
  }, [pushToast]);

  useEffect(() => {
    alertEngine.evaluate();
  }, [lastUpdated]);

  return null;
}

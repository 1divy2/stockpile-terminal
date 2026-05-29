import { useAlertsStore } from "@/store/alerts-store";
import { useMarketStore } from "@/lib/market/market-state";

type ToastDispatcher = (toast: { title: string; tone: "success" | "error" | "info" }) => void;

export class AlertEngine {
  private dispatchToast: ToastDispatcher | null = null;
  private isEvaluating = false;

  public setDispatcher(dispatcher: ToastDispatcher) {
    this.dispatchToast = dispatcher;
  }

  public async evaluate() {
    if (this.isEvaluating) return;
    this.isEvaluating = true;

    try {
      const { alerts, markTriggered } = useAlertsStore.getState();
      const { engine } = useMarketStore.getState();

      const activeAlerts = alerts.filter(a => a.isActive);

      for (const alert of activeAlerts) {
        const ticker = engine.getTicker(alert.symbol);
        if (!ticker) continue;

        let triggered = false;
        let message = "";

        if (alert.condition === "Price Above" && ticker.price >= alert.target) {
          triggered = true;
          message = `${alert.symbol} crossed above $${alert.target.toFixed(2)}`;
        } else if (alert.condition === "Price Below" && ticker.price <= alert.target) {
          triggered = true;
          message = `${alert.symbol} dropped below $${alert.target.toFixed(2)}`;
        } else if (alert.condition === "Volume Spike") {
          // Simplistic volume spike mock check if we don't have historical averages loaded
          // In a real scenario, this would query marketAnalyticsEngine.getVolumeSpikes
          // But for this UI, we can check if current volume > target
          if (ticker.volume && ticker.volume >= alert.target) {
            triggered = true;
            message = `${alert.symbol} volume spiked above ${alert.target.toLocaleString()}`;
          }
        }

        if (triggered) {
          markTriggered(alert.id);
          if (this.dispatchToast) {
            this.dispatchToast({
              title: `Alert Triggered: ${message}`,
              tone: alert.condition === "Price Below" ? "error" : "success"
            });
          }
        }
      }
    } finally {
      this.isEvaluating = false;
    }
  }
}

export const alertEngine = new AlertEngine();

/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: string;

  title: string;

  description?: string;

  tone: ToastTone;
};

type ToastContextType = {
  pushToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();

      const next = {
        ...toast,
        id,
      };

      setToasts((prev) => [next, ...prev]);

      setTimeout(() => {
        removeToast(id);
      }, 3000);
    },
    [removeToast],
  );

  const value = useMemo(
    () => ({
      pushToast,
    }),
    [pushToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[340px] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg border backdrop-blur-md p-3 shadow-2xl transition-all ${
              toast.tone === "success"
                ? "border-positive/30 bg-positive/10"
                : toast.tone === "error"
                  ? "border-negative/30 bg-negative/10"
                  : "border-cyan/30 bg-cyan/10"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[12px] font-semibold">{toast.title}</div>

                {toast.description && (
                  <div className="mt-1 text-[11px] text-muted-foreground">{toast.description}</div>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}

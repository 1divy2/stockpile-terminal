import type { ReactNode } from "react";

import { motion } from "framer-motion";

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CandlestickChart,
  LineChart,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

const capabilities = [
  {
    label: "Real-Time Market Data",
    value: "27 Instruments",
    icon: TrendingUp,
    tone: "text-positive",
  },
  {
    label: "Portfolio Analytics",
    value: "Live Tracking",
    icon: BarChart3,
    tone: "text-cyan",
  },
  {
    label: "Paper Trading",
    value: "Simulator",
    icon: CandlestickChart,
    tone: "text-warn",
  },
  {
    label: "Technical Analysis",
    value: "Multi-Asset",
    icon: LineChart,
    tone: "text-cyan",
  },
];

const features = [
  "Live equity, crypto, and ETF price feeds",
  "Portfolio tracking with P&L analytics",
  "Paper trading with order management",
  "Cross-asset sector analysis and screening",
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-[0.03]" />

        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-cyan/10 blur-3xl" />

        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-positive/10 blur-3xl" />

        <div className="scanlines absolute inset-0 opacity-[0.03]" />
      </div>

      {/* Left Panel */}
      <div className="relative hidden lg:flex lg:w-[58%] xl:w-[62%] border-r border-border/60">
        <div className="flex w-full flex-col justify-between p-10 xl:p-14">
          {/* Header */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="flex items-center gap-3"
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan glow-positive">
                <TrendingUp className="h-5 w-5 text-background" strokeWidth={2.4} />
              </div>

              <div>
                <div className="text-lg font-semibold tracking-tight">StockPile</div>

                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Financial Intelligence Platform
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="mt-16 max-w-2xl"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan">
                Portfolio Analytics & Market Intelligence
              </div>

              <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight xl:text-6xl">
                Real-time market data, portfolio analytics, and trading intelligence.
              </h1>

              <p className="mt-6 max-w-xl text-[15px] leading-7 text-muted-foreground">
                Track equities, crypto, and ETFs with live price feeds. Manage paper trading
                portfolios with P&L tracking, sector analysis, and cross-asset screening tools.
              </p>
            </motion.div>
          </div>

          {/* Bottom Capabilities */}
          <div className="space-y-5">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              {capabilities.map((cap, index) => {
                const Icon = cap.icon;

                return (
                  <motion.div
                    key={cap.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.08 * index,
                    }}
                    className="panel-elevated p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[11px] text-muted-foreground">{cap.label}</div>

                        <div className="mt-2 text-xl font-semibold tracking-tight">{cap.value}</div>
                      </div>

                      <div
                        className={`rounded-lg border border-border/60 bg-panel p-2 ${cap.tone}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Feature List */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="panel-elevated overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan" />

                  <div className="text-[13px] font-semibold">Platform Features</div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                  v1.0
                </div>
              </div>

              <div className="divide-y divide-border/40">
                {features.map((item) => (
                  <div key={item} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-cyan" />

                      <span className="text-[13px]">{item}</span>
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-10 lg:px-10">
        <div className="absolute right-10 top-8 hidden items-center gap-2 rounded-full border border-border/60 bg-panel/80 px-3 py-1.5 backdrop-blur xl:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-positive" />

          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Demo Mode
          </span>
        </div>

        <div className="absolute bottom-8 right-8 hidden items-center gap-2 rounded-full border border-border/60 bg-panel/80 px-3 py-1.5 backdrop-blur xl:flex">
          <CandlestickChart className="h-3.5 w-3.5 text-cyan" />

          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Paper Trading Enabled
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

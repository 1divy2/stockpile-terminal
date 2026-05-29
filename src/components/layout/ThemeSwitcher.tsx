import { Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/widgets/ToastProvider";

const themes = {
  default: `
    :root {
      --color-background: #09090b;
      --color-foreground: #fafafa;
      --color-panel: #141417;
      --color-panel-elevated: #1c1c20;
      --color-border: rgba(255, 255, 255, 0.1);
      --color-muted: #27272a;
      --color-muted-foreground: #a1a1aa;
      --color-cyan: #22d3ee;
      --color-cyan-foreground: #082f49;
      --color-positive: #22c55e;
      --color-positive-foreground: #052e16;
      --color-negative: #ef4444;
      --color-negative-foreground: #450a0a;
      --color-warn: #eab308;
      --color-warn-foreground: #422006;
      --color-chart-1: #22d3ee;
      --color-chart-2: #22c55e;
      --color-chart-3: #818cf8;
      --color-chart-4: #c084fc;
      --color-chart-5: #f472b6;
    }
  `,
  bloomberg: `
    :root {
      --color-background: #000000;
      --color-foreground: #ffaa00;
      --color-panel: #0a0a0a;
      --color-panel-elevated: #111111;
      --color-border: #ffaa0044;
      --color-muted: #332200;
      --color-muted-foreground: #cc8800;
      --color-cyan: #ffaa00;
      --color-cyan-foreground: #000000;
      --color-positive: #00ff00;
      --color-positive-foreground: #000000;
      --color-negative: #ff0000;
      --color-negative-foreground: #000000;
      --color-warn: #ff00ff;
      --color-warn-foreground: #000000;
      --color-chart-1: #ffaa00;
      --color-chart-2: #00ff00;
      --color-chart-3: #ff00ff;
      --color-chart-4: #00ffff;
      --color-chart-5: #ffffff;
    }
  `,
  institutional: `
    :root {
      --color-background: #f8fafc;
      --color-foreground: #0f172a;
      --color-panel: #ffffff;
      --color-panel-elevated: #ffffff;
      --color-border: #e2e8f0;
      --color-muted: #f1f5f9;
      --color-muted-foreground: #64748b;
      --color-cyan: #0284c7;
      --color-cyan-foreground: #ffffff;
      --color-positive: #16a34a;
      --color-positive-foreground: #ffffff;
      --color-negative: #dc2626;
      --color-negative-foreground: #ffffff;
      --color-warn: #ca8a04;
      --color-warn-foreground: #ffffff;
      --color-chart-1: #0284c7;
      --color-chart-2: #16a34a;
      --color-chart-3: #4f46e5;
      --color-chart-4: #9333ea;
      --color-chart-5: #e11d48;
    }
  `
};

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<keyof typeof themes>("default");
  const { pushToast } = useToast();

  useEffect(() => {
    const el = document.getElementById("stockpile-theme");
    if (el) {
      el.innerHTML = themes[theme];
    } else {
      const style = document.createElement("style");
      style.id = "stockpile-theme";
      style.innerHTML = themes[theme];
      document.head.appendChild(style);
    }
  }, [theme]);

  const toggleTheme = () => {
    const order: (keyof typeof themes)[] = ["default", "bloomberg", "institutional"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    pushToast({ title: `Theme switched to: ${next.toUpperCase()}`, tone: "info" });
  };

  return (
    <button 
      onClick={toggleTheme}
      className="grid h-9 w-9 place-items-center rounded-md border border-border/60 bg-panel/40 transition hover:bg-panel text-muted-foreground hover:text-cyan"
      title="Toggle Theme"
    >
      <Palette className="h-4 w-4" />
    </button>
  );
}

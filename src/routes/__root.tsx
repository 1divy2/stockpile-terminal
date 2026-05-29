import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { ToastProvider } from "@/components/widgets/ToastProvider";
import { useEffect } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { AlertEvaluator } from "@/components/layout/AlertEvaluator";
import { useAuthStore } from "@/store/auth-store";
import { useAlertsStore } from "@/store/alerts-store";
import { usePaperTradingStore } from "@/lib/paper-trading/paper-trading-store";
import { CommandPalette } from "@/components/layout/CommandPalette";

function NotFoundComponent() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-cyan">
          SIGNAL · LOST
        </div>

        <h1 className="mt-3 text-5xl font-semibold tracking-tight">404</h1>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This route is outside the StockPile coverage area.
        </p>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);

  const router = useRouter();

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="panel-elevated max-w-lg p-6">
        <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-negative">
          RUNTIME · FAULT
        </div>

        <h1 className="mt-3 text-lg font-semibold">A module crashed</h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error.message}</p>

        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },

      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },

      {
        title: "StockPile — AI Market Intelligence OS",
      },

      {
        name: "description",
        content:
          "Institutional-grade AI market intelligence, prediction, and autonomous research platform.",
      },

      {
        name: "theme-color",
        content: "#0e1116",
      },

      {
        property: "og:title",
        content: "StockPile — AI Market Intelligence OS",
      },

      {
        property: "og:description",
        content:
          "Institutional-grade AI market intelligence, prediction, and autonomous research platform.",
      },

      {
        property: "og:type",
        content: "website",
      },

      {
        name: "twitter:title",
        content: "StockPile — AI Market Intelligence OS",
      },

      {
        name: "twitter:description",
        content:
          "Institutional-grade AI market intelligence, prediction, and autonomous research platform.",
      },

      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d580c036-2ba2-47ba-af35-4864cca0368b/id-preview-ab311667--87ff6ba3-b337-40e1-9820-70100b731d14.lovable.app-1779780835139.png",
      },

      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d580c036-2ba2-47ba-af35-4864cca0368b/id-preview-ab311667--87ff6ba3-b337-40e1-9820-70100b731d14.lovable.app-1779780835139.png",
      },

      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],

    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootShell,

  component: RootComponent,

  notFoundComponent: NotFoundComponent,

  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>

      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { theme, density, animationsEnabled } = useSettingsStore();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized) {
      useAlertsStore.getState().initialize();
      usePaperTradingStore.getState().initialize();
    }
  }, [user, initialized]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'compact');
    
    root.classList.add(theme);
    if (density === 'compact') {
      root.classList.add('compact');
    }

    if (!animationsEnabled) {
      root.classList.add('disable-animations');
    } else {
      root.classList.remove('disable-animations');
    }
  }, [theme, density, animationsEnabled]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AlertEvaluator />
        <CommandPalette />
        <Outlet />
      </ToastProvider>
    </QueryClientProvider>
  );
}

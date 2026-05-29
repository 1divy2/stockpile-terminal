import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';
type Density = 'comfortable' | 'compact';
type ChartTimeframe = '1D' | '1W' | '1M' | '3M' | '1Y';
type NumberFormat = 'standard' | 'compact';
type RefreshInterval = 'realtime' | '10s' | '30s' | '60s';

interface SettingsState {
  theme: Theme;
  density: Density;
  animationsEnabled: boolean;
  defaultChartTimeframe: ChartTimeframe;
  numberFormat: NumberFormat;
  refreshInterval: RefreshInterval;
  showWatchlistInline: boolean;
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setDefaultChartTimeframe: (tf: ChartTimeframe) => void;
  setNumberFormat: (format: NumberFormat) => void;
  setRefreshInterval: (interval: RefreshInterval) => void;
  setShowWatchlistInline: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      density: 'comfortable',
      animationsEnabled: true,
      defaultChartTimeframe: '1M',
      numberFormat: 'standard',
      refreshInterval: 'realtime',
      showWatchlistInline: true,
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),
      setDefaultChartTimeframe: (defaultChartTimeframe) => set({ defaultChartTimeframe }),
      setNumberFormat: (numberFormat) => set({ numberFormat }),
      setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
      setShowWatchlistInline: (showWatchlistInline) => set({ showWatchlistInline }),
    }),
    {
      name: 'stockpile-settings',
    }
  )
);

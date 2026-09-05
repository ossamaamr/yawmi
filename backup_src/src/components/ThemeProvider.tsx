import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSettingsStore } from '../state/settings-store';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  success: string;
  warning: string;
  danger: string;
  white: string;
  black: string;
}

const lightColors: ThemeColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceHover: '#f1f5f9',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: '#1e293b',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  primary: '#6366f1',
  primaryLight: '#eef2ff',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  white: '#ffffff',
  black: '#1e293b',
};

const darkColors: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceHover: '#334155',
  border: '#334155',
  borderLight: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#818cf8',
  primaryLight: '#1e1b4b',
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171',
  white: '#ffffff',
  black: '#0f172a',
};

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      setIsDark(true);
    } else if (theme === 'light') {
      setIsDark(false);
    } else {
      const hour = new Date().getHours();
      setIsDark(hour >= 19 || hour < 7);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ colors: isDark ? darkColors : lightColors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

import type { ThemePreference } from "./store/settings";

type ResolvedTheme = "light" | "dark";

export const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";
export const THEME_COLOR_META = 'meta[name="theme-color"]';
export const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: "#f8fafc",
  dark: "#0f172a"
};

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }
  return preference;
}

export function applyTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const meta = document.querySelector<HTMLMetaElement>(THEME_COLOR_META);
  if (meta) {
    meta.setAttribute("content", THEME_COLORS[theme]);
  }
}

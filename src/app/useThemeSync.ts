import { useEffect } from "react";
import { useSettingsStore } from "./store/settings";
import { applyTheme, resolveTheme, COLOR_SCHEME_QUERY } from "./theme-utils";

export function useThemeSync() {
  const preference = useSettingsStore((state) => state.theme);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(COLOR_SCHEME_QUERY);

    const sync = (value: Parameters<typeof resolveTheme>[0]) => {
      applyTheme(resolveTheme(value, media.matches));
    };

    sync(preference);

    if (preference !== "system") {
      return;
    }

    const handleChange = (event: MediaQueryListEvent) => {
      applyTheme(resolveTheme("system", event.matches));
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [preference]);
}
export { resolveTheme } from "./theme-utils";

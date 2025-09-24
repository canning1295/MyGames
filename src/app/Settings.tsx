import { useEffect } from "react";
import { useSettingsStore, type ThemePreference } from "./store/settings";

export default function Settings() {
  const theme = useSettingsStore((state) => state.theme);
  const haptics = useSettingsStore((state) => state.haptics);
  const ready = useSettingsStore((state) => state.ready);
  const hydrate = useSettingsStore((state) => state.hydrate);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setHaptics = useSettingsStore((state) => state.setHaptics);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const themeOptions: ThemePreference[] = ["system", "light", "dark"];

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background text-foreground">
        <p className="text-sm text-foreground/70">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
        <header>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-foreground/70">Configure the shell app behaviour. Changes sync to IndexedDB for offline play.</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Theme</h2>
          <div className="flex gap-2">
            {themeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                aria-pressed={theme === option}
                className={`rounded-md px-4 py-2 text-sm capitalize ${theme === option ? "bg-accent text-background" : "border border-foreground/20"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Haptics</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={haptics}
              onChange={(event) => setHaptics(event.target.checked)}
            />
            Enable vibration feedback where supported
          </label>
        </section>
      </div>
    </div>
  );
}

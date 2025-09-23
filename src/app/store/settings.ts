import { create } from "zustand";
import type { SettingsRow } from "@/core/db/schema";
import { getSettings, putSettings } from "@/core/db/repo";

export type ThemePreference = SettingsRow["theme"];

interface SettingsState extends SettingsRow {
  ready: boolean;
  hydrate: () => Promise<void>;
  setTheme: (theme: ThemePreference) => void;
  setHaptics: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: "system",
  haptics: true,
  ready: false,
  hydrate: async () => {
    if (get().ready) return;
    const stored = await getSettings();
    if (stored) {
      set({ ...stored, ready: true });
    } else {
      set({ ready: true });
      await putSettings({ theme: get().theme, haptics: get().haptics });
    }
  },
  setTheme: (theme) => {
    set({ theme });
    void persistSettings();
  },
  setHaptics: (enabled) => {
    set({ haptics: enabled });
    void persistSettings();
  }
}));

async function persistSettings() {
  const { theme, haptics } = useSettingsStore.getState();
  await putSettings({ theme, haptics });
}

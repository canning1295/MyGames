import type { GameSave } from "../game-types";

export const DB_NAME = "wpa-games-v1";
export const DB_VERSION = 1;

export type SavesRow = { gameId: string; save: GameSave };
export type HighScoreRow = { gameId: string; score: number; atISO: string };
export type StatsRow = { gameId: string; stats: Record<string, unknown> };

export type SettingsRow = {
  theme: "system" | "light" | "dark";
  haptics: boolean;
};

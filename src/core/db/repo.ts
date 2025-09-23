import { openDB } from "idb";
import type { GameId, GameSave } from "../game-types";
import { DB_NAME, DB_VERSION, type SettingsRow } from "./schema";
import { applyMigrations, type GameDBSchema } from "./migrations";

const dbPromise = openDB<GameDBSchema>(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    applyMigrations(db, oldVersion);
  }
});

export async function getSave(gameId: GameId): Promise<GameSave | undefined> {
  return (await dbPromise).get("saves", gameId) as Promise<GameSave | undefined>;
}

export async function putSave(gameId: GameId, save: GameSave): Promise<void> {
  await (await dbPromise).put("saves", save, gameId);
}

export async function updateSave(gameId: GameId, updater: (current?: GameSave) => GameSave): Promise<GameSave> {
  const db = await dbPromise;
  const current = (await db.get("saves", gameId)) as GameSave | undefined;
  const next = updater(current);
  await db.put("saves", next, gameId);
  return next;
}

export async function getHighScore(gameId: GameId): Promise<{ score: number; atISO: string } | undefined> {
  return (await dbPromise).get("highScores", gameId) as Promise<{ score: number; atISO: string } | undefined>;
}

export async function recordScore(gameId: GameId, score: number): Promise<void> {
  const db = await dbPromise;
  const current = (await db.get("highScores", gameId)) as { score: number; atISO: string } | undefined;
  if (!current || score > current.score) {
    await db.put("highScores", { score, atISO: new Date().toISOString() }, gameId);
  }
}

export async function getSettings(): Promise<SettingsRow | undefined> {
  return (await dbPromise).get("settings", "singleton") as Promise<SettingsRow | undefined>;
}

export async function putSettings(settings: SettingsRow): Promise<void> {
  await (await dbPromise).put("settings", settings, "singleton");
}

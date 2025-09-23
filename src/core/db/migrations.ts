import type { IDBPDatabase } from "idb";
import { DB_VERSION } from "./schema";

export type GameDBSchema = {
  saves: unknown;
  highScores: unknown;
  stats: unknown;
  settings: unknown;
};

export function applyMigrations(db: IDBPDatabase<GameDBSchema>, oldVersion: number): void {
  if (oldVersion < 1) {
    if (!db.objectStoreNames.contains("saves")) {
      db.createObjectStore("saves");
    }
    if (!db.objectStoreNames.contains("highScores")) {
      db.createObjectStore("highScores");
    }
    if (!db.objectStoreNames.contains("stats")) {
      db.createObjectStore("stats");
    }
    if (!db.objectStoreNames.contains("settings")) {
      db.createObjectStore("settings");
    }
  }

  if (DB_VERSION < 1) {
    console.warn("DB version lower than expected; migrations may be out of sync.");
  }
}

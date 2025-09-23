import type { LazyExoticComponent, ComponentType, JSX } from "react";

export type GameId = string;

export interface GameMetadata {
  id: GameId;
  title: string;
  description: string;
  cover: string;
  minVersion?: string;
  tags?: string[];
}

export interface GameSave {
  version: number;
  lastPlayedISO: string;
  state: unknown;
  highScore?: number;
  stats?: Record<string, unknown>;
}

export interface GameModule {
  meta: GameMetadata;
  mount: LazyExoticComponent<ComponentType<unknown>>;
  routes?: { path: string; element: JSX.Element }[];
  getInitialSave: (opts: { date?: string }) => Promise<GameSave> | GameSave;
  reducer?: (save: GameSave, action: unknown) => GameSave;
}

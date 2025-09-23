import type { GameSave } from "@/core/game-types";

export interface PangramPuzzle {
  id: string;
  letters: string[];
  center: string;
  solutions: string[];
  pangrams: string[];
  totalPoints: number;
}

export interface PangramState {
  puzzleId: string;
  found: string[];
  score: number;
  hintPresses: number;
  hintTargetWord: string | null;
  hintLettersRevealed: number;
  lastResetISO: string;
  outerOrder: string[];
}

export type PangramGameSave = GameSave & {
  state: PangramState;
};

export type HintResult =
  | { type: "count"; count: number }
  | { type: "letters"; letters: string }
  | { type: "done" };

export interface RankThreshold {
  name: string;
  minPercent: number;
}

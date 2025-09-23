import type { PangramPuzzle, PangramState, PangramGameSave } from "./types";

export const SAVE_VERSION = 1;

export function createInitialState(puzzle: PangramPuzzle): PangramState {
  const outer = puzzle.letters.filter((letter) => letter !== puzzle.center);
  const now = new Date().toISOString();
  return {
    puzzleId: puzzle.id,
    found: [],
    score: 0,
    hintPresses: 0,
    hintTargetWord: null,
    hintLettersRevealed: 0,
    lastResetISO: now,
    outerOrder: outer
  };
}

export function createInitialSave(puzzle: PangramPuzzle): PangramGameSave {
  return {
    version: SAVE_VERSION,
    lastPlayedISO: new Date().toISOString(),
    state: createInitialState(puzzle),
    highScore: 0,
    stats: {}
  };
}

export function ensureStateForPuzzle(save: PangramGameSave, puzzle: PangramPuzzle): PangramGameSave {
  if (save.state.puzzleId === puzzle.id && save.version === SAVE_VERSION) {
    return save;
  }

  const nextState = createInitialState(puzzle);
  return {
    ...save,
    version: SAVE_VERSION,
    lastPlayedISO: new Date().toISOString(),
    state: nextState,
    highScore: save.highScore ?? 0,
    stats: save.stats ?? {}
  };
}

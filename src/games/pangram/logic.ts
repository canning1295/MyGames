import type { PangramPuzzle, PangramState, HintResult } from "./types";

const PANGRAM_BONUS = 7;

export function normalizeWord(input: string): string {
  return input.trim().toUpperCase();
}

function createLetterSet(letters: string[]): Set<string> {
  return new Set(letters.map((letter) => letter.toUpperCase()));
}

export function usesAllowedLetters(word: string, letters: string[]): boolean {
  const allowed = createLetterSet(letters);
  for (const ch of word) {
    if (!allowed.has(ch)) return false;
  }
  return true;
}

export function isValidWord(word: string, puzzle: PangramPuzzle): boolean {
  const normalized = normalizeWord(word);
  if (normalized.length < 4) return false;
  if (!normalized.includes(puzzle.center)) return false;
  if (!usesAllowedLetters(normalized, puzzle.letters)) return false;
  return puzzle.solutions.includes(normalized);
}

export function isPangramWord(word: string, letters: string[]): boolean {
  const uppercaseWord = normalizeWord(word);
  const uniqueLetters = createLetterSet(letters);
  for (const letter of uniqueLetters) {
    if (!uppercaseWord.includes(letter)) {
      return false;
    }
  }
  return true;
}

export function scoreWord(word: string, letters: string[]): number {
  const normalized = normalizeWord(word);
  const base = normalized.length === 4 ? 1 : normalized.length;
  return base + (isPangramWord(normalized, letters) ? PANGRAM_BONUS : 0);
}

const RANK_THRESHOLDS = [
  { name: "Beginner", minPercent: 0 },
  { name: "Good", minPercent: 0.2 },
  { name: "Great", minPercent: 0.4 },
  { name: "Amazing", minPercent: 0.7 },
  { name: "Genius", minPercent: 1 }
] as const;

export function getRank(score: number, totalPoints: number) {
  if (totalPoints <= 0) {
    return { name: "Beginner", percent: 0, next: undefined };
  }
  const percent = score / totalPoints;
  let current = RANK_THRESHOLDS[0];
  for (const threshold of RANK_THRESHOLDS) {
    if (percent >= threshold.minPercent) {
      current = threshold;
    } else {
      break;
    }
  }
  const next = RANK_THRESHOLDS.find((threshold) => threshold.minPercent > current.minPercent);
  return { name: current.name, percent, next };
}

export function advanceHint(state: PangramState, puzzle: PangramPuzzle): { nextState: PangramState; hint: HintResult } {
  const nextState: PangramState = {
    ...state,
    hintPresses: state.hintPresses + 1
  };

  if (nextState.hintPresses === 1) {
    return {
      nextState,
      hint: { type: "count", count: puzzle.pangrams.length }
    };
  }

  const remaining = puzzle.pangrams.filter((word) => !nextState.found.includes(word));

  if (remaining.length === 0) {
    nextState.hintTargetWord = null;
    nextState.hintLettersRevealed = 0;
    return { nextState, hint: { type: "done" } };
  }

  let target = nextState.hintTargetWord;
  if (!target || !remaining.includes(target)) {
    target = remaining[0];
    nextState.hintTargetWord = target;
    nextState.hintLettersRevealed = 0;
  }

  nextState.hintLettersRevealed = Math.min(target.length, nextState.hintLettersRevealed + 1);
  const letters = target.slice(0, nextState.hintLettersRevealed);

  return {
    nextState,
    hint: { type: "letters", letters }
  };
}

export function resetHintState(state: PangramState): PangramState {
  return {
    ...state,
    hintTargetWord: null,
    hintLettersRevealed: 0
  };
}

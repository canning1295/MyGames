export type CrosswordDirection = "across" | "down";

export interface CrosswordCell {
  readonly row: number;
  readonly col: number;
  readonly solution: string;
  readonly isBlock: boolean;
}

export interface CrosswordEntry {
  readonly number: number;
  readonly clue: string;
  readonly answer: string;
  readonly row: number;
  readonly col: number;
  readonly direction: CrosswordDirection;
}

export interface CrosswordPuzzle {
  readonly title: string;
  readonly author: string;
  readonly size: number;
  readonly grid: readonly CrosswordCell[][];
  readonly across: readonly CrosswordEntry[];
  readonly down: readonly CrosswordEntry[];
}

const LETTERS = [
  "SALEM",
  "ARENA",
  "LEMUR",
  "ENURE",
  "MARES"
];

const GRID: CrosswordCell[][] = LETTERS.map((word, row) =>
  Array.from(word).map((char, col) => ({
    row,
    col,
    solution: char,
    isBlock: false
  }))
);

const acrossEntries: CrosswordEntry[] = [
  { number: 1, clue: "Witch trial city", answer: "SALEM", row: 0, col: 0, direction: "across" },
  { number: 2, clue: "Sports venue", answer: "ARENA", row: 1, col: 0, direction: "across" },
  { number: 3, clue: "Madagascar primate", answer: "LEMUR", row: 2, col: 0, direction: "across" },
  { number: 4, clue: "Accustom (to)", answer: "ENURE", row: 3, col: 0, direction: "across" },
  { number: 5, clue: "Adult female horses", answer: "MARES", row: 4, col: 0, direction: "across" }
];

const downEntries: CrosswordEntry[] = [
  { number: 1, clue: "Witch trial city", answer: "SALEM", row: 0, col: 0, direction: "down" },
  { number: 2, clue: "Sports venue", answer: "ARENA", row: 0, col: 1, direction: "down" },
  { number: 3, clue: "Madagascar primate", answer: "LEMUR", row: 0, col: 2, direction: "down" },
  { number: 4, clue: "Accustom (to)", answer: "ENURE", row: 0, col: 3, direction: "down" },
  { number: 5, clue: "Adult female horses", answer: "MARES", row: 0, col: 4, direction: "down" }
];

export const MINI_CROSSWORD: CrosswordPuzzle = {
  title: "Word Square Mini",
  author: "MyGames",
  size: LETTERS.length,
  grid: GRID,
  across: acrossEntries,
  down: downEntries
};

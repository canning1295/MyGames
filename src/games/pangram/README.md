# Pangram

A honeycomb-style word game inspired by classic spelling challenges. Form words of four or more letters using the seven available letters. Every word must include the highlighted center letter. Use the hint button for progressive pangram reveals, shuffle the outer letters to find new angles, and reset to replay the day’s puzzle. Progress is saved automatically to IndexedDB.

## Controls

- Tap letters to build a word; use **Delete** to remove the last letter and **Clear** to reset the entry field.
- **Submit** validates the current attempt and awards points. Pangrams (words using all seven letters) earn a bonus.
- **Shuffle** randomises the six outer letters without affecting score.
- **Reset** clears progress for the active date after confirmation.
- The **Hint** button cycles through pangram count and letter reveals for unfound pangrams.

## Save data schema

```ts
interface PangramState {
  puzzleId: string;
  found: string[];          // uppercased solutions already discovered
  score: number;            // cumulative score for the puzzle
  hintPresses: number;      // how many times the hint button was pressed
  hintTargetWord: string | null; // current pangram receiving hints
  hintLettersRevealed: number;   // number of letters revealed for the target pangram
  lastResetISO: string;     // ISO timestamp of the last manual reset
  outerOrder: string[];     // current order of the six outer letters
}
```

Saves are stored as `GameSave` entries with `version = 1` and include a per-puzzle `lastPlayedISO` timestamp.

## Word list provenance

Puzzles are generated from the [open-source word list](https://github.com/ConorSheehan1/spelling-bee) maintained by Conor Sheehan's Spelling Bee clone. The source list is filtered to words that:

- contain only alphabetic characters,
- are at least four letters long, and
- are uppercased for consistent comparisons.

Run `node scripts/update-pangram-wordlist.mjs` to refresh the local JSON list (internet access required). The helper script downloads the latest list and rewrites `wordlist.json` in a sorted, de-duplicated format.

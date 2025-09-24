# Mini Crossword Feature Plan

## 1. Objectives
- Introduce a New York Times–style daily mini crossword (5×5 grid by default) that lives alongside Pangram in the MyGames shell.
- Allow players to choose a difficulty preset (Easy / Standard / Hard) before puzzle generation.
- Support offline-first play, persistent saves, streak tracking, and keyboard input on desktop.
- Maintain iPhone 17 Pro visual polish while remaining responsive for other breakpoints.

## 2. Reference research & inspirations
- **Downforacross** (open-source crossword web app) demonstrates collaborative solving, puzzle import/export, and a responsive grid; we can study its grid rendering, clue navigation, and keyboard shortcuts for best practices.
- **XWordJS / Puzzle.js** projects show how to parse `.puz` files and build clue data structures; reusing their serialization logic can simplify puzzle import/export.
- **wordpuz** and **Crossword Nexus** provide sample word lists, clue databases, and heuristics for auto-generating symmetric grids.
- The NYT Mini emphasizes rapid play (under two minutes) and accessible clueing; our UX should mimic its clarity while respecting unique branding.

## 3. Experience overview
1. Player selects "Mini Crossword" card from the home grid.
2. Splash screen offers difficulty presets plus a daily seed toggle (e.g., Today / Random / Custom Seed).
3. Game view shows crossword grid, across/down clue lists, timer, keyboard (mobile), and actions (Check, Reveal, Reset).
4. Progress auto-saves; finishing shows completion stats, streak impact, and sharing copy.

## 4. Difficulty system
- **Grid templates**: Maintain curated symmetric templates per difficulty (e.g., Easy uses 5×5 with ≥ 60% fill; Hard introduces 6×6 or trickier black-square patterns).
- **Word lists**: Tag entries with difficulty metadata (frequency, part of speech, theme). Source from open word lists (`wordfreq`, public crossword lexicons) enriched with manual flags.
- **Clue banks**: For each entry, store multiple clue variants labeled by difficulty (straight, punny, trivia). Hard difficulty favors indirect or multi-word clues.
- **Generation knobs**:
  - Easy: prefer high-frequency words, direct clues, maximum 3-letter minimum, symmetrical template A.
  - Standard: balanced vocabulary, include one theme revealer, allow two multi-word entries.
  - Hard: allow less common entries, multi-step clues, and rebus squares (optional future enhancement).
- Persist chosen difficulty in the save file to drive scoring, hint budgets, and analytics.

## 5. Puzzle generation pipeline
1. **Seed selection**: Combine date + difficulty + optional custom seed to drive deterministic PRNG (e.g., `seedrandom`).
2. **Template selection**: Pick from difficulty-weighted template library.
3. **Filling algorithm**:
   - Use heuristics from open-source fillers (`wordpuz`, `qross`) that implement constraint propagation and scoring.
   - Precompute slot order using maximum-constraint-first; fill with words scored by difficulty alignment and letter distribution.
   - Support fallback to curated puzzle bank if generation fails within a retry threshold.
4. **Clue assignment**: Attach clue variant matching difficulty; ensure across/down numbering.
5. **Validation**: Run checks for connectivity, unique solutions, letter frequency, and theme compliance.
6. **Serialization**: Store puzzle state using a lightweight JSON schema (grid layout, clues, metadata, difficulty, seed).
7. **Caching**: Save generated puzzles to IndexedDB to avoid regeneration for identical seeds.

## 6. Data & architecture updates
- Extend `GameSave` for crossword with:
  ```ts
  interface MiniCrosswordSaveState {
    version: 1;
    seed: string;
    difficulty: "easy" | "standard" | "hard";
    grid: CellState[];        // player letters, pencil marks
    cursor: { row: number; col: number; direction: "across" | "down" };
    revealed: boolean[][];    // track revealed cells for scoring
    stats: { timeMs: number; checksUsed: number; revealsUsed: number; streak: number };
  }
  ```
- Add a crossword-specific repository in `src/core/db` for caching generated puzzles and storing streak history per difficulty.
- Introduce shared utilities in `src/core/utils/wordlists.ts` for word frequency scoring and seeding.
- Update `src/core/games-registry.ts` to lazy-load `src/games/mini-crossword` module.

## 7. UI & UX design
- **Layout**: Split screen on iPhone 17 Pro — grid occupies upper portion, clue list collapses into swipeable panels; on desktop/tablet, show grid left, across/down lists right.
- **Navigation**: Tap/click toggles between across/down; highlight current clue cells; provide auto-advance after filling entry.
- **Controls**: Toolbar with buttons for Shuffle Clues (optional), Check Letter/Word/Puzzle, Reveal, Reset, Settings.
- **Hints**: Allow one free hint on Easy, limited hints on Standard, none on Hard (unless user spends streak currency).
- **Timer**: Auto-start on first move; pause when leaving view; show celebratory animation when completed.
- **Accessibility**: Support VoiceOver/ARIA roles for grid cells, keyboard navigation with arrow keys/tab, and high-contrast theme toggle.

## 8. Input handling
- **Mobile**: Render custom on-screen keyboard with smart navigation (auto move forward, show pencil mode). Integrate haptic feedback via `navigator.vibrate` wrapper.
- **Desktop**: Capture hardware keyboard events (letters, backspace, arrow keys, tab/shift+tab). Provide shortcuts for check/reveal (e.g., Cmd/Ctrl+Enter) and clue navigation (arrow up/down).
- **Internationalization**: Restrict to ASCII A–Z for now; handle uppercase transformation automatically.

## 9. Integration with shell app
- Add "Mini Crossword" card to home grid with cover art and description.
- Implement lazy-loaded `MiniCrosswordGame` component exposing the `GameModule` contract.
- Register routes for `/mini-crossword`, `/mini-crossword/settings`, and optional `/mini-crossword/archive/:seed`.
- Hook into global settings (e.g., theme, reduced motion) via shared store; reuse IndexedDB service for saves.
- Ensure service worker pre-caches crossword assets and word lists.

## 10. iPhone 17 Pro optimization
- Use CSS clamp to maintain grid legibility (minimum 44px cells, scalable up to viewport width minus safe areas).
- Respect `env(safe-area-inset-*)` for toolbar and clue panels.
- Profile with Lighthouse mobile emulation to verify 60 fps interactions and <2.5s Time to Interactive.
- Test with Safari-specific quirks (keyboard viewport resize, inertial scrolling) and adjust with viewport height CSS variables.

## 11. Desktop enhancements
- Support full keyboard navigation and optional resizeable layout (drag to widen clue list).
- Add mouse-hover previews for clue references and tooltip for difficulty icon.
- Integrate `localStorage` flag to remember last window layout preferences.

## 12. Persistence & analytics
- Store per-difficulty streak, best times, and history in IndexedDB; expose summary in Settings and end screen.
- Capture anonymous telemetry events (if enabled) for puzzle completion, difficulty distribution, hint usage (respect privacy toggle).
- Provide export/import of crossword history alongside Pangram saves.

## 13. QA & testing strategy
- Unit tests for puzzle generator (deterministic seeds, fill validity) and reducers handling input/edit operations.
- Component tests (Vitest + Testing Library) for grid navigation, clue selection, keyboard input.
- Playwright smoke tests across iPhone 17 Pro viewport and desktop to validate solving flow, difficulty selection, and offline caching.
- Accessibility audit with axe-core; ensure tab order and ARIA roles for cells/clues.

## 14. Delivery roadmap
- **Sprint 1**: Research word lists, build generator prototype, define JSON schema, difficulty presets, and caching layer.
- **Sprint 2**: Implement React components (grid, clues, toolbar), hook up keyboard input, integrate saves, and difficulty selection UI.
- **Sprint 3**: Polish animations, add hints/check flow, finalize responsive design, implement analytics, and run QA/performance audits.
- **Launch**: Beta with curated puzzle bank fallback, monitor feedback, iterate on generator heuristics.

---
This plan should be treated as a living document. Update it when scope, tooling, or roadmap shifts.

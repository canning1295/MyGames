# WPA (PWA) Games – Comprehensive Build Plan

> Target: A Progressive Web App (PWA) hosted on Netlify that lists and launches multiple mini‑games. Games are modular so an AI agent (or a dev) can add new ones without touching the shell app. Primary device: **iPhone 17 Pro** (428×926 CSS logical points @3x; dynamic island safe areas). Offline play, local save/high scores via **IndexedDB**. Includes a **Spelling‑Bee‑style “Pangram” clone** with custom hint logic.

---

## 0) Tech stack & high‑level architecture

* **Frontend**: React + TypeScript + Vite (fast builds, ESM, SW support).
* **Styling**: Tailwind CSS (utility‑first, easy responsiveness) + CSS variables for themes.
* **UI kit**: shadcn/ui (Radix primitives), lucide-react icons.
* **State**: Zustand (tiny, predictable) or React Context for app‑wide state.
* **Routing**: React Router (code‑split per game via `lazy()` + `Suspense`).
* **Persistence**: IndexedDB via `idb` (low‑level) or `idb-keyval` (simple) wrapped in a typed repo layer.
* **PWA**: Web App Manifest + Workbox service worker (precaching shell; runtime cache for assets; IndexedDB for data).
* **Testing**: Vitest + Testing Library + Playwright (smoke on iPhone viewport).
* **Analytics**: Optional, privacy‑friendly (e.g., Plausible). Avoid blocking offline.
* **Hosting**: Netlify. Use redirects for SPA (`/_redirects`). Enable Brotli.

---

## 1) Repository layout

```
/ (root)
├─ netlify.toml
├─ _redirects
├─ public/
│  ├─ favicon.svg
│  ├─ apple-touch-icon.png
│  ├─ site.webmanifest
│  ├─ icons/ (PWA icon sizes)
│  └─ sw.js (built by Workbox or Vite plugin)
├─ src/
│  ├─ app/
│  │  ├─ index.tsx
│  │  ├─ routes.tsx
│  │  ├─ App.tsx
│  │  ├─ store/ (Zustand)
│  │  ├─ pwa/ (manifest, SW registration helpers)
│  │  └─ device/ (viewport helpers, haptics)
│  ├─ core/
│  │  ├─ games-registry.ts (dynamic registry)
│  │  ├─ game-types.ts (interfaces)
│  │  ├─ db/
│  │  │  ├─ schema.ts
│  │  │  ├─ repo.ts (typed DB API)
│  │  │  └─ migrations.ts
│  │  └─ utils/ (PRNG, date-seed, etc.)
│  ├─ components/
│  │  ├─ GameCard.tsx
│  │  ├─ Grid.tsx
│  │  ├─ HintButton.tsx
│  │  └─ …
│  ├─ games/
│  │  ├─ pangram/ (NYT Spelling‑Bee‑style clone)
│  │  │  ├─ index.ts (GameModule export)
│  │  │  ├─ PangramGame.tsx
│  │  │  ├─ logic.ts (validate, score, hint engine)
│  │  │  ├─ generator.ts (daily/backdated puzzle gen)
│  │  │  ├─ assets/
│  │  │  └─ README.md (micro‑spec)
│  │  └─ <new-game>/ (one folder per game)
│  ├─ ai/
│  │  └─ CONTRIBUTING-GAMES.md (this file = **Game UI contract** for AI agents)
│  └─ index.css
└─ package.json
```

---

## 2) Game Module Contract (for AI agents & devs)

Create `src/ai/CONTRIBUTING-GAMES.md` with the following **source of truth** (summarized here):

### 2.1 Interfaces

```ts
// src/core/game-types.ts
export type GameId = string;

export interface GameMetadata {
  id: GameId;               // unique kebab-case id (e.g., "pangram")
  title: string;            // Display name
  description: string;      // Short tagline
  cover: string;            // Path to cover image (public or imported)
  minVersion?: string;      // Optional app min version
  tags?: string[];          // e.g., ["word", "daily", "offline"]
}

export interface GameSave {
  version: number;          // for migrations
  lastPlayedISO: string;    // ISO date
  state: unknown;           // game-defined serializable state
  highScore?: number;
  stats?: Record<string, unknown>;
}

export interface GameModule {
  meta: GameMetadata;
  mount: React.LazyExoticComponent<React.ComponentType<unknown>>; // lazy Game component
  routes?: { path: string; element: JSX.Element }[]; // optional nested routes
  getInitialSave: (opts: { date?: string }) => Promise<GameSave> | GameSave;
  reducer?: (save: GameSave, action: unknown) => GameSave; // optional
}
```

### 2.2 Directory rules

* Place each game in `src/games/<game-id>/` with an `index.ts` that `export default` a `GameModule`.
* Include a `README.md` stating controls, goal, and save schema.
* Include an `assets/` folder for game art.
* Avoid cross‑game imports; use `src/core` utilities only.

### 2.3 Registry & discovery

```ts
// src/core/games-registry.ts
export const registry: GameModule[] = [
  () => import("../games/pangram/index"),
  // add new games by pushing dynamic imports
].map(lazyImport => ({
  // resolves to { default: GameModule }
  // shell lists meta from each module once loaded
} as any));
```

> The **shell homepage** maps over the resolved registry and renders `GameCard`s. New games appear automatically upon import.

### 2.4 UI sizing & iPhone 17 Pro targets

* Safe areas: use `env(safe-area-inset-*)` padding for top/bottom.
* Target FPS 60; avoid heavy shadows/filters.
* Hit targets ≥ 44×44 pt (Apple HIG).
* Use `100dvh` + `min-h-[100dvh]` to handle iOS address bar.
* Haptics: light impact on key events via `navigator.vibrate()` fallback.

---

## 3) IndexedDB schema & persistence

* DB name: `wpa-games-v1` (bump suffix on breaking changes).
* Version: `1` initially; manage upgrades in `migrations.ts`.
* Object stores:

  * `saves` (key: `gameId:string` → `GameSave`)
  * `highScores` (key: `gameId:string` → `{ score: number, atISO: string }`)
  * `stats` (key: `gameId:string` → custom per‑game aggregate)
  * `settings` (key: `singleton` → theme, haptics, etc.)

```ts
// src/core/db/schema.ts
export type SavesRow = { gameId: string; save: GameSave };
export type HighScoreRow = { gameId: string; score: number; atISO: string };
```

**Repo patterns** (`repo.ts`): `getSave(gameId)`, `putSave(gameId, save)`, `updateSave(fn)`, `getHighScore(gameId)`, `recordScore(gameId, score)`.

Autosave: debounce to 300ms after relevant actions.

---

## 4) PWA setup

* `site.webmanifest`: name, short\_name, theme\_color, `display: standalone`, iPhone splash screens.
* Service Worker (Workbox):

  * **Precache**: app shell, fonts, critical images.
  * **Runtime caching**: stale‑while‑revalidate for images; network‑first for JSON (if any); **do not cache** API POSTs.
  * **Background sync**: not needed (offline‑first).
* Netlify headers to enable PWA install:

  * `Link: </public/icons/icon-192.png>; rel=preload; as=image` (optional)
  * CSP allows `self` and required `data:`.

Example `netlify.toml`:

```toml
[[headers]]
for = "/index.html"
  [headers.values]
  Cache-Control = "no-store"

[[headers]]
for = "/assets/*"
  [headers.values]
  Cache-Control = "public, max-age=31536000, immutable"
```

`_redirects`:

```
/*    /index.html   200
```

---

## 5) Home screen UX

* Grid of `GameCard`s (cover, title, tags, last played). Tap → launches.
* Top bar: app title, settings, install/PWA badge.
* Footer safe‑area spacer.
* Search/filter by tag.

---

## 6) Pangram (NYT Spelling‑Bee‑style clone)

> A 7‑letter honeycomb. Player forms words ≥ 4 letters; **must include the center letter**; letters may be reused; only from allowed set. **Pangram** = uses all 7 letters at least once. Score: 1 pt (4‑letter) then +1/letter; pangram bonus +7 (configurable). Multiple pangrams possible.

### 6.1 Data model

```ts
export interface PangramPuzzle {
  id: string;               // e.g., YYYY-MM-DD or seed
  letters: string[];        // 7 uppercase letters total
  center: string;           // one of letters
  solutions: string[];      // valid words (filtered by dict + rules)
  pangrams: string[];       // subset of solutions using all 7 letters
}

export interface PangramSave {
  found: string[];          // words found
  score: number;
  hintPresses: number;      // for progressive hinting
  lastResetISO: string;
}
```

### 6.2 Hint behavior (requested)

* **Hint button** cycles granularly:

  1. **First press** → show `pangrams.length` (count) in a toast/badge.
  2. **Second press** → reveal **first letter** of the **first un‑found pangram**.
  3. Each additional press → reveal **one more letter** (left‑to‑right) of that same pangram.
  4. If the player has already found that pangram, choose another **unfound pangram** and restart from its first letter.
  5. When all pangrams are found, show a celebratory message; further presses do nothing.
* Hints are **local** to the session (persist `hintPresses` in save). Hints do not affect scoring.

### 6.3 Reset behavior (mimic NYT)

* **Shuffle**: reorders the 6 outer letters randomly (center fixed). No score change.
* **Clear**: clears current entry field only.
* **Reset**: confirm dialog → clears `found`, `score`, `hintPresses` to 0 but keeps the same day’s puzzle.
* **New game (daily)**: seed by date; changing date → loads fresh puzzle.

### 6.4 UI & controls

* Honeycomb with 7 keys; tap = append, double‑tap = remove last (or backspace button).
* Input bar shows current attempt; Submit button; Shake on invalid.
* Stats drawer: words found, rank ladder, pangram badge, high score.
* Hint icon (❔) fixed bottom‑right within safe area.

### 6.5 Puzzle generation

* Use an offline English word list (e.g., wordfreq subset or word-lists under permissive license). Filter:

  * only alphabetic; ≥4 chars; must include `center`; composed solely of 7 letters; disallow proper nouns, abbreviations (simple heuristics: no caps, no apostrophes, exclude blacklist).
* **Daily seed** = `YYYY‑MM‑DD` in user’s timezone. Deterministic PRNG (Mulberry32) to pick 7‑letter set with ≥1 pangram.
* Allow **Backdate** selector to “play old puzzles” generated locally from the seed (not NYT originals).

### 6.6 Scoring & ranks

* Score table:

  * 4 letters = 1 point; 5+ = length points; Pangram bonus +7 (configurable constant).
* Ranks thresholds: Beginner, Good, Great, Amazing, Genius (percent of total possible score), derived at runtime.

### 6.7 Validation workflow

1. On submit: normalize → uppercase → validate against `solutions`; reject duplicates.
2. Haptic feedback: success (soft) / failure (error).
3. Save update: `found`, recompute `score`, update `highScores` store if beaten.

---

## 7) Legal & content sourcing

* **Do not fetch or replicate NYT proprietary puzzles or content.** The clone mimics mechanics only, with **original, locally generated puzzles** from an open word list.
* “NYT” and “Spelling Bee” are trademarks of their owners—avoid using marks in UI. Use neutral names: “**Honeycomb**” or “**Pangram**”.
* To “play old NYT games”: offer **backdating** your own generator instead of scraping or bypassing paywalls.
* Optional free APIs for **auxiliary** features (not for NYT content):

  * Datamuse (word suggestions),
  * Wordnik (definitions; requires key),
  * Free open word lists (wordfreq, wordfreq‑top, wordfreq‑zipf; choose permissive license and embed).

---

## 8) Adding more games (pattern)

Each game exports `GameModule`. Example stub:

```ts
// src/games/2048/index.ts
import { lazy } from "react";
import type { GameModule } from "@/core/game-types";

export default {
  meta: {
    id: "2048",
    title: "2048",
    description: "Slide to combine tiles",
    cover: new URL("./assets/cover.png", import.meta.url).toString(),
    tags: ["puzzle", "offline"],
  },
  mount: lazy(() => import("./Game2048")),
  getInitialSave: () => ({ version: 1, lastPlayedISO: new Date().toISOString(), state: {}, highScore: 0 }),
} satisfies GameModule;
```

Once placed in `src/games/2048/` and added to `games-registry.ts` dynamic imports, it appears on the home screen automatically.

---

## 9) Storage & migrations

* Always include a `version` on each `GameSave`.
* On app DB version bump, run `migrations.ts` to transform object stores.
* Provide `export/import` of all local data as JSON for backups (Settings screen).

---

## 10) Implementation sketches

### 10.1 Typed DB repo (excerpt)

```ts
// src/core/db/repo.ts
import { openDB } from "idb";
import type { GameSave } from "@/core/game-types";

const DB_NAME = "wpa-games-v1";
const DB_VERSION = 1;

export const dbp = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("saves")) db.createObjectStore("saves");
    if (!db.objectStoreNames.contains("highScores")) db.createObjectStore("highScores");
    if (!db.objectStoreNames.contains("stats")) db.createObjectStore("stats");
    if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings");
  },
});

export async function getSave(gameId: string) {
  return (await dbp).get("saves", gameId) as GameSave | undefined;
}
export async function putSave(gameId: string, save: GameSave) {
  return (await dbp).put("saves", save, gameId);
}
export async function recordScore(gameId: string, score: number) {
  const cur = (await dbp).get("highScores", gameId) as { score: number; atISO: string } | undefined;
  if (!cur || score > cur.score) {
    await (await dbp).put("highScores", { score, atISO: new Date().toISOString() }, gameId);
  }
}
```

### 10.2 Pangram logic (core)

```ts
// src/games/pangram/logic.ts
export function isValid(word: string, puzzle: PangramPuzzle) {
  const w = word.toUpperCase();
  if (w.length < 4) return false;
  if (!w.includes(puzzle.center)) return false;
  const set = new Set(puzzle.letters);
  for (const ch of w) if (!set.has(ch)) return false;
  return puzzle.solutions.includes(w);
}

export function isPangram(word: string, letters: string[]) {
  const set = new Set(letters);
  for (const ch of set) if (!word.includes(ch)) return false;
  return true;
}

export function scoreWord(w: string, letters: string[]) {
  const len = w.length;
  const base = len === 4 ? 1 : len; // SB-like
  const bonus = isPangram(w, letters) ? 7 : 0;
  return base + bonus;
}

export function nextHint(save: PangramSave, puzzle: PangramPuzzle) {
  const unfound = puzzle.pangrams.filter(p => !save.found.includes(p));
  if (save.hintPresses === 0) {
    return { type: "count", count: puzzle.pangrams.length };
  }
  if (unfound.length === 0) return { type: "done" };
  // Determine which pangram we’re hinting
  const idx = 0; // could pick shortest, or first alphabetically
  const pg = unfound[idx];
  const revealLen = Math.min(save.hintPresses, pg.length);
  return { type: "letters", letters: pg.slice(0, revealLen) };
}
```

### 10.3 Pangram generator (deterministic)

```ts
// src/games/pangram/generator.ts
import wordlist from "./wordlist.json"; // uppercase words

function mulberry32(a: number) { return function() { let t = a += 0x6D2B79F5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; } }

function seededRng(seed: string) { let h = 2166136261; for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return mulberry32(h >>> 0); }

export function buildPuzzle(seedISO: string): PangramPuzzle {
  const rng = seededRng(seedISO.slice(0,10));
  let letters: string[] = [];
  // loop until we find a 7‑letter set with ≥ 1 pangram
  while (true) {
    letters = Array.from({ length: 7 }, () => String.fromCharCode(65 + Math.floor(rng() * 26)));
    const center = letters[Math.floor(rng() * 7)];
    const solutions = wordlist.filter(w => {
      if (w.length < 4 || !w.includes(center)) return false;
      for (const ch of w) if (!letters.includes(ch)) return false;
      return true;
    });
    const pangrams = solutions.filter(w => new Set(letters).size === 7 && letters.every(l => w.includes(l)));
    if (pangrams.length > 0 && solutions.length >= 20) return { id: seedISO.slice(0,10), letters, center, solutions, pangrams };
  }
}
```

> Provide a curated `wordlist.json` (\~25–50k words) with permissive license. Optionally add frequency filters to avoid obscurities.

### 10.4 Pangram UI (sketch)

* `PangramGame.tsx` renders:

  * Title bar with date selector & actions (Shuffle, Clear, Reset).
  * Honeycomb component bound to letters; on press → update input.
  * Input bar + Submit; on success, add chip to “Found Words” list.
  * **HintButton** using `nextHint()` logic.

---

## 11) Build, deploy, and CI

* **Scripts**: `dev`, `build`, `preview`, `test`, `lint`.
* **Netlify**: Build command `vite build`; publish `dist/`.
* **CI** (GitHub Actions):

  * install → typecheck → unit tests → build.
  * Playwright run on iPhone viewport for Pangram smoke (load, enter word, hint cycles, reset).

---

## 12) Performance & accessibility

* Lazy‑load each game bundle; prefetch on hover/touchstart.
* Use `prefers-reduced-motion` for animations.
* Color contrast ≥ 4.5:1; large text ≥ 3:1.
* Dynamic font size slider; support VoiceOver (aria‑labels on honeycomb keys).

---

## 13) Security & privacy

* All data local. No third‑party trackers by default.
* CSP restrictive; no eval; only `self` + `data:` for images.
* Opt‑in telemetry if desired, with export/delete.

---

## 14) Nice‑to‑haves

* Share playcode/seed links (`?date=YYYY‑MM‑DD`).
* Theming (light/dark/system). Haptics toggle.
* In‑app dictionary lookup via Datamuse/Wordnik (if online).
* “Daily streaks” computed from local play.

---

## 15) Roadmap (MVP → v1)

* **MVP (week 1)**

  * Shell app + registry + home grid
  * IndexedDB repo + Settings
  * Pangram generator, logic, UI, hint & reset
  * PWA install + offline
  * Netlify deploy
* **v1 (week 2–3)**

  * Stats/ranks, high scores
  * Backdated seeds UI (play old local puzzles)
  * Export/import saves
  * A second simple game (e.g., 2048 or Snake) to validate the module contract
  * Accessibility pass + Playwright tests

---

## 16) Copy blocks you can paste into the codebase

### 16.1 `src/ai/CONTRIBUTING-GAMES.md` (authoring instructions)

```
# Game authoring contract

1) Create a folder in `src/games/<game-id>/`.
2) Add `index.ts` that `export default` a `GameModule`.
3) Add a React component file that renders your game.
4) Provide a `getInitialSave()` and specify your `state` shape in README.
5) Keep all game data local; use IndexedDB via the shared repo. Do not create your own DB.
6) Do NOT import from other games. Only use `@/core/*` and local files.
7) UI must be responsive on iPhone 17 Pro; minimum tap area 44×44 pt.
8) If you add routes (e.g., `/:id`), define them in `module.routes`.
9) Internationalization not required for v1.
10) Put your cover art in `assets/` and reference it in `meta.cover`.
```

### 16.2 `src/app/routes.tsx` (dynamic routes)

```tsx
import { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import Home from "./Home";
import { modules } from "@/core/games-registry";

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  ...modules.map(m => ({ path: `/${m.meta.id}/*`, element: <Suspense fallback={<div/>}><m.mount /></Suspense> })),
]);
```

### 16.3 `src/components/HintButton.tsx` (behavior outline)

```tsx
export function HintButton({ save, setSave, puzzle }) {
  function onPress() {
    const next = { ...save, hintPresses: save.hintPresses + 1 };
    setSave(next);
    const hint = nextHint(next, puzzle);
    // show toast/badge based on hint.type
  }
  return <button aria-label="Hint" onClick={onPress}>❔</button>;
}
```

---

## 17) What we are **not** doing

* Fetching NYT’s actual daily puzzles or assets.
* Reusing NYT marks in UI.
* Syncing across devices (v2 idea via optional cloud backup).

---

## 18) Acceptance checklist

* [ ] Home lists games from registry; adding a folder makes a new card appear.
* [ ] PWA installable on iPhone; safe‑areas respected.
* [ ] Pangram: generation deterministic by date; ≥1 pangram per day.
* [ ] Hint button cycles (count → first letter → progressive letters → next pangram → done).
* [ ] Reset mimics NYT (clear attempt, shuffle, full reset confirmed).
* [ ] IndexedDB stores saves, highscores; survives reload/offline.
* [ ] Netlify deploy green; SPA redirects work.
* [ ] A11y pass, basic tests.

---

## 19) Notes on “old NYT games” & alternatives

* To “play old puzzles”, provide a **date picker** that regenerates historical puzzles from our seed. This avoids copyrighted content and keeps everything offline/free.
* Free helper APIs (optional): Datamuse for hints/definitions; Wordnik for definitions (key required). Use network‑first caching and degrade gracefully offline.

---

## 20) Next steps

1. Scaffold repo with Vite + React + TS + Tailwind.
2. Add PWA plugin (or Workbox build step) + manifest.
3. Implement `core/db` and `games-registry`.
4. Implement Pangram wordlist, generator, logic, UI.
5. Ship MVP to Netlify, test on iPhone 17 Pro.

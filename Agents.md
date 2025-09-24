# Agent Guide – MyGames

This document is the single source of truth for collaborators (human or AI) who contribute to the MyGames Progressive Web App. Keep it concise, accurate, and updated as the project evolves.

---

## 1. Product vision
- Multi-game PWA focused on thoughtful, replayable word and puzzle games.
- Flagship experience is the Spelling-Bee-style **Pangram** clone; additional games plug into the same shell.
- Primary device is the **iPhone 17 Pro** (428×926 CSS points). Respect dynamic island safe areas and maintain 44×44 pt minimum touch targets.
- Desktop browsers must support keyboard input where it improves the experience.

## 2. Platform expectations
- Installable offline-capable PWA (manifest + service worker). Cache the shell and game bundles; keep game data in IndexedDB.
- State, highscores, and preferences persist locally; no third-party trackers by default.
- Home screen lists all registered games, each launching in-app without page reloads.

## 3. Tech stack & tooling
- **Framework**: React 18 + TypeScript via Vite.
- **Styling**: Tailwind CSS with CSS variables for theming.
- **UI kit**: Radix UI primitives (via shadcn-style components) and lucide-react icons.
- **Routing**: React Router with lazy-loaded game modules.
- **State**: Zustand for global app state; games manage their own state inside saves.
- **Data**: IndexedDB via `idb` helpers in `src/core/db`.
- **Testing**: Vitest + React Testing Library; add Playwright smoke tests for critical flows when possible.
- **Linting**: ESLint (run `pnpm lint` / `npm run lint`).
- **Build & deploy**: Vite build output deployed on Netlify with `_redirects` configured for SPA routing.

## 4. Repository layout snapshot
```
/
├─ public/                 # Static assets, manifest, icons
├─ src/
│  ├─ app/                 # Shell app, routing, device helpers, global store
│  ├─ components/          # Shared UI components
│  ├─ core/                # Game contracts, registry, database helpers
│  ├─ games/               # Individual game modules (e.g., pangram)
│  ├─ ai/                  # Authoring guidance for automated contributors
│  └─ main.tsx             # App bootstrap
├─ scripts/                # Build / tooling scripts
├─ package.json            # Scripts + dependencies
└─ netlify.toml            # Deployment config
```
Keep this tree updated if major directories change.

## 5. Game module contract
- Every game lives in `src/games/<game-id>/` and exports a default `GameModule` from `index.ts`.
- `GameModule` requirements are defined in `src/core/game-types.ts` (metadata, `mount`, `getInitialSave`, optional reducer/routes).
- Include a README describing gameplay, controls, save schema, and difficulty logic.
- Assets stay inside the game folder; do not import across games.
- Register new games by updating `src/core/games-registry.ts`.

## 6. UX & accessibility guidelines
- Layouts must adapt smoothly between 428×926 portrait (iPhone 17 Pro) and wider desktop breakpoints.
- Honor prefers-reduced-motion, provide haptic/animation toggles where applicable, and ensure keyboard support for desktop users.
- Provide descriptive ARIA labels, logical focus order, and maintain contrast ratios ≥ 4.5:1 for text.
- Include undo/reset affordances consistent with game genre expectations.

## 7. PWA & performance checklist
- Ensure manifest icons and metadata stay current.
- Audit bundle sizes; lazy-load game logic and heavy assets.
- Use Workbox (or Vite PWA plugin) to precache shell assets and provide runtime caching for API/wordlist fetches.
- Monitor IndexedDB usage and add migrations when breaking save changes.

## 8. Development workflow
1. Branch from the latest `main` (no long-lived feature branches for agents).
2. Run linting (`npm run lint`) and tests (`npm run test`) before committing.
3. Keep commits scoped and well-described; avoid rewriting history.
4. Update documentation when behavior or contracts change.
5. When adding UI, validate on iPhone 17 Pro viewport and take screenshots if requested.

## 9. Roadmap highlights
- Maintain and polish Pangram experience (daily seeds, hints, streaks).
- Add additional mini-games (e.g., crossword, logic puzzles) using the shared module contract.
- Expand analytics, accessibility audits, and offline resilience over time.

---

Questions or inconsistencies? Document them here first, then create follow-up issues.

# WPA Games

A Progressive Web App shell that discovers and launches modular mini-games. The initial release focuses on the **Pangram** honeycomb word puzzle, with infrastructure ready for AI agents or humans to drop additional games into the `src/games/` directory without touching the shell UI.

## Features

- React + TypeScript + Vite + Tailwind CSS for a fast, modern frontend stack.
- Game registry system that auto-discovers modules via dynamic imports.
- Offline-first persistence backed by IndexedDB (`idb`) with typed helpers.
- Installable PWA experience (service worker + manifest) tuned for iPhone safe areas.
- Pangram game with deterministic daily generator, hint cadence, scoring, and autosave.
- Settings store powered by Zustand for theme/haptics toggles (extendable).
- Netlify-ready configuration (`netlify.toml`, `_redirects`) for zero-config deploys.

## Getting started

```bash
npm install
npm run dev
```

The shell listens on the standard Vite dev server port. The Pangram game appears immediately; adding another game only requires creating `src/games/<new-game>/index.ts` that exports a `GameModule` and ensuring its assets live alongside it.

Useful scripts:

- `npm run dev` – Vite dev server with hot module reload.
- `npm run build` – Production build (outputs to `dist/`).
- `npm run preview` – Preview the production build locally.
- `npm run test` – Placeholder for Vitest suites (add tests under `src/`).
- `npm run lint` – ESLint pass (config to be extended).

## Project layout

```
public/               Static assets, manifest, service worker
src/app/              App shell components, routing, PWA helpers
src/components/       Reusable UI primitives
src/core/             Game contracts, registry, IndexedDB wrappers, utilities
src/games/pangram/    Pangram module (logic, generator, UI, word list)
src/ai/               Authoring guide for automated agents
```

## PWA notes

- `site.webmanifest` declares icons and theme color; safe area padding uses `env(safe-area-inset-*)`.
- `public/sw.js` precaches the app shell and applies stale-while-revalidate for static assets.
- `registerServiceWorker()` is invoked from `src/main.tsx` outside dev builds.
- Netlify headers disable caching for `index.html`/`sw.js` and enable immutable caching for hashed assets.

## Adding games

See [`src/ai/CONTRIBUTING-GAMES.md`](src/ai/CONTRIBUTING-GAMES.md) for the full module contract. In short:

1. Create `src/games/<game-id>/` with an `index.ts` exporting `GameModule` metadata, lazy `mount`, and a `getInitialSave` implementation.
2. Add a README describing controls and save schema.
3. Drop any art into `assets/` and reference via `new URL(..., import.meta.url)`.
4. Bundler auto-discovers modules via `import.meta.glob`, so no shell edits are required once your folder is in place.

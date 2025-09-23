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

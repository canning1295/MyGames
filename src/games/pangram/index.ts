import { lazy } from "react";
import type { GameModule } from "@/core/game-types";
import { buildPuzzle } from "./generator";
import { createInitialSave, SAVE_VERSION } from "./state";

const COVER = new URL("./assets/cover.svg", import.meta.url).toString();
const GAME_ID = "pangram";

const module: GameModule = {
  meta: {
    id: GAME_ID,
    title: "Pangram",
    description: "Find every word using the honeycomb letters",
    cover: COVER,
    tags: ["word", "daily", "offline"]
  },
  mount: lazy(() => import("./PangramGame")),
  getInitialSave: ({ date } = {}) => {
    const seed = date ?? new Date().toISOString().slice(0, 10);
    const puzzle = buildPuzzle(seed);
    return createInitialSave(puzzle);
  }
};

export default module;
export { GAME_ID, SAVE_VERSION };

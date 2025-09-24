import { lazy } from "react";
import type { GameModule } from "@/core/game-types";

const COVER = new URL("./assets/cover.svg", import.meta.url).toString();
const GAME_ID = "mini-crossword";

const module: GameModule = {
  meta: {
    id: GAME_ID,
    title: "Mini Crossword",
    description: "Fill the 5×5 word square by solving across and down clues",
    cover: COVER,
    tags: ["word", "daily", "puzzle"]
  },
  mount: lazy(() => import("./MiniCrosswordGame")),
  getInitialSave: () => ({
    version: 1,
    lastPlayedISO: new Date().toISOString(),
    state: {}
  })
};

export default module;
export { GAME_ID };

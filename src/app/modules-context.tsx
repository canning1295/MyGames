import { createContext, useContext } from "react";
import type { GameModule } from "@/core/game-types";

const GameModulesContext = createContext<GameModule[] | null>(null);

export function useGameModules(): GameModule[] {
  const ctx = useContext(GameModulesContext);
  if (!ctx) {
    throw new Error("GameModulesContext missing. Wrap component tree in <GameModulesProvider>.");
  }
  return ctx;
}

interface ProviderProps {
  readonly modules: GameModule[];
  readonly children: React.ReactNode;
}

export function GameModulesProvider({ modules, children }: ProviderProps) {
  return <GameModulesContext.Provider value={modules}>{children}</GameModulesContext.Provider>;
}

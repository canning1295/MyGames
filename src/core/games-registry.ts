import type { GameId, GameModule } from "./game-types";

export type GameModuleLoader = () => Promise<GameModule>;

const moduleImports = import.meta.glob<{ default: GameModule }>("../games/*/index.ts");

const registry: GameModuleLoader[] = Object.values(moduleImports).map((importer) => async () => {
  const mod = await importer();
  return mod.default;
});

export async function loadAllModules(): Promise<GameModule[]> {
  const modules = await Promise.all(registry.map((loader) => loader()));
  modules.sort((a, b) => a.meta.title.localeCompare(b.meta.title));
  return modules;
}

export async function loadModuleById(id: GameId): Promise<GameModule | undefined> {
  for (const loader of registry) {
    const module = await loader();
    if (module.meta.id === id) {
      return module;
    }
  }
  return undefined;
}

export function getModuleLoaders(): GameModuleLoader[] {
  return [...registry];
}

import { useEffect, useMemo, useState, Suspense } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import type { GameModule } from "@/core/game-types";
import { loadAllModules } from "@/core/games-registry";
import { GameModulesProvider } from "./modules-context";
import Home from "./Home";
import Settings from "./Settings";
import SplashScreen from "./SplashScreen";
import { useThemeSync } from "./useThemeSync";
import { useSettingsStore } from "./store/settings";

function buildRouter(modules: GameModule[]) {
  return createBrowserRouter([
    { path: "/", element: <Home /> },
    { path: "/settings", element: <Settings /> },
    ...modules.map((module) => ({
      path: `/${module.meta.id}/*`,
      element: (
        <Suspense fallback={<SplashScreen message={`Loading ${module.meta.title}`} />}>
          <module.mount />
        </Suspense>
      ),
      children: module.routes?.map((route) => ({ ...route })) ?? []
    }))
  ]);
}

export default function App() {
  useThemeSync();
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const [modules, setModules] = useState<GameModule[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    void hydrateSettings();
  }, [hydrateSettings]);

  useEffect(() => {
    let cancelled = false;
    loadAllModules()
      .then((resolved) => {
        if (!cancelled) {
          setModules(resolved);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to load games"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const router = useMemo(() => {
    if (!modules) {
      return null;
    }
    return buildRouter(modules);
  }, [modules]);

  if (error) {
    return <SplashScreen message={error.message} />;
  }

  if (!router) {
    return <SplashScreen message="Loading games" />;
  }

  return (
    <GameModulesProvider modules={modules}>
      <RouterProvider router={router} />
    </GameModulesProvider>
  );
}

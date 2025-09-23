import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameModules } from "./modules-context";
import GameCard from "@/components/GameCard";
import Grid from "@/components/Grid";

export default function Home() {
  const modules = useGameModules();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredModules = useMemo(() => {
    if (!normalizedQuery) return modules;
    return modules.filter((module) => {
      const { title, description, tags = [] } = module.meta;
      const haystack = [title, description, ...tags].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [modules, normalizedQuery]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <header className="sticky top-0 z-10 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold">WPA Games</h1>
            <p className="text-sm text-foreground/70">Offline-friendly mini games</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <input
              type="search"
              placeholder="Search games"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-40 rounded-md border border-foreground/20 bg-background/60 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
            />
            <button
              type="button"
              className="rounded-md border border-foreground/20 px-3 py-2 text-sm"
              onClick={() => navigate("/settings")}
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
        {filteredModules.length === 0 ? (
          <p className="text-center text-sm text-foreground/70">No games match your search yet. Try a different keyword.</p>
        ) : (
          <Grid>
            {filteredModules.map((module) => (
              <GameCard
                key={module.meta.id}
                metadata={module.meta}
                onLaunch={() => navigate(`/${module.meta.id}`)}
              />
            ))}
          </Grid>
        )}
      </main>
    </div>
  );
}

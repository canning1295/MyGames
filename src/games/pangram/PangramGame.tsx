import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import clsx from "clsx";
import HintButton from "@/components/HintButton";
import { triggerHaptic } from "@/app/device/haptics";
import { useSettingsStore } from "@/app/store/settings";
import { getHighScore, getSave, putSave, recordScore } from "@/core/db/repo";
import { GAME_ID } from "./index";
import { buildPuzzle } from "./generator";
import { advanceHint, getRank, isPangramWord, isValidWord, normalizeWord, scoreWord } from "./logic";
import type { PangramGameSave, PangramPuzzle } from "./types";
import { createInitialSave, createInitialState, ensureStateForPuzzle } from "./state";

interface StatusMessage {
  type: "info" | "success" | "error" | "hint";
  text: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function useSeedDate(): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const param = params.get("date");
  const active = param && DATE_PATTERN.test(param) ? param : today;

  const update = useCallback(
    (value: string) => {
      if (DATE_PATTERN.test(value)) {
        setParams({ date: value });
      }
    },
    [setParams]
  );

  return [active, update];
}

export default function PangramGame() {
  const navigate = useNavigate();
  const [seed, setSeed] = useSeedDate();
  const [puzzle, setPuzzle] = useState<PangramPuzzle | null>(null);
  const [save, setSave] = useState<PangramGameSave | null>(null);
  const [attempt, setAttempt] = useState("");
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const hapticsEnabled = useSettingsStore((state) => state.haptics);
  const [highScore, setHighScore] = useState<number | null>(null);

  // Regenerate puzzle when seed changes
  useEffect(() => {
    try {
      setPuzzle(buildPuzzle(seed));
      setStatus(null);
    } catch (error) {
      console.error(error);
      setPuzzle(null);
      setStatus({ type: "error", text: "Could not build today's puzzle." });
    }
  }, [seed]);

  // Load save and highscores when puzzle changes
  useEffect(() => {
    if (!puzzle) return;
    let cancelled = false;

    async function load() {
      const stored = (await getSave(GAME_ID)) as PangramGameSave | undefined;
      const resolved = stored ? ensureStateForPuzzle(stored, puzzle) : createInitialSave(puzzle);
      const existingHighScore = await getHighScore(GAME_ID);

      if (!cancelled) {
        setSave(resolved);
        setHighScore(existingHighScore?.score ?? null);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [puzzle]);

  // Persist save with debounce
  useEffect(() => {
    if (!save) return;
    const timer = window.setTimeout(() => {
      void putSave(GAME_ID, save);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [save]);

  useEffect(() => {
    if (status?.type !== "error") return;
    const timeout = window.setTimeout(() => setStatus(null), 1500);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const baseOuterLetters = useMemo(() => {
    if (!puzzle) return [] as string[];
    return puzzle.letters.filter((letter) => letter !== puzzle.center);
  }, [puzzle]);

  const displayOuterLetters = useMemo(() => {
    if (!save) return baseOuterLetters;
    const preserved = save.state.outerOrder.filter((letter) => baseOuterLetters.includes(letter));
    const missing = baseOuterLetters.filter((letter) => !preserved.includes(letter));
    return [...preserved, ...missing];
  }, [save, baseOuterLetters]);

  const rank = useMemo(() => {
    if (!puzzle || !save) return null;
    return getRank(save.state.score, puzzle.totalPoints);
  }, [puzzle, save]);

  const handleAppend = useCallback((letter: string) => {
    setAttempt((prev) => `${prev}${letter}`);
  }, []);

  const handleDelete = useCallback(() => {
    setAttempt((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setAttempt("");
  }, []);

  const handleShuffle = useCallback(() => {
    if (!save || baseOuterLetters.length === 0) return;
    setSave((current) => {
      if (!current) return current;
      const nextOuter = [...displayOuterLetters];
      for (let i = nextOuter.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [nextOuter[i], nextOuter[j]] = [nextOuter[j], nextOuter[i]];
      }
      return {
        ...current,
        state: {
          ...current.state,
          outerOrder: nextOuter
        }
      };
    });
  }, [save, displayOuterLetters, baseOuterLetters.length]);

  const updateSaveState = useCallback((mutator: (state: PangramGameSave) => PangramGameSave) => {
    setSave((current) => (current ? mutator(current) : current));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!save || !puzzle) return;
    const normalized = normalizeWord(attempt);
    if (normalized.length === 0) return;

    if (save.state.found.includes(normalized)) {
      setStatus({ type: "error", text: "You already found that word." });
      triggerHaptic("error", hapticsEnabled);
      setAttempt(""); // Clear guess on duplicate
      return;
    }

    if (!isValidWord(normalized, puzzle)) {
      setStatus({ type: "error", text: "Not in today's word list." });
      triggerHaptic("error", hapticsEnabled);
      setAttempt(""); // Clear guess on invalid word
      return;
    }

    const wordScore = scoreWord(normalized, puzzle.letters);
    const isPangram = isPangramWord(normalized, puzzle.letters);
    let appliedScore = save.state.score;

    updateSaveState((current) => {
      const previous = current.state;
      const nextScore = previous.score + wordScore;
      appliedScore = nextScore;
      const found = [...previous.found, normalized].sort();
      const nextState = {
        ...previous,
        found,
        score: nextScore,
        hintTargetWord:
          previous.hintTargetWord && previous.hintTargetWord === normalized
            ? null
            : previous.hintTargetWord,
        hintLettersRevealed:
          previous.hintTargetWord && previous.hintTargetWord === normalized
            ? 0
            : previous.hintLettersRevealed
      };
      return {
        ...current,
        lastPlayedISO: new Date().toISOString(),
        highScore: Math.max(current.highScore ?? 0, nextScore),
        state: nextState
      };
    });

    setAttempt("");
    setStatus({ type: isPangram ? "success" : "info", text: isPangram ? `Pangram! +${wordScore} points.` : `+${wordScore} points.` });
    triggerHaptic(isPangram ? "success" : "light", hapticsEnabled);
    setHighScore((prev) => (prev !== null ? Math.max(prev, appliedScore) : appliedScore));
    void recordScore(GAME_ID, appliedScore);
  }, [attempt, save, puzzle, updateSaveState, hapticsEnabled]);

  const handleHint = useCallback(() => {
    if (!save || !puzzle) return;
    const { nextState, hint: nextHint } = advanceHint(save.state, puzzle);
    updateSaveState((current) => ({
      ...current,
      state: nextState
    }));
    switch (nextHint.type) {
      case "count":
        setStatus({ type: "hint", text: `${nextHint.count} pangram${nextHint.count === 1 ? "" : "s"} today.` });
        break;
      case "letters":
        setStatus({ type: "hint", text: `Pangram starts with ${nextHint.letters}` });
        break;
      case "done":
        setStatus({ type: "hint", text: "All pangrams found!" });
        break;
      default:
        break;
    }
  }, [save, puzzle, updateSaveState]);

  const handleReset = useCallback(() => {
    if (!puzzle || !save) return;
    const confirmReset = window.confirm("Reset today's progress?");
    if (!confirmReset) return;

    setSave((current) => {
      if (!current) return current;
      const preservedOuter = current.state.outerOrder;
      const baseState = createInitialState(puzzle);
      return {
        ...current,
        lastPlayedISO: new Date().toISOString(),
        state: {
          ...baseState,
          outerOrder: preservedOuter
        }
      } as PangramGameSave;
    });

    setAttempt("");
    setStatus({ type: "info", text: "Puzzle reset." });
  }, [puzzle, save]);

  const handleGoHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleCloseStatus = useCallback(() => {
    setStatus(null);
  }, []);

  useEffect(() => {
    if (!puzzle) return;

    function handleKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const key = event.key;
      if (key === 'Enter') {
        event.preventDefault();
        handleSubmit();
        return;
      }
      if (key === 'Backspace') {
        event.preventDefault();
        handleDelete();
        return;
      }
      if (key === 'Escape') {
        event.preventDefault();
        handleClear();
        return;
      }
      const letter = key.toUpperCase();
      if (puzzle.letters.includes(letter)) {
        event.preventDefault();
        handleAppend(letter);
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [puzzle, handleAppend, handleDelete, handleClear, handleSubmit]);

  const handleNewDate = useCallback(
    (value: string) => {
      setSeed(value);
    },
    [setSeed]
  );

  const totalFound = save?.state.found.length ?? 0;
  const totalWords = puzzle?.solutions.length ?? 0;
  const pangramsFound = puzzle ? save?.state.found.filter((word) => puzzle.pangrams.includes(word)).length ?? 0 : 0;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGoHome}
                className="rounded-full p-2 hover:bg-foreground/10 transition-colors"
                aria-label="Go to home"
              >
                ←
              </button>
              <h1 className="text-2xl font-semibold">Pangram</h1>
            </div>
            <input
              type="date"
              value={seed}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => handleNewDate(event.target.value)}
              className="rounded-md border border-foreground/20 bg-background/60 px-3 py-2 text-sm"
            />
          </div>
          {rank && (
            <div className="flex items-center justify-between text-sm text-foreground/80">
              <span>Rank: {rank.name}</span>
              <span>
                Score {save?.state.score ?? 0}/{puzzle?.totalPoints ?? 0} ({Math.floor((rank.percent ?? 0) * 100)}%)
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-foreground/60">
            <span>
              Words {totalFound}/{totalWords}
            </span>
            <span>Pangrams {pangramsFound}/{puzzle?.pangrams.length ?? 0}</span>
            <span>High score {highScore ?? save?.state.score ?? 0}</span>
          </div>
        </header>

        {status && (
          <div
            className={clsx(
              "relative rounded-md px-3 py-2 text-sm pr-10",
              status.type === "error" && "bg-red-500/20 text-red-200",
              status.type === "success" && "bg-emerald-500/20 text-emerald-200",
              status.type === "info" && "bg-foreground/10",
              status.type === "hint" && "bg-yellow-500/20 text-yellow-100"
            )}
          >
            {status.text}
            <button
              type="button"
              onClick={handleCloseStatus}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-white/20 focus:bg-white/20 focus:outline-none transition-colors"
              aria-label="Close message"
            >
              ✕
            </button>
          </div>
        )}

        <section className="flex justify-center">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 68px)", gridTemplateRows: "repeat(3, 60px)" }}>
            <button
              type="button"
              className="col-start-2 row-start-2 flex items-center justify-center rounded-full border border-accent/40 bg-accent text-background text-xl font-semibold hover:bg-accent/90 active:scale-95 transition-all"
              onClick={() => handleAppend(puzzle?.center ?? "")}
            >
              {puzzle?.center ?? ""}
            </button>
            {displayOuterLetters.map((letter, index) => (
              <button
                key={letter}
                type="button"
                className={clsx(
                  "flex items-center justify-center rounded-full border border-foreground/20 bg-foreground/10 text-lg font-semibold hover:bg-foreground/20 active:scale-95 transition-all",
                  index === 0 && "col-start-1 row-start-1",
                  index === 1 && "col-start-3 row-start-1",
                  index === 2 && "col-start-1 row-start-2",
                  index === 3 && "col-start-3 row-start-2",
                  index === 4 && "col-start-1 row-start-3",
                  index === 5 && "col-start-3 row-start-3"
                )}
                onClick={() => handleAppend(letter)}
              >
                {letter}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-foreground/20 bg-foreground/5 px-3 py-3 text-lg tracking-[0.2em] min-h-[3rem] flex items-center">
              {attempt || <span className="text-foreground/40">Enter letters...</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button 
              type="button" 
              onClick={handleSubmit} 
              disabled={!attempt}
              className="flex-1 min-w-[100px] rounded-md bg-accent px-3 py-2 text-sm font-semibold text-background hover:bg-accent/90 disabled:bg-foreground/20 disabled:text-foreground/50 transition-colors"
            >
              Submit
            </button>
            <button 
              type="button" 
              onClick={handleDelete} 
              className="rounded-md border border-foreground/20 px-3 py-2 text-sm hover:bg-foreground/10 transition-colors"
            >
              Delete
            </button>
            <button 
              type="button" 
              onClick={handleClear} 
              className="rounded-md border border-foreground/20 px-3 py-2 text-sm hover:bg-foreground/10 transition-colors"
            >
              Clear
            </button>
            <button 
              type="button" 
              onClick={handleShuffle} 
              className="rounded-md border border-foreground/20 px-3 py-2 text-sm hover:bg-foreground/10 transition-colors"
            >
              Shuffle
            </button>
            <button 
              type="button" 
              onClick={handleReset} 
              className="rounded-md border border-foreground/20 px-3 py-2 text-sm hover:bg-foreground/10 transition-colors"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="flex-1 overflow-y-auto rounded-md border border-foreground/10 bg-foreground/5 p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/70">Found words</h2>
          {save && save.state.found.length > 0 ? (
            <ul className="grid grid-cols-2 gap-1 text-sm text-foreground/80">
              {save.state.found.map((word) => (
                <li key={word} className="py-1 px-2 rounded bg-foreground/5">
                  {word}
                  {puzzle?.pangrams.includes(word) && (
                    <span className="ml-2 text-xs text-yellow-400">★</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground/60">Find words of four letters or more that include the center letter.</p>
          )}
        </section>
      </div>

      <HintButton onPress={handleHint} />
    </div>
  );
}
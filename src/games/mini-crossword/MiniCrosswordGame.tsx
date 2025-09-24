import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import type { CrosswordEntry, CrosswordDirection } from "./puzzle";
import { MINI_CROSSWORD } from "./puzzle";

interface CellPosition {
  readonly row: number;
  readonly col: number;
}

const { grid, across, down, title, author, size } = MINI_CROSSWORD;

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

function findEntryForCell(
  entries: readonly CrosswordEntry[],
  position: CellPosition
): CrosswordEntry | undefined {
  return entries.find((entry) => {
    if (entry.direction === "across") {
      return (
        entry.row === position.row &&
        position.col >= entry.col &&
        position.col < entry.col + entry.answer.length
      );
    }
    return (
      entry.col === position.col &&
      position.row >= entry.row &&
      position.row < entry.row + entry.answer.length
    );
  });
}

function getOffsetForDirection(direction: CrosswordDirection, delta: number) {
  return direction === "across" ? { row: 0, col: delta } : { row: delta, col: 0 };
}

function moveToNextCell(
  start: CellPosition,
  direction: CrosswordDirection,
  delta: 1 | -1
): CellPosition | null {
  let { row, col } = start;
  for (let step = 0; step < size; step += 1) {
    const offset = getOffsetForDirection(direction, delta);
    row += offset.row;
    col += offset.col;
    if (row < 0 || row >= size || col < 0 || col >= size) {
      return null;
    }
    const candidate = grid[row][col];
    if (!candidate.isBlock) {
      return { row, col };
    }
  }
  return null;
}

function buildCellNumberMap() {
  const map = new Map<string, number>();
  for (const entry of [...across, ...down]) {
    const key = cellKey(entry.row, entry.col);
    if (!map.has(key)) {
      map.set(key, entry.number);
    }
  }
  return map;
}

function buildClueLookup() {
  const map = new Map<string, { across?: CrosswordEntry; down?: CrosswordEntry }>();
  for (const entry of across) {
    map.set(cellKey(entry.row, entry.col), { across: entry });
  }
  for (const entry of down) {
    const key = cellKey(entry.row, entry.col);
    const existing = map.get(key) ?? {};
    map.set(key, { ...existing, down: entry });
  }
  return map;
}

const cellNumbers = buildCellNumberMap();
const clueLookup = buildClueLookup();

export default function MiniCrosswordGame() {
  const navigate = useNavigate();
  const [direction, setDirection] = useState<CrosswordDirection>("across");
  const [activeCell, setActiveCell] = useState<CellPosition>({ row: 0, col: 0 });
  const [letters, setLetters] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const row of grid) {
      for (const cell of row) {
        if (!cell.isBlock) {
          initial[cellKey(cell.row, cell.col)] = "";
        }
      }
    }
    return initial;
  });

  const cellRefs = useRef(new Map<string, HTMLButtonElement>());

  const registerCellRef = useCallback((position: CellPosition) => (node: HTMLButtonElement | null) => {
    const key = cellKey(position.row, position.col);
    if (node) {
      cellRefs.current.set(key, node);
    } else {
      cellRefs.current.delete(key);
    }
  }, []);

  useEffect(() => {
    const key = cellKey(activeCell.row, activeCell.col);
    const element = cellRefs.current.get(key);
    element?.focus();
  }, [activeCell]);

  const activeEntry = useMemo(() => {
    return findEntryForCell(direction === "across" ? across : down, activeCell) ?? null;
  }, [activeCell, direction]);

  const highlightedCells = useMemo(() => {
    if (!activeEntry) {
      return new Set<string>();
    }
    const keys = new Set<string>();
    for (let index = 0; index < activeEntry.answer.length; index += 1) {
      const row =
        activeEntry.direction === "across"
          ? activeEntry.row
          : activeEntry.row + index;
      const col =
        activeEntry.direction === "across"
          ? activeEntry.col + index
          : activeEntry.col;
      keys.add(cellKey(row, col));
    }
    return keys;
  }, [activeEntry]);

  const isSolved = useMemo(() => {
    for (const row of grid) {
      for (const cell of row) {
        if (cell.isBlock) continue;
        const key = cellKey(cell.row, cell.col);
        if ((letters[key] ?? "").toUpperCase() !== cell.solution) {
          return false;
        }
      }
    }
    return true;
  }, [letters]);

  const filledCount = useMemo(() => {
    return Object.values(letters).filter(Boolean).length;
  }, [letters]);

  const totalCells = grid.flat().filter((cell) => !cell.isBlock).length;

  const toggleDirection = useCallback(() => {
    setDirection((prev) => (prev === "across" ? "down" : "across"));
  }, []);

  const jumpToEntry = useCallback((entry: CrosswordEntry) => {
    setDirection(entry.direction);
    setActiveCell({ row: entry.row, col: entry.col });
  }, []);

  const handleCellKeyDown = useCallback(
    (position: CellPosition) => (event: KeyboardEvent<HTMLButtonElement>) => {
      const key = event.key;
      if (key === "ArrowRight") {
        event.preventDefault();
        const next = moveToNextCell(position, "across", 1);
        if (next) {
          setDirection("across");
          setActiveCell(next);
        }
        return;
      }
      if (key === "ArrowLeft") {
        event.preventDefault();
        const next = moveToNextCell(position, "across", -1);
        if (next) {
          setDirection("across");
          setActiveCell(next);
        }
        return;
      }
      if (key === "ArrowDown") {
        event.preventDefault();
        const next = moveToNextCell(position, "down", 1);
        if (next) {
          setDirection("down");
          setActiveCell(next);
        }
        return;
      }
      if (key === "ArrowUp") {
        event.preventDefault();
        const next = moveToNextCell(position, "down", -1);
        if (next) {
          setDirection("down");
          setActiveCell(next);
        }
        return;
      }
      if (key === " " || key === "Enter") {
        event.preventDefault();
        toggleDirection();
        return;
      }
      if (key === "Backspace") {
        event.preventDefault();
        const currentKey = cellKey(position.row, position.col);
        if (letters[currentKey]) {
          setLetters((prev) => ({ ...prev, [currentKey]: "" }));
          return;
        }
        const previous = moveToNextCell(position, direction, -1);
        if (previous) {
          const prevKey = cellKey(previous.row, previous.col);
          setLetters((prev) => ({ ...prev, [prevKey]: "" }));
          setActiveCell(previous);
        }
        return;
      }
      if (/^[a-zA-Z]$/.test(key)) {
        event.preventDefault();
        const letter = key.toUpperCase();
        const currentKey = cellKey(position.row, position.col);
        setLetters((prev) => ({ ...prev, [currentKey]: letter }));
        const next = moveToNextCell(position, direction, 1);
        if (next) {
          setActiveCell(next);
        }
        return;
      }
    },
    [direction, letters, toggleDirection]
  );

  const resetPuzzle = useCallback(() => {
    setLetters((prev) => {
      const cleared: Record<string, string> = {};
      for (const key of Object.keys(prev)) {
        cleared[key] = "";
      }
      return cleared;
    });
    setActiveCell({ row: 0, col: 0 });
    setDirection("across");
  }, []);

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-background text-foreground"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <header className="sticky top-0 z-10 border-b border-foreground/10 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-md border border-foreground/20 px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            Back to games
          </button>
          <div className="flex flex-col text-left">
            <span className="text-sm uppercase tracking-wide text-foreground/70">Mini Crossword</span>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            <span className="text-xs text-foreground/60">By {author}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-foreground/70">
            <span>
              {filledCount}/{totalCells} letters
            </span>
            <span aria-hidden="true">•</span>
            <button
              type="button"
              onClick={resetPuzzle}
              className="rounded-full border border-foreground/20 px-2 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
        <div className="flex flex-1 flex-col gap-6 lg:flex-row">
          <div className="flex justify-center">
            <div
              role="grid"
              aria-label="Mini crossword grid"
              className="grid select-none border border-foreground/20"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {grid.map((rowCells) =>
                rowCells.map((cell) => {
                  const key = cellKey(cell.row, cell.col);
                  const value = letters[key] ?? "";
                  const number = cellNumbers.get(key);
                  const isActive = activeCell.row === cell.row && activeCell.col === cell.col;
                  const isHighlighted = highlightedCells.has(key);
                  const isCorrect = value && value.toUpperCase() === cell.solution;
                  const clues = clueLookup.get(key);
                  const ariaLabelParts: string[] = [];
                  if (number) {
                    if (clues?.across) {
                      ariaLabelParts.push(`Across ${clues.across.number}: ${clues.across.clue}`);
                    }
                    if (clues?.down) {
                      ariaLabelParts.push(`Down ${clues.down.number}: ${clues.down.clue}`);
                    }
                  }
                  const ariaLabel = ariaLabelParts.join(". ");

                  return (
                    <button
                      key={key}
                      ref={registerCellRef(cell)}
                      type="button"
                      role="gridcell"
                      aria-selected={isActive}
                      aria-label={ariaLabel || `Row ${cell.row + 1}, column ${cell.col + 1}`}
                      tabIndex={isActive ? 0 : -1}
                      className={clsx(
                        "relative flex h-14 w-14 items-center justify-center border border-foreground/20 text-2xl font-semibold uppercase outline-none transition",
                        isHighlighted && "bg-accent/20",
                        isActive && "ring-2 ring-accent",
                        isSolved && isCorrect && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-200"
                      )}
                      onClick={() => {
                        setActiveCell({ row: cell.row, col: cell.col });
                      }}
                      onFocus={() => {
                        setActiveCell({ row: cell.row, col: cell.col });
                      }}
                      onKeyDown={handleCellKeyDown({ row: cell.row, col: cell.col })}
                    >
                      {number ? (
                        <span className="absolute left-1 top-1 text-[0.6rem] font-medium text-foreground/60">{number}</span>
                      ) : null}
                      <span>{value}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-6">
            <ClueSection
              title="Across"
              entries={across}
              activeEntry={activeEntry?.direction === "across" ? activeEntry : null}
              letters={letters}
              onSelect={jumpToEntry}
            />
            <ClueSection
              title="Down"
              entries={down}
              activeEntry={activeEntry?.direction === "down" ? activeEntry : null}
              letters={letters}
              onSelect={jumpToEntry}
            />
          </div>
        </div>
        <div
          className={clsx(
            "rounded-lg border border-foreground/10 px-4 py-3 text-sm",
            isSolved ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-200" : "bg-background/60 text-foreground/70"
          )}
        >
          {isSolved ? "Nice work! You completed the mini crossword." : "Type letters to fill the grid. Use arrow keys to move and space to switch directions."}
        </div>
      </main>
    </div>
  );
}

interface ClueSectionProps {
  readonly title: string;
  readonly entries: readonly CrosswordEntry[];
  readonly activeEntry: CrosswordEntry | null;
  readonly letters: Record<string, string>;
  readonly onSelect: (entry: CrosswordEntry) => void;
}

function entryCells(entry: CrosswordEntry): CellPosition[] {
  const cells: CellPosition[] = [];
  for (let index = 0; index < entry.answer.length; index += 1) {
    if (entry.direction === "across") {
      cells.push({ row: entry.row, col: entry.col + index });
    } else {
      cells.push({ row: entry.row + index, col: entry.col });
    }
  }
  return cells;
}

function entryIsComplete(entry: CrosswordEntry, letters: Record<string, string>) {
  return entryCells(entry).every((cell) => {
    const key = cellKey(cell.row, cell.col);
    const value = letters[key] ?? "";
    return value.length > 0;
  });
}

function ClueSection({ title, entries, activeEntry, letters, onSelect }: ClueSectionProps) {
  return (
    <section className="rounded-xl border border-foreground/10 bg-background/70 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/70">{title}</h2>
      <ol className="space-y-2 text-sm text-foreground/80">
        {entries.map((entry) => {
          const isActive = activeEntry?.number === entry.number;
          const isComplete = entryIsComplete(entry, letters);
          return (
            <li key={entry.number}>
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className={clsx(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                  isActive ? "bg-accent/20 text-accent" : "hover:bg-foreground/10",
                  isComplete && !isActive && "text-foreground"
                )}
              >
                <span className="text-xs font-semibold text-foreground/60">{entry.number}</span>
                <span className="flex-1">{entry.clue}</span>
                <span className="text-xs uppercase tracking-wide text-foreground/40">{entry.answer.length}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

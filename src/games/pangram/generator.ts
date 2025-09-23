import wordlist from "./wordlist.json";
import { scoreWord } from "./logic";
import type { PangramPuzzle } from "./types";

type RNG = () => number;

const MIN_SOLUTIONS = 20;

const pangramCandidates = wordlist.filter((word) => word.length >= 7 && new Set(word).size === 7);

function mulberry32(seed: number): RNG {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRng(seed: string): RNG {
  return mulberry32(hashSeed(seed));
}

function shuffle<T>(items: T[], rng: RNG): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function filterSolutions(letters: string[], center: string) {
  const allowed = new Set(letters);
  const solutions = wordlist.filter((word) => {
    if (word.length < 4) return false;
    if (!word.includes(center)) return false;
    for (const ch of word) {
      if (!allowed.has(ch)) return false;
    }
    return true;
  });
  const pangrams = solutions.filter((word) => letters.every((letter) => word.includes(letter)));
  const totalPoints = solutions.reduce((sum, word) => sum + scoreWord(word, letters), 0);
  return { solutions: solutions.sort(), pangrams: pangrams.sort(), totalPoints };
}

export function buildPuzzle(seedISO: string): PangramPuzzle {
  const seed = seedISO.slice(0, 10);
  const rng = seededRng(seed);
  const shuffledCandidates = shuffle(pangramCandidates, rng);

  for (const candidate of shuffledCandidates) {
    const uniqueLetters = Array.from(new Set(candidate));
    const centerCandidates = shuffle(uniqueLetters, rng);

    let bestConfig: { center: string; solutions: string[]; pangrams: string[]; totalPoints: number } | null = null;

    for (const center of centerCandidates) {
      const { solutions, pangrams, totalPoints } = filterSolutions(uniqueLetters, center);
      if (pangrams.length === 0 || solutions.length < MIN_SOLUTIONS) {
        continue;
      }
      if (!bestConfig || solutions.length > bestConfig.solutions.length) {
        bestConfig = { center, solutions, pangrams, totalPoints };
      }
    }

    if (bestConfig) {
      const { center, solutions, pangrams, totalPoints } = bestConfig;
      const letters = [center, ...uniqueLetters.filter((letter) => letter !== center)];
      return {
        id: seed,
        letters,
        center,
        solutions,
        pangrams,
        totalPoints
      };
    }
  }

  throw new Error(`Unable to generate Pangram puzzle for seed ${seed}`);
}

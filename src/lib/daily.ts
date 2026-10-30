import type { Athlete, Puzzle, PuzzleItem, Tier } from "./types";
import { ITEMS_PER_TIER, TIERS } from "./engine";
import { CLASSIC_MODE_ID, MODES, isClassic, levelMapFor, poolForMode, type ModeDef, type WomenBudget } from "./modes";

/** Puzzle #1 is this ET calendar date. */
export const LAUNCH_DATE_ET = "2026-10-30";
export const TIME_ZONE = "America/New_York";

const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD for the given instant in US Eastern time. */
export function etDateString(now: Date = new Date()): string {
  return fmt.format(now);
}

function utcDayNumber(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function puzzleNumberFor(dateET: string): number {
  return utcDayNumber(dateET) - utcDayNumber(LAUNCH_DATE_ET) + 1;
}

/** Milliseconds until the next ET midnight. */
export function msUntilNextPuzzle(now: Date = new Date()): number {
  const today = etDateString(now);
  let t = now.getTime();
  const step = 15 * 60_000;
  while (etDateString(new Date(t)) === today) t += step;
  let lo = t - step;
  let hi = t;
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2);
    if (etDateString(new Date(mid)) === today) lo = mid; else hi = mid;
  }
  return Math.max(0, hi - now.getTime());
}

/** FNV-1a 32-bit hash. */
export function seedFromString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface GeneratorOptions {
  perTier?: number;
  /** "classic": budget drawn 0/1/2 (1:2:1) and capped at 2. "none": no cap. */
  womenBudget?: WomenBudget;
  /** Difficulty level per athlete. Defaults to the cross-sport tier. */
  levelOf?: (a: Athlete) => Tier;
  /** Athlete ids that must not appear (recent days). */
  exclude?: Set<string>;
}

/**
 * Pick ITEMS_PER_TIER athletes per level, in level order 1 → 5. No school
 * appears twice in a day when avoidable.
 */
export function generateItems(pool: Athlete[], rng: Rng, opts: GeneratorOptions = {}): PuzzleItem[] {
  const perTier = opts.perTier ?? ITEMS_PER_TIER;
  const levelOf = opts.levelOf ?? ((a: Athlete) => a.tier);
  const roll = rng();
  const drawn = roll < 0.25 ? 0 : roll < 0.75 ? 1 : 2;
  const womenBudget = (opts.womenBudget ?? "classic") === "none" ? Infinity : drawn;

  const usedSchools = new Set<string>();
  const chosen: Array<{ athlete: Athlete; level: Tier }> = [];
  let women = 0;

  for (const level of TIERS) {
    const candidates = shuffle(
      pool.filter((a) => levelOf(a) === level && !opts.exclude?.has(a.id)),
      rng,
    );
    const picks: Athlete[] = [];
    const tryPick = (strict: boolean) => {
      for (const a of candidates) {
        if (picks.length >= perTier) break;
        if (picks.includes(a)) continue;
        if (a.gender === "f" && women >= womenBudget) continue;
        if (strict && a.schools.some((s) => usedSchools.has(s))) continue;
        picks.push(a);
        if (a.gender === "f") women++;
        a.schools.forEach((s) => usedSchools.add(s));
      }
    };
    tryPick(true);
    if (picks.length < perTier) tryPick(false);
    if (picks.length < perTier) {
      throw new Error(`Not enough level ${level} athletes in pool (need ${perTier}, have ${candidates.length})`);
    }
    chosen.push(...picks.map((athlete) => ({ athlete, level })));
  }

  return chosen.map(({ athlete, level }, position) => ({ athlete, tier: level, position }));
}

function optionsFor(mode: ModeDef, pool: Athlete[]): GeneratorOptions {
  const levels = levelMapFor(mode, pool);
  return { womenBudget: mode.womenBudget, levelOf: (a) => levels.get(a.id) ?? a.tier };
}

const CLASSIC = MODES[0];

export function dailyPuzzle(athletes: Athlete[], dateET: string, mode: ModeDef = CLASSIC): Puzzle {
  const pool = poolForMode(mode, athletes);
  // Classic keeps the original seed so puzzle history stays stable.
  const seedKey = isClassic(mode) ? `collegian-daily-${dateET}` : `collegian-daily-${mode.id}-${dateET}`;
  const rng = mulberry32(seedFromString(seedKey));
  return {
    id: `daily-${mode.id}-${dateET}`,
    kind: "daily",
    mode: mode.id,
    dateET,
    number: puzzleNumberFor(dateET),
    items: generateItems(pool, rng, optionsFor(mode, pool)),
  };
}

export function practicePuzzle(athletes: Athlete[], mode: ModeDef = CLASSIC, seed: number = Math.floor(Math.random() * 2 ** 31)): Puzzle {
  const pool = poolForMode(mode, athletes);
  const rng = mulberry32(seed);
  return {
    id: `practice-${mode.id}-${seed}`,
    kind: "practice",
    mode: mode.id,
    items: generateItems(pool, rng, optionsFor(mode, pool)),
  };
}

export { CLASSIC_MODE_ID };

import type { Athlete, Tier } from "./types";

export type WomenBudget = "classic" | "none";

export interface ModeDef {
  id: string;
  /** Full name, e.g. "Football". */
  name: string;
  /** Short label for chips and headers. */
  short: string;
  blurb: string;
  /** Sports included; null means every athlete (Classic). */
  sports: string[] | null;
  /** "classic": usually 0-1 women a day, capped at 2. "none": no cap. */
  womenBudget: WomenBudget;
}

export const CLASSIC_MODE_ID = "classic";

/** A sport mode needs at least this many athletes before it is offered. */
export const MIN_POOL = 45;

export const MODES: ModeDef[] = [
  { id: "classic", name: "Classic", short: "Classic", blurb: "Every sport. Starts with NFL and NBA stars and ends in Olympic deep cuts.", sports: null, womenBudget: "classic" },
  { id: "football", name: "Football", short: "Football", blurb: "NFL and college football only. The names get more niche with every level.", sports: ["Football"], womenBudget: "classic" },
  { id: "basketball", name: "Basketball", short: "Hoops", blurb: "NBA, WNBA and March Madness legends, from household names to deep cuts.", sports: ["Basketball"], womenBudget: "classic" },
  { id: "baseball", name: "Baseball", short: "Baseball", blurb: "MLB stars and legends who came up through college ball.", sports: ["Baseball"], womenBudget: "classic" },
  { id: "hockey", name: "Hockey", short: "Hockey", blurb: "NHL, PWHL and Miracle on Ice. Hockey is the most college-made pro sport.", sports: ["Hockey"], womenBudget: "classic" },
  { id: "soccer", name: "Soccer", short: "Soccer", blurb: "USMNT, USWNT, MLS and NWSL.", sports: ["Soccer"], womenBudget: "none" },
  { id: "golf", name: "Golf", short: "Golf", blurb: "PGA, LPGA and LIV. Nearly every pro golfer played college golf.", sports: ["Golf"], womenBudget: "classic" },
  { id: "track", name: "Track & Field", short: "Track", blurb: "Sprinters, distance runners, jumpers and throwers.", sports: ["Track & Field"], womenBudget: "none" },
  { id: "swimming", name: "Swimming & Diving", short: "Swim", blurb: "Olympic swimmers and divers, almost all college-made.", sports: ["Swimming", "Diving"], womenBudget: "none" },
  { id: "olympic", name: "Olympic & More", short: "Olympic", blurb: "Gymnastics, wrestling, tennis, lacrosse, volleyball, softball, fencing, water polo and more.", sports: ["Gymnastics", "Wrestling", "Tennis", "Lacrosse", "Volleyball", "Beach Volleyball", "Softball", "Fencing", "Water Polo", "Rugby", "Triathlon", "Bobsled", "Speed Skating", "Alpine Skiing", "Wheelchair Racing"], womenBudget: "none" },
];

export const MODE_BY_ID: Map<string, ModeDef> = new Map(MODES.map((m) => [m.id, m]));

export function isClassic(mode: ModeDef): boolean {
  return mode.id === CLASSIC_MODE_ID;
}

export function poolForMode(mode: ModeDef, athletes: Athlete[]): Athlete[] {
  if (!mode.sports) return athletes;
  const set = new Set(mode.sports);
  return athletes.filter((a) => set.has(a.sport));
}

/**
 * Level of each athlete in this mode. Classic uses the cross-sport tier as
 * is. Sport modes sort the pool by within-sport fame and cut it into five
 * equal buckets, so every level always has athletes and the ramp tightens
 * automatically as the pool grows.
 */
export function levelMapFor(mode: ModeDef, pool: Athlete[]): Map<string, Tier> {
  const map = new Map<string, Tier>();
  if (isClassic(mode)) {
    for (const a of pool) map.set(a.id, a.tier);
    return map;
  }
  const sorted = pool.slice().sort((a, b) => a.fame - b.fame || a.name.localeCompare(b.name));
  const n = sorted.length;
  sorted.forEach((a, i) => {
    map.set(a.id, (Math.min(4, Math.floor((i * 5) / Math.max(1, n))) + 1) as Tier);
  });
  return map;
}

export interface ModeStatus {
  available: boolean;
  size: number;
  perLevel: number[];
}

export function modeStatus(mode: ModeDef, athletes: Athlete[]): ModeStatus {
  const pool = poolForMode(mode, athletes);
  const levels = levelMapFor(mode, pool);
  const perLevel = [0, 0, 0, 0, 0];
  for (const a of pool) perLevel[(levels.get(a.id) ?? 1) - 1]++;
  const available = pool.length >= MIN_POOL && perLevel.every((c) => c >= 3);
  return { available, size: pool.length, perLevel };
}

export const TIER_NAMES: Record<number, string> = {
  1: "PRIME TIME",
  2: "PRO RANKS",
  3: "LEGENDS & PIONEERS",
  4: "OLYMPIC STAGE",
  5: "DEEP CUTS",
};

export const FAME_NAMES: Record<number, string> = {
  1: "HOUSEHOLD",
  2: "EVERY FAN",
  3: "REGULARS",
  4: "DIEHARDS",
  5: "DEEP CUTS",
};

export function levelName(mode: ModeDef, level: number): string {
  return (isClassic(mode) ? TIER_NAMES : FAME_NAMES)[level] ?? "";
}

export function levelLabel(mode: ModeDef, level: number): string {
  return `${isClassic(mode) ? "TIER" : "LEVEL"} ${level} · ${levelName(mode, level)}`;
}

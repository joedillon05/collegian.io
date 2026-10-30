import type { GameState } from "./engine";

const KEY_PREFIX = "collegian.";
const DAILY = (mode: string, date: string) => `${KEY_PREFIX}daily.${mode}.${date}`;
const LEGACY_DAILY = (date: string) => `${KEY_PREFIX}daily.${date}`;
const CLASSIC = "classic";
const HISTORY = `${KEY_PREFIX}history`;
const SETTINGS = `${KEY_PREFIX}settings`;

export interface HistoryEntry {
  /** Game mode id. Older entries without one are Classic. */
  mode: string;
  dateET: string;
  number: number;
  points: number;
  correct: number;
  maxStreak: number;
  stage: number;
  grade: string;
  gpa: number;
}

export interface Settings {
  sound: boolean;
  seenHelp: boolean;
}

const DEFAULT_SETTINGS: Settings = { sound: false, seenHelp: false };

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or quota: the game still works for this session */
  }
}

type LegacyPuzzle = GameState["puzzle"] & { kind?: string; mode: string };

export function loadDaily(mode: string, dateET: string): GameState | null {
  let s = read<GameState>(DAILY(mode, dateET));
  if (!s && mode === CLASSIC) {
    // Saves from before sport modes existed used a single key and `mode: "daily"`.
    const legacy = read<GameState>(LEGACY_DAILY(dateET));
    if (legacy) {
      const lp = legacy.puzzle as LegacyPuzzle;
      s = { ...legacy, puzzle: { ...lp, kind: lp.kind ?? "daily", mode: CLASSIC } as GameState["puzzle"] };
    }
  }
  if (!s || s.puzzle?.dateET !== dateET || s.puzzle.mode !== mode) return null;
  // Drop stale transient events; the UI re-derives everything else.
  return { ...s, events: [] };
}

export function saveDaily(state: GameState): void {
  if (state.puzzle.kind !== "daily" || !state.puzzle.dateET) return;
  write(DAILY(state.puzzle.mode, state.puzzle.dateET), { ...state, events: [] });
}

export function loadHistory(): HistoryEntry[] {
  return (read<Array<Partial<HistoryEntry>>>(HISTORY) ?? []).map((h) => ({ ...h, mode: h.mode ?? CLASSIC }) as HistoryEntry);
}

export function recordHistory(entry: HistoryEntry): HistoryEntry[] {
  const history = loadHistory().filter((h) => !(h.dateET === entry.dateET && h.mode === entry.mode));
  history.push(entry);
  history.sort((a, b) => a.dateET.localeCompare(b.dateET) || a.mode.localeCompare(b.mode));
  write(HISTORY, history);
  return history;
}

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...(read<Partial<Settings>>(SETTINGS) ?? {}) };
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...loadSettings(), ...patch };
  write(SETTINGS, next);
  return next;
}

function dayNumber(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Consecutive daily plays ending today or yesterday. */
export function currentStreak(history: HistoryEntry[], todayET: string): number {
  const days = new Set(history.map((h) => dayNumber(h.dateET)));
  let d = dayNumber(todayET);
  if (!days.has(d)) d -= 1;
  let streak = 0;
  while (days.has(d)) {
    streak++;
    d -= 1;
  }
  return streak;
}

export function maxStreak(history: HistoryEntry[]): number {
  const days = Array.from(new Set(history.map((h) => dayNumber(h.dateET)))).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

import type { Puzzle, PuzzleItem, Tier } from "./types";
import { stageFor } from "./stages";

export const TIMER_MS = 60_000;
/** Points decay from max to min over this window, then sit at min. */
export const DECAY_MS = 15_000;
export const ITEMS_PER_TIER = 3;
export const TIERS: Tier[] = [1, 2, 3, 4, 5];
export const ITEMS_PER_GAME = ITEMS_PER_TIER * TIERS.length;

export function maxPointsFor(tier: Tier): number {
  return 100 * tier;
}
export function minPointsFor(tier: Tier): number {
  return 50 * tier;
}

/** Points for a correct answer given the time since the athlete appeared. */
export function pointsFor(tier: Tier, elapsedMs: number): number {
  const max = maxPointsFor(tier);
  const min = minPointsFor(tier);
  if (elapsedMs <= 0) return max;
  if (elapsedMs >= DECAY_MS) return min;
  return Math.round(max - (max - min) * (elapsedMs / DECAY_MS));
}

export function maxPossible(items: PuzzleItem[]): number {
  return items.reduce((sum, it) => sum + maxPointsFor(it.tier), 0);
}

export type ItemStatus = "correct" | "skipped" | "timeout";

export interface ItemResult {
  status: ItemStatus;
  points: number;
  elapsedMs: number;
  wrongGuesses: number;
  /** True if the athlete had been deferred and came back for a second look. */
  deferred: boolean;
  guessedSchoolId?: string;
}

export interface QueueEntry {
  /** Index into puzzle.items. */
  index: number;
  /** Second look after a skip: skipping again gives it up for 0 points. */
  deferred: boolean;
}

export type GameEvent =
  | { type: "correct"; index: number; points: number }
  | { type: "wrong"; index: number; schoolId: string }
  | { type: "deferred"; index: number }
  | { type: "gaveUp"; index: number }
  | { type: "timeout"; index: number }
  | { type: "levelUp"; stage: number }
  | { type: "finished" };

export interface GameState {
  phase: "playing" | "finished";
  puzzle: Puzzle;
  /** queue[0] is the athlete on screen. */
  queue: QueueEntry[];
  /** Wall-clock ms when the current athlete appeared (timer start). */
  startedAt: number;
  results: Record<number, ItemResult>;
  points: number;
  correct: number;
  streak: number;
  maxStreak: number;
  /** Wrong guesses on the current athlete. */
  wrongGuesses: number;
  stage: number;
  /** Transient events for the UI; cleared with clearEvents. */
  events: GameEvent[];
  gameStartedAt: number;
  finishedAt?: number;
}

export type GameAction =
  | { type: "guess"; schoolId: string; now: number }
  | { type: "skip"; now: number }
  | { type: "timeout"; now: number }
  | { type: "clearEvents" };

export function createGame(puzzle: Puzzle, now: number): GameState {
  const queue = puzzle.items.map((_, index) => ({ index, deferred: false }));
  return {
    phase: "playing",
    puzzle,
    queue,
    startedAt: now,
    results: {},
    points: 0,
    correct: 0,
    streak: 0,
    maxStreak: 0,
    wrongGuesses: 0,
    stage: 0,
    events: [],
    gameStartedAt: now,
  };
}

export function currentItem(state: GameState): PuzzleItem | null {
  const head = state.queue[0];
  return head ? state.puzzle.items[head.index] : null;
}

export function currentEntry(state: GameState): QueueEntry | null {
  return state.queue[0] ?? null;
}

/** Remaining time in ms for the athlete on screen. */
export function timeLeft(state: GameState, now: number): number {
  return Math.max(0, TIMER_MS - (now - state.startedAt));
}

export function isCorrectGuess(item: PuzzleItem, schoolId: string): boolean {
  return item.athlete.schools.includes(schoolId);
}

function withStage(state: GameState): GameState {
  const stage = stageFor(state.correct, state.points, maxPossible(state.puzzle.items));
  if (stage > state.stage) {
    return { ...state, stage, events: [...state.events, { type: "levelUp", stage }] };
  }
  return state;
}

/** Drop the head of the queue and show the next athlete (or finish). */
function advance(state: GameState, now: number): GameState {
  const queue = state.queue.slice(1);
  if (queue.length === 0) {
    return {
      ...state,
      queue,
      phase: "finished",
      finishedAt: now,
      wrongGuesses: 0,
      events: [...state.events, { type: "finished" }],
    };
  }
  return { ...state, queue, startedAt: now, wrongGuesses: 0 };
}

/**
 * Defer the head of the queue to the end of its tier. If no other athlete of
 * that tier remains, it comes straight back as a second look.
 */
function deferHead(state: GameState, now: number): GameState {
  const head = state.queue[0];
  const rest = state.queue.slice(1);
  const tier = state.puzzle.items[head.index].tier;
  let insertAt = 0;
  for (let i = 0; i < rest.length; i++) {
    if (state.puzzle.items[rest[i].index].tier === tier) insertAt = i + 1;
  }
  const queue = [...rest.slice(0, insertAt), { index: head.index, deferred: true }, ...rest.slice(insertAt)];
  return {
    ...state,
    queue,
    startedAt: now,
    wrongGuesses: 0,
    events: [...state.events, { type: "deferred", index: head.index }],
  };
}

export function reduce(state: GameState, action: GameAction): GameState {
  if (action.type === "clearEvents") {
    return state.events.length ? { ...state, events: [] } : state;
  }
  if (state.phase !== "playing") return state;
  const head = state.queue[0];
  if (!head) return state;
  const item = state.puzzle.items[head.index];
  const elapsedMs = Math.max(0, action.now - state.startedAt);

  switch (action.type) {
    case "guess": {
      if (isCorrectGuess(item, action.schoolId)) {
        const points = pointsFor(item.tier, elapsedMs);
        const streak = state.streak + 1;
        const next: GameState = {
          ...state,
          results: {
            ...state.results,
            [head.index]: {
              status: "correct",
              points,
              elapsedMs,
              wrongGuesses: state.wrongGuesses,
              deferred: head.deferred,
              guessedSchoolId: action.schoolId,
            },
          },
          points: state.points + points,
          correct: state.correct + 1,
          streak,
          maxStreak: Math.max(state.maxStreak, streak),
          events: [...state.events, { type: "correct", index: head.index, points }],
        };
        return advance(withStage(next), action.now);
      }
      return {
        ...state,
        wrongGuesses: state.wrongGuesses + 1,
        events: [...state.events, { type: "wrong", index: head.index, schoolId: action.schoolId }],
      };
    }
    case "skip": {
      if (!head.deferred) return deferHead(state, action.now);
      const next: GameState = {
        ...state,
        results: {
          ...state.results,
          [head.index]: {
            status: "skipped",
            points: 0,
            elapsedMs,
            wrongGuesses: state.wrongGuesses,
            deferred: true,
          },
        },
        streak: 0,
        events: [...state.events, { type: "gaveUp", index: head.index }],
      };
      return advance(next, action.now);
    }
    case "timeout": {
      if (elapsedMs < TIMER_MS) return state;
      const next: GameState = {
        ...state,
        results: {
          ...state.results,
          [head.index]: {
            status: "timeout",
            points: 0,
            elapsedMs,
            wrongGuesses: state.wrongGuesses,
            deferred: head.deferred,
          },
        },
        streak: 0,
        events: [...state.events, { type: "timeout", index: head.index }],
      };
      return advance(next, action.now);
    }
  }
  return state;
}

/** Results in the day's original order, for the summary grid. */
export function orderedResults(state: GameState): Array<{ item: PuzzleItem; result: ItemResult | undefined }> {
  return state.puzzle.items.map((item, i) => ({ item, result: state.results[i] }));
}

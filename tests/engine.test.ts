import { describe, expect, it } from "vitest";
import {
  createGame, reduce, pointsFor, maxPointsFor, minPointsFor, currentItem, currentEntry,
  TIMER_MS, DECAY_MS, maxPossible, ITEMS_PER_GAME,
} from "@/lib/engine";
import type { Athlete, Puzzle, PuzzleItem, Tier } from "@/lib/types";

function athlete(id: string, tier: Tier, schools: string[] = [`${id}-u`]): Athlete {
  return { id, name: id, sport: "Football", number: "1", active: true, gender: "m", tier, fame: tier, schools };
}

function puzzle(): Puzzle {
  const items: PuzzleItem[] = [];
  let pos = 0;
  for (const tier of [1, 2, 3, 4, 5] as Tier[]) {
    for (let i = 0; i < 3; i++) {
      const a = athlete(`t${tier}-${i}`, tier);
      items.push({ athlete: a, tier, position: pos++ });
    }
  }
  return { id: "test", kind: "practice", mode: "classic", items };
}

const T0 = 1_000_000;

describe("scoring", () => {
  it("gives max points instantly, min after 15s, linear between", () => {
    expect(pointsFor(1, 0)).toBe(100);
    expect(pointsFor(1, DECAY_MS)).toBe(50);
    expect(pointsFor(1, DECAY_MS * 2)).toBe(50);
    expect(pointsFor(1, DECAY_MS / 2)).toBe(75);
    expect(pointsFor(5, 0)).toBe(500);
    expect(pointsFor(5, 3000)).toBe(450);
  });
  it("tiers scale linearly", () => {
    for (const t of [1, 2, 3, 4, 5] as Tier[]) {
      expect(maxPointsFor(t)).toBe(100 * t);
      expect(minPointsFor(t)).toBe(50 * t);
    }
    expect(maxPossible(puzzle().items)).toBe(4500);
    expect(ITEMS_PER_GAME).toBe(15);
  });
});

describe("guessing", () => {
  it("accepts any school the athlete played at and advances", () => {
    const p = puzzle();
    p.items[0].athlete.schools = ["a", "b"];
    let s = createGame(p, T0);
    s = reduce(s, { type: "guess", schoolId: "b", now: T0 + 1000 });
    expect(s.correct).toBe(1);
    expect(s.points).toBe(pointsFor(1, 1000));
    expect(currentItem(s)?.athlete.id).toBe("t1-1");
    expect(s.startedAt).toBe(T0 + 1000);
    expect(s.events.map((e) => e.type)).toEqual(["correct", "levelUp"]);
  });
  it("wrong guesses stay on the athlete and keep the clock running", () => {
    let s = createGame(puzzle(), T0);
    s = reduce(s, { type: "guess", schoolId: "nope", now: T0 + 5000 });
    expect(s.wrongGuesses).toBe(1);
    expect(currentItem(s)?.athlete.id).toBe("t1-0");
    expect(s.startedAt).toBe(T0);
    s = reduce(s, { type: "guess", schoolId: "t1-0-u", now: T0 + 7000 });
    expect(s.results[0].wrongGuesses).toBe(1);
    expect(s.results[0].points).toBe(pointsFor(1, 7000));
  });
});

describe("skipping", () => {
  it("defers to the end of the tier and refreshes the timer", () => {
    let s = createGame(puzzle(), T0);
    s = reduce(s, { type: "skip", now: T0 + 4000 });
    expect(s.startedAt).toBe(T0 + 4000);
    expect(s.queue.slice(0, 4).map((q) => `${q.index}${q.deferred ? "*" : ""}`)).toEqual(["1", "2", "0*", "3"]);
    expect(s.events.map((e) => e.type)).toEqual(["deferred"]);
  });
  it("comes straight back as a second look when it is the last in its tier", () => {
    let s = createGame(puzzle(), T0);
    s = reduce(s, { type: "guess", schoolId: "t1-0-u", now: T0 + 1 });
    s = reduce(s, { type: "guess", schoolId: "t1-1-u", now: T0 + 2 });
    s = reduce(s, { type: "skip", now: T0 + 3 });
    expect(currentEntry(s)).toEqual({ index: 2, deferred: true });
  });
  it("a second skip gives up for 0 points and resets streak", () => {
    let s = createGame(puzzle(), T0);
    s = reduce(s, { type: "guess", schoolId: "t1-0-u", now: T0 + 1 });
    s = reduce(s, { type: "skip", now: T0 + 2 });            // defer t1-1
    s = reduce(s, { type: "guess", schoolId: "t1-2-u", now: T0 + 3 });
    expect(currentEntry(s)).toEqual({ index: 1, deferred: true });
    expect(s.streak).toBe(2);
    s = reduce(s, { type: "skip", now: T0 + 4 });
    expect(s.results[1]).toMatchObject({ status: "skipped", points: 0, deferred: true });
    expect(s.streak).toBe(0);
    expect(currentItem(s)?.athlete.id).toBe("t2-0");
  });
  it("answering a deferred athlete still scores normally", () => {
    let s = createGame(puzzle(), T0);
    s = reduce(s, { type: "skip", now: T0 });
    s = reduce(s, { type: "guess", schoolId: "t1-1-u", now: T0 });
    s = reduce(s, { type: "guess", schoolId: "t1-2-u", now: T0 });
    expect(currentEntry(s)).toEqual({ index: 0, deferred: true });
    s = reduce(s, { type: "guess", schoolId: "t1-0-u", now: T0 + 500 });
    expect(s.results[0]).toMatchObject({ status: "correct", deferred: true, points: pointsFor(1, 500) });
  });
  it("multiple skips in one tier come back in skip order", () => {
    let s = createGame(puzzle(), T0);
    s = reduce(s, { type: "skip", now: T0 }); // defer 0
    s = reduce(s, { type: "skip", now: T0 }); // defer 1
    expect(s.queue.slice(0, 3).map((q) => q.index)).toEqual([2, 0, 1]);
  });
});

describe("timeout", () => {
  it("ignores timeouts before the clock expires", () => {
    let s = createGame(puzzle(), T0);
    s = reduce(s, { type: "timeout", now: T0 + TIMER_MS - 1 });
    expect(currentItem(s)?.athlete.id).toBe("t1-0");
  });
  it("records a timeout for 0 points and moves on", () => {
    let s = createGame(puzzle(), T0);
    s = reduce(s, { type: "timeout", now: T0 + TIMER_MS });
    expect(s.results[0]).toMatchObject({ status: "timeout", points: 0 });
    expect(currentItem(s)?.athlete.id).toBe("t1-1");
    expect(s.startedAt).toBe(T0 + TIMER_MS);
  });
});

describe("finishing and stages", () => {
  it("finishes after all 15 and reaches Valedictorian on a perfect fast run", () => {
    const p = puzzle();
    let s = createGame(p, T0);
    for (const it of p.items) s = reduce(s, { type: "guess", schoolId: it.athlete.schools[0], now: s.startedAt });
    expect(s.phase).toBe("finished");
    expect(s.points).toBe(4500);
    expect(s.stage).toBe(9);
    expect(s.events.at(-1)?.type).toBe("finished");
    // further actions are ignored
    expect(reduce(s, { type: "skip", now: T0 })).toBe(s);
  });
  it("a perfect but slow run tops out at Summa Cum Laude", () => {
    const p = puzzle();
    let s = createGame(p, T0);
    for (const it of p.items) s = reduce(s, { type: "guess", schoolId: it.athlete.schools[0], now: s.startedAt + 30_000 });
    expect(s.points).toBe(2250);
    expect(s.stage).toBe(7);
  });
});

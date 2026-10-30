import { describe, expect, it } from "vitest";
import { dailyPuzzle, practicePuzzle, puzzleNumberFor, etDateString, msUntilNextPuzzle, generateItems, mulberry32 } from "@/lib/daily";
import { ATHLETES } from "@/data/athletes";
import { MODES, modeStatus, poolForMode, levelMapFor, isClassic } from "@/lib/modes";
import { SCHOOL_BY_ID } from "@/data/schools";

describe("daily puzzle", () => {
  it("is deterministic for a date and has 3 per tier", () => {
    const a = dailyPuzzle(ATHLETES, "2026-11-01");
    const b = dailyPuzzle(ATHLETES, "2026-11-01");
    expect(a.items.map((i) => i.athlete.id)).toEqual(b.items.map((i) => i.athlete.id));
    expect(a.items).toHaveLength(15);
    for (const t of [1, 2, 3, 4, 5]) {
      expect(a.items.filter((i) => i.tier === t)).toHaveLength(3);
    }
    expect(a.items.map((i) => i.tier)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5]);
  });
  it("differs between days", () => {
    const a = dailyPuzzle(ATHLETES, "2026-11-01").items.map((i) => i.athlete.id).join();
    const b = dailyPuzzle(ATHLETES, "2026-11-02").items.map((i) => i.athlete.id).join();
    expect(a).not.toBe(b);
  });
  it("caps women at two and avoids duplicate schools across 200 seeds", () => {
    for (let seed = 0; seed < 200; seed++) {
      const items = generateItems(ATHLETES, mulberry32(seed));
      const women = items.filter((i) => i.athlete.gender === "f").length;
      expect(women).toBeLessThanOrEqual(2);
      const schools = items.flatMap((i) => i.athlete.schools);
      expect(new Set(schools).size).toBe(schools.length);
    }
  });
  it("numbers puzzles from launch", () => {
    expect(puzzleNumberFor("2026-10-30")).toBe(1);
    expect(puzzleNumberFor("2026-11-01")).toBe(3);
  });
  it("uses the Eastern calendar date", () => {
    // 03:30 UTC on Nov 2 is 23:30 EDT on Nov 1 (DST ends Nov 1 2026 at 2am, so 22:30 EST actually: still Nov 1)
    expect(etDateString(new Date("2026-11-02T03:30:00Z"))).toBe("2026-11-01");
    expect(etDateString(new Date("2026-11-02T05:30:00Z"))).toBe("2026-11-02");
  });
  it("counts down to ET midnight", () => {
    const ms = msUntilNextPuzzle(new Date("2026-11-05T04:00:00Z")); // 23:00 EST
    expect(ms).toBeGreaterThan(59 * 60_000);
    expect(ms).toBeLessThanOrEqual(60 * 60_000);
  });
  it("practice puzzles are valid too", () => {
    expect(practicePuzzle(ATHLETES, MODES[0], 42).items).toHaveLength(15);
  });
});

describe("athlete data integrity", () => {
  it("every athlete school id exists and fame is set", () => {
    for (const a of ATHLETES) {
      expect(a.schools.length).toBeGreaterThan(0);
      expect(a.fame).toBeGreaterThanOrEqual(1);
      expect(a.fame).toBeLessThanOrEqual(5);
      for (const s of a.schools) expect(SCHOOL_BY_ID.has(s), `${a.name}: ${s}`).toBe(true);
    }
  });
  it("ids are unique", () => {
    expect(new Set(ATHLETES.map((a) => a.id)).size).toBe(ATHLETES.length);
  });
  it("pool has at least 6 per tier so generation never starves", () => {
    for (const t of [1, 2, 3, 4, 5]) {
      expect(ATHLETES.filter((a) => a.tier === t).length).toBeGreaterThanOrEqual(6);
    }
  });
});

describe("sport modes", () => {
  it("every offered mode generates a valid 15-athlete daily with 3 per level", () => {
    for (const mode of MODES) {
      const status = modeStatus(mode, ATHLETES);
      if (!status.available) continue;
      const p = dailyPuzzle(ATHLETES, "2026-11-03", mode);
      expect(p.items).toHaveLength(15);
      expect(p.mode).toBe(mode.id);
      expect(p.items.map((i) => i.tier)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5]);
      if (mode.sports) for (const it of p.items) expect(mode.sports).toContain(it.athlete.sport);
    }
  });
  it("classic, football and basketball are available with the current pool", () => {
    for (const id of ["classic", "football", "basketball", "golf", "track", "swimming", "hockey", "baseball", "soccer", "olympic"]) {
      const mode = MODES.find((m) => m.id === id)!;
      expect(modeStatus(mode, ATHLETES).available, id).toBe(true);
    }
  });
  it("sport-mode levels are fame quantiles in fame order", () => {
    const mode = MODES.find((m) => m.id === "golf")!;
    const pool = poolForMode(mode, ATHLETES);
    const levels = levelMapFor(mode, pool);
    for (const a of pool) for (const b of pool) {
      if (a.fame < b.fame) expect(levels.get(a.id)!).toBeLessThanOrEqual(levels.get(b.id)!);
    }
    const counts = [1, 2, 3, 4, 5].map((l) => pool.filter((a) => levels.get(a.id) === l).length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });
  it("classic levels are the cross-sport tiers", () => {
    const classic = MODES[0];
    expect(isClassic(classic)).toBe(true);
    const levels = levelMapFor(classic, ATHLETES);
    for (const a of ATHLETES.slice(0, 50)) expect(levels.get(a.id)).toBe(a.tier);
  });
  it("classic daily seed is unchanged by the mode system", () => {
    const a = dailyPuzzle(ATHLETES, "2026-11-01").items.map((i) => i.athlete.id);
    const b = dailyPuzzle(ATHLETES, "2026-11-01", MODES[0]).items.map((i) => i.athlete.id);
    expect(a).toEqual(b);
  });
  it("soccer mode has no women cap", () => {
    const soccer = MODES.find((m) => m.id === "soccer")!;
    let maxWomen = 0;
    for (let seed = 0; seed < 60; seed++) {
      const items = practicePuzzle(ATHLETES, soccer, seed).items;
      maxWomen = Math.max(maxWomen, items.filter((i) => i.athlete.gender === "f").length);
    }
    expect(maxWomen).toBeGreaterThan(2);
  });
});

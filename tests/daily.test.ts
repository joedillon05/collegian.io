import { describe, expect, it } from "vitest";
import { dailyPuzzle, practicePuzzle, puzzleNumberFor, etDateString, msUntilNextPuzzle, generateItems, mulberry32 } from "@/lib/daily";
import { ATHLETES } from "@/data/athletes";
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
    expect(practicePuzzle(ATHLETES, 42).items).toHaveLength(15);
  });
});

describe("athlete data integrity", () => {
  it("every athlete school id exists", () => {
    for (const a of ATHLETES) {
      expect(a.schools.length).toBeGreaterThan(0);
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

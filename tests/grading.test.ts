import { describe, expect, it } from "vitest";
import { gradeFor, gpaOf } from "@/lib/grading";
import { stageFor, STAGES } from "@/lib/stages";

describe("grading", () => {
  it("A+ for perfect and fast", () => {
    expect(gradeFor(15, 4500, 4500).letter).toBe("A+");
  });
  it("A- for perfect but slow", () => {
    expect(gradeFor(15, 2250, 4500).letter).toBe("A-");
  });
  it("F for nothing", () => {
    expect(gradeFor(0, 0, 0)).toMatchObject({ letter: "F", gpa: 0 });
  });
  it("mid run lands in the B/C range", () => {
    const g = gradeFor(9, 1500, 2000);
    expect(["B-", "C+", "B"]).toContain(g.letter);
  });
  it("GPA averages to two decimals", () => {
    expect(gpaOf([])).toBeNull();
    expect(gpaOf([4, 3.7, 3.3])).toBe(3.67);
  });
});

describe("stages", () => {
  it("has ten stages ending at Valedictorian", () => {
    expect(STAGES).toHaveLength(10);
    expect(STAGES[9].id).toBe("valedictorian");
  });
  it("requires both correct count and points fraction", () => {
    expect(stageFor(0, 0, 4500)).toBe(0);
    expect(stageFor(1, 100, 4500)).toBe(1);
    expect(stageFor(9, 1000, 4500)).toBe(4); // 22% of points, not yet Dean's List
    expect(stageFor(9, 1600, 4500)).toBe(5);
    expect(stageFor(15, 2250, 4500)).toBe(7);
    expect(stageFor(15, 3600, 4500)).toBe(9);
    expect(stageFor(14, 4400, 4500)).toBe(8);
  });
});

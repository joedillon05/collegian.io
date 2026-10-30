import { ITEMS_PER_GAME } from "./engine";

export interface Grade {
  letter: string;
  /** Points on the 4.0 scale. */
  gpa: number;
  /** 0..1 composite the letter was derived from. */
  score: number;
}

const LETTERS: Array<[string, number, number]> = [
  // letter, min composite score, GPA points
  ["A+", 0.95, 4.0],
  ["A", 0.88, 4.0],
  ["A-", 0.82, 3.7],
  ["B+", 0.76, 3.3],
  ["B", 0.7, 3.0],
  ["B-", 0.64, 2.7],
  ["C+", 0.58, 2.3],
  ["C", 0.52, 2.0],
  ["C-", 0.46, 1.7],
  ["D+", 0.4, 1.3],
  ["D", 0.34, 1.0],
  ["D-", 0.28, 0.7],
  ["F", 0, 0],
];

/**
 * Composite = 65% accuracy (correct / 15) + 35% pace (points earned divided by
 * the max points of the athletes you actually got right). Pace is 0 with no
 * correct answers. A perfect-but-slow day lands around A-; a perfect fast day
 * is A+.
 */
export function gradeFor(correct: number, points: number, maxPointsOfCorrect: number): Grade {
  const accuracy = correct / ITEMS_PER_GAME;
  const pace = correct > 0 && maxPointsOfCorrect > 0 ? points / maxPointsOfCorrect : 0;
  const score = 0.65 * accuracy + 0.35 * pace;
  for (const [letter, min, gpa] of LETTERS) {
    if (score >= min - 1e-9) return { letter, gpa, score };
  }
  return { letter: "F", gpa: 0, score };
}

export function gpaOf(points: number[]): number | null {
  if (points.length === 0) return null;
  const sum = points.reduce((a, b) => a + b, 0);
  return Math.round((sum / points.length) * 100) / 100;
}

export function formatGpa(gpa: number | null): string {
  return gpa === null ? "--" : gpa.toFixed(2);
}

import type { GameState } from "./engine";
import { maxPointsFor } from "./engine";

/** Grade a finished (or in-progress) game. */
export function gradeForGame(state: GameState): Grade {
  let maxOfCorrect = 0;
  for (const [i, r] of Object.entries(state.results)) {
    if (r.status === "correct") maxOfCorrect += maxPointsFor(state.puzzle.items[Number(i)].tier);
  }
  return gradeFor(state.correct, state.points, maxOfCorrect);
}

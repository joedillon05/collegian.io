export interface Stage {
  id: string;
  name: string;
  /** Short caption shown under the stage name. */
  caption: string;
  /** Minimum correct answers to reach this stage. */
  minCorrect: number;
  /** Minimum fraction of the day's maximum points. */
  minFrac: number;
}

/**
 * The college-career ladder. A stage is unlocked when BOTH thresholds are met,
 * so the background evolves with points scored and correct guesses.
 * A perfect-but-slow run tops out at Summa Cum Laude; Valedictorian needs
 * every athlete right at a strong pace.
 */
export const STAGES: Stage[] = [
  { id: "orientation", name: "Orientation", caption: "Welcome week on the quad", minCorrect: 0, minFrac: 0 },
  { id: "freshman", name: "Freshman", caption: "Move-in day", minCorrect: 1, minFrac: 0 },
  { id: "sophomore", name: "Sophomore", caption: "Front row of the lecture hall", minCorrect: 3, minFrac: 0 },
  { id: "junior", name: "Junior", caption: "Library all-nighter", minCorrect: 5, minFrac: 0 },
  { id: "senior", name: "Senior", caption: "Game-day tailgate", minCorrect: 7, minFrac: 0 },
  { id: "deans-list", name: "Dean's List", caption: "Office hours at sunrise", minCorrect: 9, minFrac: 0.3 },
  { id: "honors-thesis", name: "Honors Thesis", caption: "Late nights in the archive", minCorrect: 11, minFrac: 0.4 },
  { id: "summa", name: "Summa Cum Laude", caption: "Cords, stole, rehearsal", minCorrect: 13, minFrac: 0.5 },
  { id: "commencement", name: "Commencement", caption: "Cap and gown", minCorrect: 14, minFrac: 0.6 },
  { id: "valedictorian", name: "Valedictorian", caption: "At the podium", minCorrect: 15, minFrac: 0.8 },
];

export function stageFor(correct: number, points: number, maxPossible: number): number {
  const frac = maxPossible > 0 ? points / maxPossible : 0;
  let best = 0;
  for (let i = 0; i < STAGES.length; i++) {
    const s = STAGES[i];
    if (correct >= s.minCorrect && frac >= s.minFrac - 1e-9) best = i;
  }
  return best;
}

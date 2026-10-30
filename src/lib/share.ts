import type { GameState } from "./engine";
import { orderedResults } from "./engine";
import { STAGES } from "./stages";
import { ITEMS_PER_TIER } from "./engine";

export function resultSquares(state: GameState): string[] {
  return orderedResults(state).map(({ result }) => {
    if (!result) return "⬜";
    if (result.status === "correct") return result.deferred ? "🟨" : "🟩";
    return "⬛";
  });
}

export function shareText(state: GameState, grade: string): string {
  const squares = resultSquares(state);
  const rows: string[] = [];
  for (let i = 0; i < squares.length; i += ITEMS_PER_TIER) {
    rows.push(squares.slice(i, i + ITEMS_PER_TIER).join(""));
  }
  const title =
    state.puzzle.mode === "daily" ? `Collegian #${state.puzzle.number}` : "Collegian practice";
  const stage = STAGES[state.stage].name;
  return [
    `${title} 🎓 ${stage}`,
    rows.join("\n"),
    `${state.points.toLocaleString("en-US")} pts · ${state.correct}/${squares.length} · ${grade}`,
    "collegian.io",
  ].join("\n");
}

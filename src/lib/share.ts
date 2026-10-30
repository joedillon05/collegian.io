import type { GameState } from "./engine";
import { orderedResults } from "./engine";
import { STAGES } from "./stages";
import { ITEMS_PER_TIER } from "./engine";
import { MODE_BY_ID, isClassic } from "./modes";

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
  const mode = MODE_BY_ID.get(state.puzzle.mode);
  const modeTag = mode && !isClassic(mode) ? ` ${mode.name}` : "";
  const title =
    state.puzzle.kind === "daily" ? `Collegian${modeTag} #${state.puzzle.number}` : `Collegian${modeTag} practice`;
  const stage = STAGES[state.stage].name;
  return [
    `${title} 🎓 ${stage}`,
    rows.join("\n"),
    `${state.points.toLocaleString("en-US")} pts · ${state.correct}/${squares.length} · ${grade}`,
    "collegian.io",
  ].join("\n");
}

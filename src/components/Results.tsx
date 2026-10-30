"use client";

import { useEffect, useState } from "react";
import { type GameState, orderedResults, maxPointsFor, ITEMS_PER_GAME } from "@/lib/engine";
import { STAGES } from "@/lib/stages";
import { gradeForGame, formatGpa } from "@/lib/grading";
import { shareText } from "@/lib/share";
import { schoolName } from "@/data/schools";
import { msUntilNextPuzzle } from "@/lib/daily";
import SceneLayer from "./SceneLayer";
import { TIER_NAMES } from "./ClueCard";

interface Props {
  state: GameState;
  gpa: number | null;
  streak: number;
  onPractice: () => void;
  onHome: () => void;
  onStats: () => void;
}

function fmtCountdown(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function Results({ state, gpa, streak, onPractice, onHome, onStats }: Props) {
  const grade = gradeForGame(state);
  const stage = STAGES[state.stage];
  const isDaily = state.puzzle.mode === "daily";
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(() => msUntilNextPuzzle());
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 250);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!isDaily) return;
    const id = setInterval(() => setCountdown(msUntilNextPuzzle()), 1000);
    return () => clearInterval(id);
  }, [isDaily]);

  async function share() {
    const text = shareText(state, grade.letter);
    const nav = typeof navigator !== "undefined" ? navigator : null;
    try {
      if (nav?.share && /Mobi|Android/i.test(nav.userAgent)) {
        await nav.share({ text });
        return;
      }
      await nav?.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user cancelled or clipboard blocked */
    }
  }

  const maxPossible = state.puzzle.items.reduce((s, it) => s + maxPointsFor(it.tier), 0);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <SceneLayer stage={state.stage} dim={0.35} />
      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col gap-3 px-4 pb-10 pt-4">
        <header className="px-panel-dark flex items-center justify-between px-3 py-2">
          <button onClick={onHome} className="font-pixel text-[10px] text-[#ffd23f] sm:text-xs">
            ◀ COLLEGIAN
          </button>
          <span className="font-pixel text-[10px] sm:text-xs">{isDaily ? `#${state.puzzle.number} · ${state.puzzle.dateET}` : "PRACTICE"}</span>
        </header>

        <section className={`px-panel px-4 py-4 text-center transition-transform duration-500 ${revealed ? "scale-100" : "scale-90"}`}>
          <div className="font-pixel text-[9px] text-[#6c6a62]">{isDaily ? "FINAL STANDING" : "PRACTICE RESULT"}</div>
          <h1 className="mt-2 font-pixel text-xl sm:text-3xl">{stage.name.toUpperCase()}</h1>
          <p className="mt-1 text-xl text-[#6c6a62]">{stage.caption}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Big label="GRADE" value={grade.letter} accent />
            <Big label="POINTS" value={state.points.toLocaleString("en-US")} sub={`of ${maxPossible.toLocaleString("en-US")}`} />
            <Big label="CORRECT" value={`${state.correct}/${ITEMS_PER_GAME}`} sub={`best run ${state.maxStreak}`} />
          </div>
          {isDaily && (
            <div className="mt-3 flex items-center justify-center gap-4 text-xl">
              <span>
                GPA <b className="font-pixel text-sm">{formatGpa(gpa)}</b>
              </span>
              <span>
                STREAK <b className="font-pixel text-sm">{streak}</b>
              </span>
            </div>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button className="px-btn" onClick={share}>
              {copied ? "COPIED!" : "SHARE"}
            </button>
            <button className="px-btn px-btn-secondary" onClick={onPractice}>
              {isDaily ? "PRACTICE" : "NEW SET"}
            </button>
            <button className="px-btn px-btn-secondary" onClick={onStats}>
              TRANSCRIPT
            </button>
          </div>
          {isDaily && (
            <p className="mt-3 text-xl">
              Next puzzle in <span className="font-pixel text-xs">{fmtCountdown(countdown)}</span>
            </p>
          )}
        </section>

        <section className="px-panel px-3 py-3">
          <h2 className="mb-2 font-pixel text-[10px] text-[#6c6a62]">REPORT CARD</h2>
          <ol className="divide-y-2 divide-dashed divide-[#bdb59b]">
            {orderedResults(state).map(({ item, result }, i) => {
              const ok = result?.status === "correct";
              const mark = ok ? (result.deferred ? "🟨" : "🟩") : "⬛";
              return (
                <li key={i} className="flex items-center gap-2 py-1.5">
                  <span aria-hidden="true">{mark}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-pixel text-[10px] sm:text-xs">{item.athlete.name}</span>
                      <span className="font-pixel text-[9px] text-[#6c6a62]">T{item.tier}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 text-lg leading-tight sm:text-xl">
                      <span className="truncate">
                        {item.athlete.schools.map(schoolName).join(" / ")}
                        {!ok && result?.guessedSchoolId && <span className="text-[#e63946]"> (you: {schoolName(result.guessedSchoolId)})</span>}
                      </span>
                      <span className={`shrink-0 whitespace-nowrap ${ok ? "text-[#1f8f4a]" : "text-[#8d8a7e]"}`}>
                        {ok ? `+${result.points} · ${(result.elapsedMs / 1000).toFixed(1)}s` : result?.status === "timeout" ? "time" : "skip"}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-lg text-[#6c6a62]">
            Tiers: {Object.entries(TIER_NAMES).map(([t, n]) => `${t} ${n}`).join(" · ")}
          </p>
        </section>
      </div>
    </div>
  );
}

function Big({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`border-2 border-[#15152a] px-1 py-2 ${accent ? "bg-[#ffd23f]" : "bg-[#f7f3e8]"}`}>
      <div className="font-pixel text-[8px] text-[#6c6a62]">{label}</div>
      <div className={`mt-1 font-pixel ${accent ? "text-2xl sm:text-3xl" : "text-base sm:text-xl"}`}>{value}</div>
      {sub && <div className="text-base leading-none text-[#6c6a62]">{sub}</div>}
    </div>
  );
}

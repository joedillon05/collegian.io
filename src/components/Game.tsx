"use client";

import { useEffect, useRef, useState } from "react";
import {
  type GameAction, type GameState, currentEntry, currentItem, maxPointsFor, pointsFor, timeLeft, TIMER_MS, orderedResults,
} from "@/lib/engine";
import { STAGES } from "@/lib/stages";
import { schoolName } from "@/data/schools";
import { isClassic, levelLabel, type ModeDef } from "@/lib/modes";
import { sfx } from "@/lib/sfx";
import ClueCard from "./ClueCard";
import TimerBar from "./TimerBar";
import SchoolInput from "./SchoolInput";
import SceneLayer from "./SceneLayer";

interface Props {
  state: GameState;
  mode: ModeDef;
  dispatch: (a: GameAction) => void;
  sound: boolean;
  onToggleSound: () => void;
  onHelp: () => void;
  onStats: () => void;
  onExit: () => void;
}

interface Fx<T> {
  id: number;
  value: T;
}

export default function Game({ state, mode, dispatch, sound, onToggleSound, onHelp, onStats, onExit }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [flash, setFlash] = useState<Fx<"correct" | "wrong"> | null>(null);
  const [pop, setPop] = useState<Fx<string> | null>(null);
  const [toast, setToast] = useState<Fx<{ text: string; bad: boolean }> | null>(null);
  const [banner, setBanner] = useState<Fx<number> | null>(null);
  const [shakeToken, setShakeToken] = useState(0);
  const [resetToken, setResetToken] = useState(0);
  const lastHead = useRef<string>("");

  const item = currentItem(state);
  const entry = currentEntry(state);
  const playing = state.phase === "playing";

  // Clock. Wall time, so tabbing away does not pause the game.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (playing && now - state.startedAt >= TIMER_MS) dispatch({ type: "timeout", now });
  }, [now, playing, state.startedAt, dispatch]);

  // Clear the input whenever a different athlete (or second look) comes up.
  useEffect(() => {
    const key = entry ? `${entry.index}:${entry.deferred}` : "";
    if (key !== lastHead.current) {
      lastHead.current = key;
      setResetToken((t) => t + 1);
    }
  }, [entry]);

  // Turn engine events into effects, then clear them.
  useEffect(() => {
    if (state.events.length === 0) return;
    const id = Date.now();
    for (const e of state.events) {
      const answers = (i: number) => state.puzzle.items[i].athlete.schools.map(schoolName).join(" / ");
      switch (e.type) {
        case "correct":
          setFlash({ id, value: "correct" });
          setPop({ id, value: `+${e.points}` });
          sfx.correct();
          break;
        case "wrong":
          setFlash({ id, value: "wrong" });
          setShakeToken((t) => t + 1);
          sfx.wrong();
          break;
        case "deferred":
          setToast({ id, value: { text: "SKIPPED · BACK AT THE END OF THE TIER", bad: false } });
          sfx.skip();
          break;
        case "gaveUp":
          setToast({ id, value: { text: `GAVE UP · ${answers(e.index)}`, bad: true } });
          sfx.giveUp();
          break;
        case "timeout":
          setToast({ id, value: { text: `TIME! · ${answers(e.index)}`, bad: true } });
          sfx.timeout();
          break;
        case "levelUp":
          setBanner({ id, value: e.stage });
          sfx.levelUp();
          break;
        case "finished":
          sfx.finish();
          break;
      }
    }
    dispatch({ type: "clearEvents" });
  }, [state.events, state.puzzle.items, dispatch]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 500);
    return () => clearTimeout(t);
  }, [flash]);
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 1700);
    return () => clearTimeout(t);
  }, [banner]);

  if (!item || !entry) return null;

  const left = timeLeft(state, now);
  const elapsed = TIMER_MS - left;
  const answered = Object.keys(state.results).length;
  const stage = STAGES[state.stage];

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <SceneLayer stage={state.stage} />
      {flash && (
        <div key={flash.id} className={`pointer-events-none fixed inset-0 z-20 ${flash.value === "correct" ? "flash-correct" : "flash-wrong"}`} />
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col gap-3 px-4 pb-8 pt-3">
        <header className="px-panel-dark flex items-center justify-between gap-2 px-3 py-2">
          <button onClick={onExit} className="font-pixel text-[10px] text-[#ffd23f] sm:text-xs" aria-label="Back to home">
            ◀ COLLEGIAN
          </button>
          <div className="text-center">
            <div className="font-pixel text-[8px] text-[#9ea3b5]">
              {state.puzzle.kind === "daily" ? `#${state.puzzle.number}` : "PRACTICE"}
              {!isClassic(mode) && ` · ${mode.short.toUpperCase()}`}
            </div>
            <div className="font-pixel text-xs sm:text-sm">{state.points.toLocaleString("en-US")} PTS</div>
          </div>
          <div className="flex items-center gap-1">
            <IconButton label={sound ? "Mute" : "Unmute"} onClick={onToggleSound}>
              {sound ? "♪" : "✕"}
            </IconButton>
            <IconButton label="Stats" onClick={onStats}>
              ▤
            </IconButton>
            <IconButton label="Help" onClick={onHelp}>
              ?
            </IconButton>
          </div>
        </header>

        <div className="flex items-center justify-between gap-2">
          <div className="border-2 border-[#15152a] bg-[#ffd23f] px-2 py-1 font-pixel text-[9px] sm:text-[10px]">
            {stage.name.toUpperCase()}
          </div>
          <ProgressDots state={state} />
        </div>

        <div className="relative">
          <ClueCard item={item} deferred={entry.deferred} answered={answered} levelLabel={levelLabel(mode, item.tier)} />
          {pop && (
            <div key={pop.id} className="anim-pop pointer-events-none absolute right-4 top-2 font-pixel text-2xl text-[#2dd36f] drop-shadow-[2px_2px_0_#15152a]">
              {pop.value}
            </div>
          )}
        </div>

        <TimerBar timeLeftMs={left} pointsNow={pointsFor(item.tier, elapsed)} maxPoints={maxPointsFor(item.tier)} />

        <SchoolInput
          onSubmit={(schoolId) => dispatch({ type: "guess", schoolId, now: Date.now() })}
          disabled={!playing}
          resetToken={resetToken}
          shakeToken={shakeToken}
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-lg leading-tight text-[#f7f3e8] drop-shadow-[1px_1px_0_#15152a] sm:text-xl">
            {entry.deferred ? "Second look. Skip again to give up for 0." : "Wrong guesses are free. The clock is not."}
          </p>
          <button
            onClick={() => dispatch({ type: "skip", now: Date.now() })}
            disabled={!playing}
            className={`px-btn shrink-0 ${entry.deferred ? "px-btn-danger" : "px-btn-secondary"}`}
          >
            {entry.deferred ? "GIVE UP" : "SKIP ▶"}
          </button>
        </div>

        {toast && (
          <div
            key={toast.id}
            role="status"
            className={`px-panel fixed bottom-6 left-1/2 z-30 w-[min(92vw,36rem)] -translate-x-1/2 px-3 py-2 text-center font-pixel text-[10px] sm:text-xs ${
              toast.value.bad ? "!bg-[#e63946] !text-white" : ""
            }`}
          >
            {toast.value.text}
          </div>
        )}
      </div>

      {banner && (
        <div key={banner.id} className="anim-banner pointer-events-none fixed left-1/2 top-1/2 z-30 text-center">
          <div className="px-panel-dark px-6 py-4">
            <div className="font-pixel text-[10px] text-[#ffd23f]">LEVEL UP</div>
            <div className="mt-2 font-pixel text-lg sm:text-2xl">{STAGES[banner.value].name.toUpperCase()}</div>
            <div className="mt-1 text-xl text-[#9ea3b5]">{STAGES[banner.value].caption}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="h-8 w-8 border-2 border-[#f7f3e8] font-pixel text-xs leading-none text-[#f7f3e8] hover:bg-[#f7f3e8] hover:text-[#15152a]"
    >
      {children}
    </button>
  );
}

function ProgressDots({ state }: { state: GameState }) {
  const head = currentEntry(state);
  return (
    <div className="flex flex-wrap gap-1" aria-label="Progress">
      {orderedResults(state).map(({ result }, i) => {
        const isCurrent = head?.index === i;
        let bg = "#d9d4c7";
        if (result?.status === "correct") bg = result.deferred ? "#ffd23f" : "#2dd36f";
        else if (result) bg = "#15152a";
        return (
          <span
            key={i}
            className={`block h-3 w-3 border-2 border-[#15152a] ${isCurrent ? "anim-blink" : ""}`}
            style={{ background: isCurrent ? "#ffffff" : bg, marginRight: i % 3 === 2 ? 4 : 0 }}
          />
        );
      })}
    </div>
  );
}

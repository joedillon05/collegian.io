"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ATHLETES } from "@/data/athletes";
import { dailyPuzzle, etDateString, practicePuzzle, puzzleNumberFor } from "@/lib/daily";
import { createGame, reduce, type GameAction, type GameState } from "@/lib/engine";
import { gradeForGame, gpaOf } from "@/lib/grading";
import { CLASSIC_MODE_ID, MODES, MODE_BY_ID, MIN_POOL, isClassic, modeStatus, type ModeDef } from "@/lib/modes";
import { setSoundEnabled } from "@/lib/sfx";
import {
  currentStreak, loadDaily, loadHistory, loadSettings, recordHistory, saveDaily, saveSettings,
  type HistoryEntry, type Settings,
} from "@/lib/storage";
import Game from "./Game";
import Results from "./Results";
import HowToPlay from "./HowToPlay";
import StatsModal from "./StatsModal";
import SceneLayer from "./SceneLayer";

type View = "home" | "play";
type ModalKind = "help" | "stats" | null;
type Mark = "done" | "playing";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [dateET, setDateET] = useState("");
  const [settings, setSettings] = useState<Settings>({ sound: false, seenHelp: true });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [modeId, setModeId] = useState<string>(CLASSIC_MODE_ID);
  const [game, setGame] = useState<GameState | null>(null);
  const [view, setView] = useState<View>("home");
  const [modal, setModal] = useState<ModalKind>(null);
  const [marks, setMarks] = useState<Record<string, Mark | undefined>>({});

  const mode = MODE_BY_ID.get(modeId) ?? MODES[0];
  const statuses = useMemo(() => new Map(MODES.map((m) => [m.id, modeStatus(m, ATHLETES)])), []);

  const refreshMarks = useCallback((d: string) => {
    const next: Record<string, Mark | undefined> = {};
    for (const m of MODES) {
      const s = loadDaily(m.id, d);
      if (s) next[m.id] = s.phase === "finished" ? "done" : "playing";
    }
    setMarks(next);
  }, []);

  // Boot from localStorage on the client only.
  useEffect(() => {
    const d = etDateString();
    setDateET(d);
    const s = loadSettings();
    setSettings(s);
    setSoundEnabled(s.sound);
    setHistory(loadHistory());
    const requested = new URLSearchParams(window.location.search).get("mode");
    const initial = requested && MODE_BY_ID.has(requested) ? requested : CLASSIC_MODE_ID;
    setModeId(initial);
    const saved = loadDaily(initial, d);
    if (saved) {
      setGame(saved);
      setView("play");
    }
    refreshMarks(d);
    if (!s.seenHelp) setModal("help");
    setMounted(true);
  }, [refreshMarks]);

  // Roll over at ET midnight if the tab stays open.
  useEffect(() => {
    const id = setInterval(() => {
      const d = etDateString();
      if (dateET && d !== dateET) {
        setDateET(d);
        setGame(loadDaily(modeId, d));
        setView("home");
        refreshMarks(d);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [dateET, modeId, refreshMarks]);

  // Persist the daily game and record the grade once it finishes.
  useEffect(() => {
    if (!game || game.puzzle.kind !== "daily" || !game.puzzle.dateET) return;
    saveDaily(game);
    if (game.phase !== "finished") return;
    const m = game.puzzle.mode;
    if (!history.some((h) => h.dateET === game.puzzle.dateET && h.mode === m)) {
      const grade = gradeForGame(game);
      setHistory(
        recordHistory({
          mode: m,
          dateET: game.puzzle.dateET,
          number: game.puzzle.number ?? puzzleNumberFor(game.puzzle.dateET),
          points: game.points,
          correct: game.correct,
          maxStreak: game.maxStreak,
          stage: game.stage,
          grade: grade.letter,
          gpa: grade.gpa,
        }),
      );
    }
    refreshMarks(game.puzzle.dateET);
  }, [game, history, refreshMarks]);

  const dispatch = useCallback((a: GameAction) => setGame((s) => (s ? reduce(s, a) : s)), []);

  function selectMode(id: string) {
    setModeId(id);
    setGame(loadDaily(id, dateET));
    try {
      const url = new URL(window.location.href);
      if (id === CLASSIC_MODE_ID) url.searchParams.delete("mode"); else url.searchParams.set("mode", id);
      window.history.replaceState(null, "", url);
    } catch { /* ignore */ }
  }
  function startDaily() {
    setGame(createGame(dailyPuzzle(ATHLETES, dateET, mode), Date.now()));
    setView("play");
    setMarks((m) => ({ ...m, [mode.id]: "playing" }));
  }
  function startPractice(forMode: ModeDef = mode) {
    setGame(createGame(practicePuzzle(ATHLETES, forMode), Date.now()));
    setView("play");
  }
  function goHome() {
    setGame(loadDaily(modeId, dateET));
    setView("home");
    refreshMarks(dateET);
  }
  function toggleSound() {
    const next = saveSettings({ sound: !settings.sound });
    setSettings(next);
    setSoundEnabled(next.sound);
  }
  function closeHelp() {
    setModal(null);
    if (!settings.seenHelp) setSettings(saveSettings({ seenHelp: true }));
  }

  const gpa = gpaOf(history.map((h) => h.gpa));
  const streak = dateET ? currentStreak(history, dateET) : 0;
  const todaysEntry = history.find((h) => h.dateET === dateET && h.mode === modeId);

  const modals = (
    <>
      {modal === "help" && <HowToPlay onClose={closeHelp} />}
      {modal === "stats" && <StatsModal history={history} todayET={dateET} onClose={() => setModal(null)} />}
    </>
  );

  if (!mounted) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0b0b14]">
        <p className="font-pixel text-xs text-[#ffd23f]">LOADING…</p>
      </div>
    );
  }

  if (game && view === "play") {
    const gameMode = MODE_BY_ID.get(game.puzzle.mode) ?? MODES[0];
    if (game.phase === "finished") {
      return (
        <>
          <Results
            state={game}
            mode={gameMode}
            gpa={gpa}
            streak={streak}
            onPractice={() => startPractice(gameMode)}
            onHome={goHome}
            onStats={() => setModal("stats")}
          />
          {modals}
        </>
      );
    }
    return (
      <>
        <Game
          state={game}
          mode={gameMode}
          dispatch={dispatch}
          sound={settings.sound}
          onToggleSound={toggleSound}
          onHelp={() => setModal("help")}
          onStats={() => setModal("stats")}
          onExit={goHome}
        />
        {modals}
      </>
    );
  }

  const daily = game?.puzzle.kind === "daily" && game.puzzle.mode === modeId ? game : null;
  const number = puzzleNumberFor(dateET);
  const status = statuses.get(modeId);
  const available = status?.available ?? false;

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <SceneLayer stage={todaysEntry?.stage ?? 0} dim={0.25} />
      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center gap-4 px-4 py-8">
        <div className="px-panel w-full px-4 py-5 text-center sm:px-5 sm:py-6">
          <div className="font-pixel text-[9px] text-[#6c6a62]">DAILY · PUZZLE #{number} · {dateET}</div>
          <h1 className="mt-3 font-pixel text-2xl leading-tight text-[#15152a] sm:text-4xl">
            COLLEGIAN<span className="text-[#e63946]">.IO</span>
          </h1>
          <p className="mt-3 text-2xl">Name the school. Climb from Orientation to Valedictorian.</p>

          <div className="mt-4 flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="Game mode">
            {MODES.map((m) => {
              const st = statuses.get(m.id);
              const on = m.id === modeId;
              const mark = marks[m.id];
              const off = !st?.available;
              return (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={on}
                  disabled={off}
                  onClick={() => selectMode(m.id)}
                  title={off ? `Needs ${MIN_POOL - (st?.size ?? 0)} more athletes` : m.name}
                  className={`border-2 border-[#15152a] px-2 py-1 font-pixel text-[9px] ${
                    on ? "bg-[#15152a] text-[#ffd23f]" : off ? "bg-[#d9d4c7] text-[#8d8a7e]" : "bg-[#f7f3e8] hover:bg-[#ffd23f]"
                  }`}
                >
                  {m.short.toUpperCase()}
                  {mark === "done" && " ✓"}
                  {mark === "playing" && " ▶"}
                  {off && " · SOON"}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xl leading-tight text-[#6c6a62]">
            <b className="text-[#15152a]">{mode.name}.</b> {mode.blurb}
            {!isClassic(mode) && status && ` ${status.size} athletes in the pool.`}
          </p>

          <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
            {!available ? (
              <button className="px-btn" disabled>
                COMING SOON
              </button>
            ) : daily?.phase === "finished" ? (
              <button className="px-btn" onClick={() => setView("play")}>
                TODAY&apos;S REPORT CARD
              </button>
            ) : daily ? (
              <button className="px-btn" onClick={() => setView("play")}>
                RESUME #{number}
              </button>
            ) : (
              <button className="px-btn" onClick={startDaily}>
                PLAY #{number}
              </button>
            )}
            <button className="px-btn px-btn-secondary" disabled={!available} onClick={() => startPractice()}>
              PRACTICE
            </button>
          </div>
          <div className="mt-4 flex justify-center gap-4 text-xl">
            <button className="underline" onClick={() => setModal("help")}>
              How to play
            </button>
            <button className="underline" onClick={() => setModal("stats")}>
              Transcript
            </button>
            <button className="underline" onClick={toggleSound}>
              Sound {settings.sound ? "on" : "off"}
            </button>
          </div>
          {history.length > 0 && (
            <p className="mt-3 text-xl text-[#6c6a62]">
              GPA {gpa?.toFixed(2)} · {history.length} game{history.length === 1 ? "" : "s"} · streak {streak}
            </p>
          )}
        </div>
        <p className="border-2 border-[#15152a] bg-[#15152a]/80 px-3 py-1 text-center text-lg text-[#f7f3e8]">
          15 athletes. 3 per level. 60 seconds each. New puzzles at midnight ET.
        </p>
      </main>
      {modals}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { ATHLETES } from "@/data/athletes";
import { dailyPuzzle, etDateString, practicePuzzle, puzzleNumberFor } from "@/lib/daily";
import { createGame, reduce, type GameAction, type GameState } from "@/lib/engine";
import { gradeForGame, gpaOf } from "@/lib/grading";
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

type View = "home" | "daily" | "practice";
type ModalKind = "help" | "stats" | null;

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [dateET, setDateET] = useState("");
  const [settings, setSettings] = useState<Settings>({ sound: false, seenHelp: true });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [game, setGame] = useState<GameState | null>(null);
  const [view, setView] = useState<View>("home");
  const [modal, setModal] = useState<ModalKind>(null);

  // Boot from localStorage on the client only.
  useEffect(() => {
    const d = etDateString();
    setDateET(d);
    const s = loadSettings();
    setSettings(s);
    setSoundEnabled(s.sound);
    setHistory(loadHistory());
    const saved = loadDaily(d);
    if (saved) {
      setGame(saved);
      setView("daily");
    }
    if (!s.seenHelp) setModal("help");
    setMounted(true);
  }, []);

  // Roll over at ET midnight if the tab stays open.
  useEffect(() => {
    const id = setInterval(() => {
      const d = etDateString();
      if (d !== dateET && dateET) {
        setDateET(d);
        setGame(loadDaily(d));
        setView("home");
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [dateET]);

  // Persist the daily game and record the grade once it finishes.
  useEffect(() => {
    if (!game || game.puzzle.mode !== "daily" || !game.puzzle.dateET) return;
    saveDaily(game);
    if (game.phase === "finished" && !history.some((h) => h.dateET === game.puzzle.dateET)) {
      const grade = gradeForGame(game);
      setHistory(
        recordHistory({
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
  }, [game, history]);

  const dispatch = useCallback((a: GameAction) => setGame((s) => (s ? reduce(s, a) : s)), []);

  function startDaily() {
    setGame(createGame(dailyPuzzle(ATHLETES, dateET), Date.now()));
    setView("daily");
  }
  function startPractice() {
    setGame(createGame(practicePuzzle(ATHLETES), Date.now()));
    setView("practice");
  }
  function goHome() {
    setGame(loadDaily(dateET));
    setView("home");
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
  const todaysEntry = history.find((h) => h.dateET === dateET);

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

  if (game && view !== "home") {
    if (game.phase === "finished") {
      return (
        <>
          <Results
            state={game}
            gpa={gpa}
            streak={streak}
            onPractice={startPractice}
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

  const daily = game?.puzzle.mode === "daily" ? game : null;
  const number = puzzleNumberFor(dateET);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <SceneLayer stage={todaysEntry?.stage ?? 0} dim={0.25} />
      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center gap-4 px-4 py-8">
        <div className="px-panel w-full px-5 py-6 text-center">
          <div className="font-pixel text-[9px] text-[#6c6a62]">DAILY · PUZZLE #{number} · {dateET}</div>
          <h1 className="mt-3 font-pixel text-2xl leading-tight text-[#15152a] sm:text-4xl">
            COLLEGIAN<span className="text-[#e63946]">.IO</span>
          </h1>
          <p className="mt-3 text-2xl">Name the school. Climb from Orientation to Valedictorian.</p>
          <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
            {daily?.phase === "finished" ? (
              <button className="px-btn" onClick={() => setView("daily")}>
                TODAY&apos;S REPORT CARD
              </button>
            ) : daily ? (
              <button className="px-btn" onClick={() => setView("daily")}>
                RESUME #{number}
              </button>
            ) : (
              <button className="px-btn" onClick={startDaily}>
                PLAY #{number}
              </button>
            )}
            <button className="px-btn px-btn-secondary" onClick={startPractice}>
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
              GPA {gpa?.toFixed(2)} · {history.length} day{history.length === 1 ? "" : "s"} · streak {streak}
            </p>
          )}
        </div>
        <p className="border-2 border-[#15152a] bg-[#15152a]/80 px-3 py-1 text-center text-lg text-[#f7f3e8]">
          15 athletes. 3 per tier. 60 seconds each. New puzzle at midnight ET.
        </p>
      </main>
      {modals}
    </div>
  );
}

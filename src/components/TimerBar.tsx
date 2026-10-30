"use client";

import { DECAY_MS, TIMER_MS } from "@/lib/engine";

interface Props {
  timeLeftMs: number;
  pointsNow: number;
  maxPoints: number;
}

export default function TimerBar({ timeLeftMs, pointsNow, maxPoints }: Props) {
  const elapsed = TIMER_MS - timeLeftMs;
  const frac = Math.max(0, Math.min(1, timeLeftMs / TIMER_MS));
  const inBonus = elapsed < DECAY_MS;
  const urgent = timeLeftMs < 10_000;
  const color = urgent ? "#e63946" : inBonus ? "#2dd36f" : "#ffd23f";
  const seconds = Math.ceil(timeLeftMs / 1000);
  const decayMark = 100 - (DECAY_MS / TIMER_MS) * 100;

  return (
    <div className="px-panel px-3 py-2" role="timer" aria-live="off" aria-label={`${seconds} seconds left`}>
      <div className="mb-1 flex items-center justify-between font-pixel text-[10px] sm:text-xs">
        <span className={urgent ? "anim-blink text-[#e63946]" : ""}>
          {String(seconds).padStart(2, "0")}s
        </span>
        <span>
          <span className={inBonus ? "text-[#1f8f4a]" : "text-[#8d8a7e]"}>{inBonus ? "SPEED BONUS" : "FLOOR"}</span>
          {" · "}
          <span>{pointsNow}</span>
          <span className="text-[#8d8a7e]">/{maxPoints} PTS</span>
        </span>
      </div>
      <div className="relative h-4 border-2 border-[#15152a] bg-[#d9d4c7]">
        <div className="h-full" style={{ width: `${frac * 100}%`, background: color, transition: "width 100ms linear" }} />
        <div className="absolute top-0 h-full w-[2px] bg-[#15152a]" style={{ left: `${decayMark}%` }} aria-hidden="true" />
      </div>
    </div>
  );
}

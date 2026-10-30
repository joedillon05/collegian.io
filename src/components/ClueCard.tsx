"use client";

import { useEffect, useState } from "react";
import type { PuzzleItem } from "@/lib/types";
import { ITEMS_PER_GAME } from "@/lib/engine";

export const TIER_NAMES: Record<number, string> = {
  1: "PRIME TIME",
  2: "PRO RANKS",
  3: "LEGENDS & PIONEERS",
  4: "OLYMPIC STAGE",
  5: "DEEP CUTS",
};

interface Props {
  item: PuzzleItem;
  deferred: boolean;
  answered: number;
}

function useTypewriter(text: string, speed = 28): string {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return text.slice(0, n);
}

export default function ClueCard({ item, deferred, answered }: Props) {
  const { athlete } = item;
  const typed = useTypewriter(athlete.name);
  return (
    <section className="px-panel relative px-4 py-3 sm:px-5 sm:py-4" aria-live="polite">
      <div className="mb-2 flex items-center justify-between font-pixel text-[9px] text-[#6c6a62] sm:text-[10px]">
        <span>
          ATHLETE {Math.min(answered + 1, ITEMS_PER_GAME)}/{ITEMS_PER_GAME}
        </span>
        <span>
          TIER {item.tier} · {TIER_NAMES[item.tier]}
        </span>
      </div>
      {deferred && (
        <div className="absolute -top-3 right-3 border-2 border-[#15152a] bg-[#ffd23f] px-2 py-1 font-pixel text-[9px]">
          SECOND LOOK
        </div>
      )}
      <h2 className="font-pixel text-lg leading-snug sm:text-2xl" aria-label={athlete.name}>
        {typed}
        {typed.length < athlete.name.length && <span className="anim-blink">▌</span>}
      </h2>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="border-2 border-[#15152a] bg-[#f7f3e8] px-1 py-2">
          <dt className="font-pixel text-[8px] text-[#6c6a62]">SPORT</dt>
          <dd className="mt-1 text-xl leading-none sm:text-2xl">{athlete.sport}</dd>
        </div>
        <div className="border-2 border-[#15152a] bg-[#f7f3e8] px-1 py-2">
          <dt className="font-pixel text-[8px] text-[#6c6a62]">NUMBER</dt>
          <dd className="mt-1 font-pixel text-base leading-none sm:text-xl">{athlete.number ? `#${athlete.number}` : "—"}</dd>
        </div>
        <div className="border-2 border-[#15152a] bg-[#f7f3e8] px-1 py-2">
          <dt className="font-pixel text-[8px] text-[#6c6a62]">STATUS</dt>
          <dd className={`mt-1 font-pixel text-[10px] leading-none sm:text-xs ${athlete.active ? "text-[#1f8f4a]" : "text-[#8d8a7e]"}`}>
            {athlete.active ? "ACTIVE" : "RETIRED"}
          </dd>
        </div>
      </dl>
    </section>
  );
}

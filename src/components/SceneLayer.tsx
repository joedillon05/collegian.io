"use client";

import { useEffect, useState } from "react";
import Scene from "./Scene";

/** Cross-fades between stage backgrounds when the player levels up. */
export default function SceneLayer({ stage, dim = 0.3 }: { stage: number; dim?: number }) {
  const [cur, setCur] = useState(stage);
  const [prev, setPrev] = useState<number | null>(null);

  useEffect(() => {
    if (stage === cur) return;
    setPrev(cur);
    setCur(stage);
    const t = setTimeout(() => setPrev(null), 800);
    return () => clearTimeout(t);
  }, [stage, cur]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {prev !== null && <Scene stage={prev} />}
      <Scene key={cur} stage={cur} className={prev !== null ? "scene-enter" : ""} />
      <div className="absolute inset-0" style={{ background: `rgba(11,11,20,${dim})` }} />
    </div>
  );
}

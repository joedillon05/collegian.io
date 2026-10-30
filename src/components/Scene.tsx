"use client";

import { useMemo } from "react";
import { sceneFor, SCENE_W, SCENE_H, type Px } from "@/lib/pixelart";

interface Group {
  c?: string;
  d?: number;
  items: Px[];
}

function groupPx(px: Px[]): Group[] {
  const groups: Group[] = [];
  for (const p of px) {
    const last = groups[groups.length - 1];
    if (last && last.c === p.c && last.d === p.d && p.c) last.items.push(p);
    else groups.push({ c: p.c, d: p.d, items: [p] });
  }
  return groups;
}

export default function Scene({ stage, className = "" }: { stage: number; className?: string }) {
  const def = sceneFor(stage);
  const groups = useMemo(() => groupPx(def.px), [def]);
  return (
    <svg
      className={`scene ${className}`}
      viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {groups.map((g, gi) =>
        g.c ? (
          <g key={gi} className={`anim-${g.c}`} style={{ animationDelay: `${g.d ?? 0}s` }}>
            {g.items.map((p, i) => (
              <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={p.f} opacity={p.o} />
            ))}
          </g>
        ) : (
          g.items.map((p, i) => <rect key={`${gi}-${i}`} x={p.x} y={p.y} width={p.w} height={p.h} fill={p.f} opacity={p.o} />)
        ),
      )}
      {def.labels.map((l, i) => (
        <text key={i} x={l.x} y={l.y} fontSize={l.size} fill={l.f} textAnchor="middle" className="scene-label">
          {l.text}
        </text>
      ))}
    </svg>
  );
}

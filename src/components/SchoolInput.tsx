"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchSchools } from "@/lib/search";
import { SCHOOLS } from "@/data/schools";

interface Props {
  onSubmit: (schoolId: string) => void;
  disabled?: boolean;
  /** Bump to clear the box and refocus (new athlete). */
  resetToken: number;
  /** Bump to play the wrong-answer shake. */
  shakeToken: number;
}

export default function SchoolInput({ onSubmit, disabled, resetToken, shakeToken }: Props) {
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => searchSchools(q, SCHOOLS, 7), [q]);

  useEffect(() => setHi(0), [q]);
  useEffect(() => {
    setQ("");
    inputRef.current?.focus();
  }, [resetToken]);
  useEffect(() => {
    if (!shakeToken) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 400);
    return () => clearTimeout(t);
  }, [shakeToken]);

  function submit(i = hi) {
    const h = hits[i];
    if (!h || disabled) return;
    onSubmit(h.school.id);
    setQ("");
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(hits.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      setQ("");
    }
  }

  const open = q.trim().length > 0;

  return (
    <div className={`relative ${shaking ? "anim-shake" : ""}`}>
      <label htmlFor="school" className="sr-only">
        Which school did they play for?
      </label>
      <div className="px-panel flex items-center gap-2 px-3 py-2">
        <span className="font-pixel text-xs text-[#e63946]" aria-hidden="true">
          &gt;
        </span>
        <input
          ref={inputRef}
          id="school"
          type="text"
          value={q}
          disabled={disabled}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="TYPE THE SCHOOL…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          autoFocus
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls="school-options"
          aria-activedescendant={open && hits[hi] ? `opt-${hits[hi].school.id}` : undefined}
          className="w-full bg-transparent font-pixel text-[13px] uppercase tracking-wide outline-none placeholder:text-[#8d8a7e] sm:text-sm"
        />
        <span className="anim-blink font-pixel text-xs" aria-hidden="true">
          _
        </span>
      </div>
      {open && (
        <ul
          id="school-options"
          role="listbox"
          className="px-panel absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-auto p-1"
        >
          {hits.length === 0 && <li className="px-3 py-2 text-xl text-[#8d8a7e]">No school found. Keep typing…</li>}
          {hits.map((h, i) => (
            <li
              key={h.school.id}
              id={`opt-${h.school.id}`}
              role="option"
              aria-selected={i === hi}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHi(i)}
              onClick={() => submit(i)}
              className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 ${
                i === hi ? "bg-[#15152a] text-[#f7f3e8]" : ""
              }`}
            >
              <span className="font-pixel text-[11px] sm:text-xs">
                {h.school.name}
                {h.matched !== h.school.name && h.matched !== h.school.fullName && (
                  <span className={`ml-2 ${i === hi ? "text-[#ffd23f]" : "text-[#8d8a7e]"}`}>← {h.matched}</span>
                )}
              </span>
              <span className={`truncate text-right text-lg leading-none ${i === hi ? "text-[#d9d4c7]" : "text-[#6c6a62]"}`}>
                {h.school.fullName} · {h.school.state}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="px-panel max-h-[85dvh] w-full max-w-lg overflow-auto p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-pixel text-sm sm:text-base">{title}</h2>
          <button onClick={onClose} className="px-btn px-btn-secondary !px-3 !py-2 !text-[10px]" aria-label="Close">
            X
          </button>
        </div>
        <div className="text-xl leading-tight sm:text-2xl">{children}</div>
      </div>
    </div>
  );
}

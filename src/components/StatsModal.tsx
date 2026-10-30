"use client";

import Modal from "./Modal";
import { type HistoryEntry, currentStreak, maxStreak } from "@/lib/storage";
import { formatGpa, gpaOf } from "@/lib/grading";
import { STAGES } from "@/lib/stages";

interface Props {
  history: HistoryEntry[];
  todayET: string;
  onClose: () => void;
}

export default function StatsModal({ history, todayET, onClose }: Props) {
  const gpa = gpaOf(history.map((h) => h.gpa));
  const avg = history.length ? Math.round(history.reduce((s, h) => s + h.points, 0) / history.length) : 0;
  const best = history.reduce((m, h) => Math.max(m, h.stage), 0);
  const recent = history.slice(-10).reverse();
  return (
    <Modal title="TRANSCRIPT" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="GPA" value={formatGpa(gpa)} />
        <Stat label="DAYS PLAYED" value={String(history.length)} />
        <Stat label="STREAK" value={String(currentStreak(history, todayET))} />
        <Stat label="BEST STREAK" value={String(maxStreak(history))} />
        <Stat label="AVG SCORE" value={avg.toLocaleString("en-US")} />
        <Stat label="BEST STAGE" value={history.length ? STAGES[best].name : "--"} small />
      </div>
      <h3 className="mb-1 mt-4 font-pixel text-[10px] text-[#6c6a62]">RECENT GRADES</h3>
      {recent.length === 0 ? (
        <p>No daily games yet. Play today&apos;s puzzle to start your transcript.</p>
      ) : (
        <table className="w-full">
          <tbody>
            {recent.map((h) => (
              <tr key={h.dateET} className="border-t-2 border-dashed border-[#bdb59b]">
                <td className="py-1">#{h.number}</td>
                <td className="py-1 text-[#6c6a62]">{h.dateET}</td>
                <td className="py-1 text-right">{h.points.toLocaleString("en-US")}</td>
                <td className="py-1 text-right">{h.correct}/15</td>
                <td className="py-1 text-right font-pixel text-xs">{h.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="border-2 border-[#15152a] bg-[#f7f3e8] px-2 py-2 text-center">
      <div className="font-pixel text-[8px] text-[#6c6a62]">{label}</div>
      <div className={`mt-1 font-pixel ${small ? "text-[10px]" : "text-base"}`}>{value}</div>
    </div>
  );
}

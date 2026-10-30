"use client";

import Modal from "./Modal";

export default function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="HOW TO PLAY" onClose={onClose}>
      <ol className="list-decimal space-y-2 pl-6">
        <li>
          An athlete appears. <b>Type the college they played for</b> and pick it from the dropdown.
        </li>
        <li>
          15 athletes a day, 3 per tier. Tier 1 is NFL and NBA stars. By tier 5 you are deep in Olympic and
          college-only legends.
        </li>
        <li>
          <b>60 seconds</b> per athlete. The fastest answers score the most. After 15 seconds you only get the floor.
          Harder tiers are worth more.
        </li>
        <li>Wrong guesses are free, but the clock keeps running.</li>
        <li>
          <b>Skip</b> sends an athlete to the end of its tier for a second look. Skip the second look to give up for 0.
        </li>
        <li>Any school they ever played a game for counts. Transfers get credit for both.</li>
        <li>
          Points and correct answers carry you from <b>Orientation</b> to <b>Valedictorian</b>. Every day you get a
          grade and your <b>GPA</b> tracks your run.
        </li>
        <li>
          <b>Sport modes</b> use the same rules inside one sport. The five levels ramp by how well-known the athlete
          is within that sport, from household names to deep cuts. Each mode has its own daily puzzle.
        </li>
        <li>New puzzles every day at midnight Eastern. One scored attempt per mode per day. Practice as much as you like.</li>
      </ol>
      <div className="mt-4 flex justify-end">
        <button className="px-btn" onClick={onClose}>
          LET&apos;S GO
        </button>
      </div>
    </Modal>
  );
}

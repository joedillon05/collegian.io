/* Tiny chiptune synth on WebAudio. No assets, no dependencies. */

let ctx: AudioContext | null = null;
let enabled = false;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  if (on) {
    const c = getCtx();
    if (c && c.state === "suspended") void c.resume();
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  opts: { type?: OscillatorType; volume?: number; delay?: number; slideTo?: number } = {},
): void {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const { type = "square", volume = 0.06, delay = 0, slideTo } = opts;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const sfx = {
  correct(): void {
    tone(659, 0.07);
    tone(988, 0.12, { delay: 0.07 });
  },
  wrong(): void {
    tone(180, 0.22, { type: "sawtooth", slideTo: 80, volume: 0.05 });
  },
  skip(): void {
    tone(520, 0.08, { slideTo: 300, volume: 0.04 });
  },
  giveUp(): void {
    tone(300, 0.12, { slideTo: 120, volume: 0.05 });
    tone(150, 0.2, { delay: 0.12, slideTo: 70, volume: 0.05 });
  },
  timeout(): void {
    tone(220, 0.3, { type: "triangle", slideTo: 110 });
  },
  levelUp(): void {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1, { delay: i * 0.08 }));
    tone(1319, 0.3, { delay: 0.34, volume: 0.05 });
  },
  finish(): void {
    [392, 523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.13, { delay: i * 0.11 }));
  },
  tick(): void {
    tone(1500, 0.02, { volume: 0.02 });
  },
  select(): void {
    tone(900, 0.03, { volume: 0.02 });
  },
};

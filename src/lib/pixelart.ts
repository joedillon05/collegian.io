/**
 * Procedural placeholder pixel art for the ten career stages. Every scene is a
 * list of rectangles on a 96x54 grid rendered as crisp SVG, so it scales to
 * any viewport. Real commissioned art can replace a scene without touching
 * the game: keep the stage id and export a SceneDef.
 */
import { mulberry32, type Rng } from "./daily";

export const SCENE_W = 96;
export const SCENE_H = 54;

export interface Px {
  x: number;
  y: number;
  w: number;
  h: number;
  /** fill */
  f: string;
  /** animation class */
  c?: string;
  /** animation delay in seconds */
  d?: number;
  /** opacity */
  o?: number;
}

export interface Label {
  x: number;
  y: number;
  text: string;
  f: string;
  size: number;
}

export interface SceneDef {
  id: string;
  px: Px[];
  labels: Label[];
}

const C = {
  ink: "#15152a",
  black: "#0b0b14",
  white: "#f7f3e8",
  cream: "#f1e6c8",
  yellow: "#ffd23f",
  gold: "#ffb703",
  red: "#e63946",
  green: "#2dd36f",
  blue: "#3a86ff",
  purple: "#8338ec",
  orange: "#ff8c42",
  pink: "#ff6fb5",
  teal: "#2ec4b6",
  gray: "#7d8190",
  gray2: "#4b4e5c",
  grass: "#5ccc6c",
  grass2: "#3fa652",
  stone: "#ddd5bf",
  stone2: "#bfb59b",
  roof: "#6b3f33",
  wood: "#a3703f",
  wood2: "#7a5230",
  wall: "#ead9b4",
  wall2: "#d3bf93",
  floor: "#a9764f",
  floor2: "#8c5f3d",
  skin: "#f1c27d",
  skin2: "#c68642",
  skin3: "#8d5524",
  night0: "#0a0f2e",
  night1: "#141c4d",
  night2: "#1f2a66",
};

const SKIN = [C.skin, C.skin2, C.skin3];
const SHIRTS = [C.red, C.blue, C.yellow, C.green, C.purple, C.orange, C.teal, C.pink];

function px(x: number, y: number, w: number, h: number, f: string, extra: Partial<Px> = {}): Px {
  return { x, y, w, h, f, ...extra };
}

function bands(out: Px[], colors: string[], y0: number, y1: number): void {
  const n = colors.length;
  for (let i = 0; i < n; i++) {
    const a = Math.round(y0 + ((y1 - y0) * i) / n);
    const b = Math.round(y0 + ((y1 - y0) * (i + 1)) / n);
    out.push(px(0, a, SCENE_W, b - a, colors[i]));
  }
}

function cloud(out: Px[], x: number, y: number, d: number): void {
  const e = { c: "drift", d };
  out.push(px(x + 1, y, 5, 1, C.white, e), px(x, y + 1, 8, 1, C.white, e), px(x + 2, y + 2, 4, 1, C.white, e));
}

function sun(out: Px[], x: number, y: number): void {
  out.push(px(x + 1, y, 3, 5, C.yellow), px(x, y + 1, 5, 3, C.yellow));
  out.push(px(x + 2, y - 2, 1, 1, C.yellow), px(x + 2, y + 6, 1, 1, C.yellow), px(x - 2, y + 2, 1, 1, C.yellow), px(x + 6, y + 2, 1, 1, C.yellow));
}

function moon(out: Px[], x: number, y: number, bg: string): void {
  out.push(px(x + 1, y, 3, 5, C.cream), px(x, y + 1, 5, 3, C.cream), px(x + 2, y + 1, 3, 3, bg));
}

function stars(out: Px[], rng: Rng, n: number, x0: number, x1: number, y0: number, y1: number): void {
  for (let i = 0; i < n; i++) {
    out.push(px(x0 + Math.floor(rng() * (x1 - x0)), y0 + Math.floor(rng() * (y1 - y0)), 1, 1, C.white, { c: "twinkle", d: rng() * 2 }));
  }
}

/** y is the ground line; the tree stands on it. */
function tree(out: Px[], x: number, y: number): void {
  out.push(px(x + 2, y - 3, 2, 3, C.wood2));
  out.push(px(x, y - 5, 6, 2, C.grass2), px(x + 1, y - 7, 4, 2, C.grass2), px(x + 2, y - 8, 2, 1, C.grass2));
  out.push(px(x + 2, y - 6, 1, 1, C.grass), px(x + 1, y - 4, 1, 1, C.grass));
}

function hall(out: Px[], x: number, y: number, w: number, h: number): void {
  out.push(px(x - 1, y - 1, w + 2, 1, C.stone2));
  out.push(px(x, y - h, w, h, C.stone));
  out.push(px(x + 2, y - h - 1, w - 4, 1, C.roof), px(x + 6, y - h - 2, w - 12, 1, C.roof), px(x + 10, y - h - 3, w - 20, 1, C.roof));
  out.push(px(x + 14, y - h - 5, w - 28, 2, C.roof));
  for (let cx = x + 2; cx < x + w - 2; cx += 6) {
    out.push(px(cx, y - h + 2, 2, h - 2, C.white), px(cx + 1, y - h + 2, 1, h - 2, C.stone2));
    if (cx + 6 < x + w - 2) out.push(px(cx + 3, y - h + 3, 2, 3, C.night2), px(cx + 3, y - h + 8, 2, 3, C.night2));
  }
  const dx = x + Math.floor(w / 2) - 2;
  out.push(px(dx, y - 6, 4, 6, C.roof), px(dx + 1, y - 5, 2, 4, C.wood));
}

function person(out: Px[], x: number, y: number, shirt: string, skin: string, hair = C.ink): void {
  out.push(px(x, y - 7, 3, 1, hair), px(x, y - 6, 3, 2, skin), px(x, y - 4, 3, 3, shirt), px(x, y - 1, 1, 1, C.ink), px(x + 2, y - 1, 1, 1, C.ink));
}

function sitter(out: Px[], x: number, y: number, shirt: string, skin: string): void {
  out.push(px(x, y - 5, 3, 1, C.ink), px(x, y - 4, 3, 2, skin), px(x, y - 2, 3, 2, shirt));
}

function grad(out: Px[], x: number, y: number, skin: string, gown = C.ink): void {
  out.push(px(x - 1, y - 8, 5, 1, C.black), px(x, y - 9, 3, 1, C.black), px(x + 3, y - 8, 1, 2, C.gold));
  out.push(px(x, y - 7, 3, 2, skin), px(x, y - 5, 3, 5, gown), px(x + 1, y - 5, 1, 3, C.gold));
}

function podium(out: Px[], x: number, y: number): void {
  out.push(px(x, y - 6, 6, 1, C.wood2), px(x + 1, y - 5, 4, 5, C.wood), px(x + 2, y - 4, 2, 2, C.gold));
}

function platform(out: Px[], x: number, y: number, w: number, h = 2): void {
  out.push(px(x, y - h, w, h, C.wood), px(x, y - h, w, 1, C.wood2));
}

function bleachers(out: Px[], x: number, y: number, w: number, rows: number, rng?: Rng, dim = false): void {
  for (let i = 0; i < rows; i++) {
    const ry = y - (rows - i) * 2;
    out.push(px(x, ry, w, 2, i % 2 ? C.gray2 : C.gray));
    if (rng) {
      for (let cx = x + 1; cx < x + w - 1; cx += 2) {
        if (rng() < 0.8) out.push(px(cx, ry - 1, 1, 1, dim ? C.gray2 : SHIRTS[Math.floor(rng() * SHIRTS.length)]));
      }
    }
  }
}

function chairs(out: Px[], x: number, y: number, cols: number, rows: number, gap = 3): void {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = x + c * gap + (r % 2);
      const cy = y + r * 3;
      out.push(px(cx, cy - 2, 2, 1, C.white), px(cx, cy - 1, 2, 1, C.cream));
    }
  }
}

function bookshelf(out: Px[], x: number, y: number, w: number, h: number, rng: Rng, muted = false): void {
  out.push(px(x, y - h, w, h, C.wood2));
  for (let sy = y - h + 1; sy < y - 1; sy += 5) {
    let bx = x + 1;
    while (bx < x + w - 1) {
      const bw = rng() < 0.3 ? 2 : 1;
      const bh = 2 + Math.floor(rng() * 3);
      const col = muted ? [C.gray, C.stone2, C.wood, C.teal][Math.floor(rng() * 4)] : SHIRTS[Math.floor(rng() * SHIRTS.length)];
      out.push(px(bx, sy + 4 - bh, bw, bh, col));
      bx += bw;
    }
    out.push(px(x + 1, sy + 4, w - 2, 1, C.wood));
  }
}

function windowFrame(out: Px[], x: number, y: number, w: number, h: number, inside: string[]): void {
  out.push(px(x - 1, y - 1, w + 2, h + 2, C.wood2));
  const n = inside.length;
  for (let i = 0; i < n; i++) {
    const a = Math.round(y + (h * i) / n);
    const b = Math.round(y + (h * (i + 1)) / n);
    out.push(px(x, a, w, b - a, inside[i]));
  }
}

function windowBars(out: Px[], x: number, y: number, w: number, h: number): void {
  out.push(px(x + Math.floor(w / 2), y, 1, h, C.wood2), px(x, y + Math.floor(h / 2), w, 1, C.wood2));
}

function desk(out: Px[], x: number, y: number, w: number): void {
  out.push(px(x, y - 4, w, 1, C.wood), px(x, y - 3, 1, 3, C.wood2), px(x + w - 1, y - 3, 1, 3, C.wood2));
}

function laptop(out: Px[], x: number, y: number): void {
  out.push(px(x, y - 1, 6, 1, C.gray2), px(x, y - 5, 6, 4, C.gray2), px(x + 1, y - 4, 4, 2, C.blue, { c: "glow" }));
}

function mug(out: Px[], x: number, y: number, col = C.red): void {
  out.push(px(x, y - 2, 2, 2, col), px(x + 2, y - 2, 1, 1, col));
  out.push(px(x, y - 4, 1, 1, C.white, { c: "smoke", d: 0 }), px(x + 1, y - 5, 1, 1, C.white, { c: "smoke", d: 0.8 }));
}

function lamp(out: Px[], x: number, y: number, shade = C.green): void {
  out.push(px(x, y - 1, 3, 1, C.gray2), px(x + 1, y - 6, 1, 5, C.gray2), px(x - 1, y - 8, 5, 2, shade));
  out.push(px(x - 3, y - 6, 9, 5, C.yellow, { o: 0.14, c: "glow" }));
}

function balloons(out: Px[], rng: Rng, n: number, x0: number, x1: number, y0: number, y1: number): void {
  for (let i = 0; i < n; i++) {
    const x = x0 + Math.floor(rng() * (x1 - x0));
    const y = y0 + Math.floor(rng() * (y1 - y0));
    const d = rng() * 5;
    const col = SHIRTS[Math.floor(rng() * SHIRTS.length)];
    out.push(px(x, y, 2, 3, col, { c: "rise", d }), px(x + 1, y + 3, 1, 2, C.gray, { c: "rise", d }));
  }
}

function confetti(out: Px[], rng: Rng, n: number): void {
  for (let i = 0; i < n; i++) {
    out.push(px(Math.floor(rng() * SCENE_W), -2 - Math.floor(rng() * 10), 1, 1, SHIRTS[Math.floor(rng() * SHIRTS.length)], { c: "confetti", d: rng() * 6 }));
  }
}

function spotlight(out: Px[], x: number, y0: number, y1: number): void {
  const rows = y1 - y0;
  for (let i = 0; i < rows; i++) {
    const w = 4 + Math.floor((i * 28) / rows);
    out.push(px(x - Math.floor(w / 2), y0 + i, w, 1, C.yellow, { o: 0.12 }));
  }
}

function stadium(out: Px[], x: number, y: number, w: number): void {
  out.push(px(x, y - 11, w, 11, C.gray2));
  for (let cx = x + 2; cx < x + w - 2; cx += 5) out.push(px(cx, y - 9, 2, 2, C.night1), px(cx, y - 5, 2, 2, C.night1));
  for (const lx of [x + 4, x + w - 6]) {
    out.push(px(lx + 1, y - 21, 1, 10, C.gray), px(lx - 1, y - 22, 5, 1, C.yellow, { c: "glow" }));
  }
}

function car(out: Px[], x: number, y: number, col: string): void {
  out.push(px(x, y - 3, 10, 2, col), px(x + 2, y - 5, 6, 2, col), px(x + 3, y - 5, 2, 1, C.white), px(x + 6, y - 5, 2, 1, C.white));
  out.push(px(x + 1, y - 1, 2, 1, C.black), px(x + 7, y - 1, 2, 1, C.black));
}

function tent(out: Px[], x: number, y: number): void {
  out.push(px(x, y - 7, 12, 2, C.red), px(x + 2, y - 7, 2, 2, C.white), px(x + 6, y - 7, 2, 2, C.white), px(x + 10, y - 7, 2, 2, C.white));
  out.push(px(x, y - 5, 1, 5, C.gray2), px(x + 11, y - 5, 1, 5, C.gray2));
}

function grill(out: Px[], x: number, y: number): void {
  out.push(px(x, y - 4, 5, 2, C.ink), px(x + 1, y - 2, 1, 2, C.ink), px(x + 3, y - 2, 1, 2, C.ink));
  out.push(px(x + 1, y - 6, 1, 1, C.gray, { c: "smoke", d: 0 }), px(x + 3, y - 7, 1, 1, C.gray, { c: "smoke", d: 0.6 }), px(x + 2, y - 8, 1, 1, C.gray, { c: "smoke", d: 1.2 }));
}

function flag(out: Px[], x: number, y: number, col: string): void {
  out.push(px(x, y - 11, 1, 11, C.gray2), px(x + 1, y - 11, 5, 3, col, { c: "wave" }));
}

function frame(out: Px[], x: number, y: number, w: number, h: number): void {
  out.push(px(x, y, w, h, C.wood2), px(x + 1, y + 1, w - 2, h - 2, C.cream));
  out.push(px(x + 3, y + 3, w - 6, 1, C.gray2), px(x + 3, y + 5, w - 8, 1, C.gray), px(x + 3, y + 7, w - 9, 1, C.gray));
  out.push(px(x + w - 4, y + h - 4, 2, 2, C.gold));
}

function cabinet(out: Px[], x: number, y: number): void {
  out.push(px(x, y - 9, 5, 9, C.gray2));
  for (let i = 0; i < 3; i++) out.push(px(x + 1, y - 8 + i * 3, 3, 2, C.gray), px(x + 2, y - 7 + i * 3, 1, 1, C.ink));
}

function paperStack(out: Px[], x: number, y: number, n: number): void {
  for (let i = 0; i < n; i++) out.push(px(x + (i % 2), y - 1 - i, 6, 1, i % 2 ? C.white : C.cream));
}

function plant(out: Px[], x: number, y: number): void {
  out.push(px(x, y - 2, 4, 2, C.orange), px(x + 1, y - 5, 2, 3, C.grass2), px(x - 1, y - 6, 2, 2, C.grass), px(x + 3, y - 7, 2, 3, C.grass));
}

function groundGrass(out: Px[], y: number): void {
  out.push(px(0, y, SCENE_W, SCENE_H - y, C.grass), px(0, y, SCENE_W, 1, C.grass2));
  for (let x = 3; x < SCENE_W; x += 9) out.push(px(x, y + 4 + (x % 3), 2, 1, C.grass2));
}

function interior(out: Px[], wall: string, floor: string, floor2: string, split: number): void {
  out.push(px(0, 0, SCENE_W, split, wall), px(0, split, SCENE_W, SCENE_H - split, floor));
  for (let y = split; y < SCENE_H; y += 4) out.push(px(0, y, SCENE_W, 1, floor2));
}

function stringLights(out: Px[], y: number, rng: Rng): void {
  out.push(px(0, y, SCENE_W, 1, C.gray2));
  for (let x = 2; x < SCENE_W; x += 5) out.push(px(x, y + 1, 1, 1, SHIRTS[Math.floor(rng() * SHIRTS.length)], { c: "twinkle", d: rng() * 2 }));
}

// ---------------------------------------------------------------- scenes

function orientation(): SceneDef {
  const out: Px[] = [];
  const rng = mulberry32(1);
  bands(out, ["#6fc1ff", "#8fd3ff", "#b3e3ff"], 0, 34);
  sun(out, 82, 5);
  cloud(out, 8, 7, 0);
  cloud(out, 40, 4, 3);
  cloud(out, 64, 11, 6);
  groundGrass(out, 34);
  out.push(px(0, 43, SCENE_W, 3, C.stone2));
  hall(out, 30, 34, 36, 14);
  tree(out, 6, 34); tree(out, 18, 34); tree(out, 74, 34); tree(out, 86, 34);
  out.push(px(33, 36, 1, 9, C.wood2), px(62, 36, 1, 9, C.wood2), px(34, 36, 28, 4, C.yellow), px(34, 40, 28, 1, C.gold));
  const people = [40, 47, 54, 20, 72];
  people.forEach((x, i) => person(out, x, 49, SHIRTS[i % SHIRTS.length], SKIN[Math.floor(rng() * 3)]));
  return { id: "orientation", px: out, labels: [{ x: 48, y: 39.2, text: "WELCOME", f: C.ink, size: 2.6 }] };
}

function freshman(): SceneDef {
  const out: Px[] = [];
  const rng = mulberry32(2);
  interior(out, C.wall, C.floor, C.floor2, 38);
  stringLights(out, 3, rng);
  windowFrame(out, 62, 9, 18, 13, ["#6fc1ff", "#8fd3ff", "#b3e3ff"]);
  windowBars(out, 62, 9, 18, 13);
  out.push(px(40, 10, 6, 8, C.red), px(41, 11, 4, 2, C.yellow), px(41, 14, 4, 3, C.white));
  out.push(px(14, 12, 10, 7, C.teal), px(15, 13, 8, 5, C.white), px(16, 14, 6, 1, C.purple), px(16, 16, 4, 1, C.purple));
  out.push(px(18, 46, 30, 4, C.red), px(20, 47, 26, 2, C.pink));
  out.push(px(6, 36, 1, 10, C.wood2), px(6, 42, 14, 4, C.wood2), px(6, 41, 14, 1, C.white), px(9, 40, 11, 1, C.blue), px(7, 40, 2, 1, C.cream));
  out.push(px(28, 42, 6, 4, C.orange), px(30, 42, 1, 4, C.cream), px(29, 38, 5, 4, C.wood), px(31, 38, 1, 4, C.cream));
  out.push(px(36, 44, 4, 2, C.orange));
  desk(out, 66, 46, 20);
  laptop(out, 70, 42);
  mug(out, 80, 42);
  out.push(px(52, 39, 7, 7, C.white), px(53, 40, 5, 1, C.gray), px(57, 42, 1, 1, C.ink));
  person(out, 46, 46, C.yellow, SKIN[0]);
  return { id: "freshman", px: out, labels: [] };
}

function sophomore(): SceneDef {
  const out: Px[] = [];
  const rng = mulberry32(3);
  interior(out, "#3b4258", "#2a2f44", "#242839", 36);
  for (const lx of [8, 40, 72]) out.push(px(lx, 1, 10, 1, C.cream), px(lx, 2, 10, 1, C.yellow, { o: 0.3 }));
  out.push(px(44, 3, 8, 6, C.white, { o: 0.1 }));
  out.push(px(27, 5, 42, 24, C.gray2), px(28, 6, 40, 22, C.white));
  out.push(px(31, 8, 16, 2, C.blue), px(31, 12, 30, 1, C.gray), px(31, 14, 24, 1, C.gray));
  [4, 7, 5, 9, 6, 10].forEach((h, i) => out.push(px(32 + i * 5, 26 - h, 3, h, [C.blue, C.green, C.orange, C.purple, C.red, C.teal][i])));
  out.push(px(8, 30, 1, 6, C.gray2));
  podium(out, 10, 36);
  person(out, 11, 31, C.purple, SKIN[1]);
  for (let r = 0; r < 3; r++) {
    const y = 40 + r * 5;
    for (let x = 6 + (r % 2) * 4; x < 90; x += 11) {
      sitter(out, x + 1, y - 2, SHIRTS[Math.floor(rng() * SHIRTS.length)], SKIN[Math.floor(rng() * 3)]);
      out.push(px(x, y - 2, 7, 2, C.wood), px(x, y, 1, 2, C.wood2), px(x + 6, y, 1, 2, C.wood2));
    }
  }
  return { id: "sophomore", px: out, labels: [] };
}

function junior(): SceneDef {
  const out: Px[] = [];
  const rng = mulberry32(4);
  interior(out, "#1a1f44", "#2b2140", "#241b36", 40);
  windowFrame(out, 68, 6, 20, 14, [C.night0, C.night1, C.night2]);
  stars(out, rng, 9, 69, 87, 7, 17);
  moon(out, 76, 8, C.night0);
  windowBars(out, 68, 6, 20, 14);
  bookshelf(out, 4, 40, 24, 30, rng);
  bookshelf(out, 32, 40, 24, 30, rng);
  out.push(px(58, 10, 7, 7, C.white), px(61, 11, 1, 3, C.ink), px(61, 13, 2, 1, C.ink), px(59, 11, 5, 5, C.white, { o: 0 }));
  person(out, 70, 48, C.teal, SKIN[2]);
  desk(out, 60, 50, 32);
  laptop(out, 64, 46);
  mug(out, 74, 46);
  lamp(out, 84, 46, C.green);
  paperStack(out, 76, 46, 3);
  out.push(px(0, 36, SCENE_W, 1, C.wood2));
  return { id: "junior", px: out, labels: [] };
}

function senior(): SceneDef {
  const out: Px[] = [];
  const rng = mulberry32(5);
  bands(out, ["#ffb15c", "#ff8a6b", "#d9659a", "#7b4fa6", "#3d2d6b"], 0, 34);
  stars(out, rng, 6, 0, SCENE_W, 1, 8);
  cloud(out, 10, 9, 1);
  cloud(out, 50, 6, 4);
  stadium(out, 44, 34, 52);
  out.push(px(0, 34, SCENE_W, 20, "#4d4f5c"), px(0, 34, SCENE_W, 1, "#3c3e4a"));
  for (let x = 4; x < SCENE_W; x += 16) out.push(px(x, 47, 7, 1, C.yellow));
  tent(out, 4, 46);
  grill(out, 22, 46);
  car(out, 30, 46, C.red);
  car(out, 70, 50, C.blue);
  flag(out, 58, 46, C.yellow);
  out.push(px(62, 43, 5, 3, C.blue), px(62, 43, 5, 1, C.white));
  person(out, 16, 46, C.yellow, SKIN[0]); person(out, 46, 46, C.blue, SKIN[1]); person(out, 51, 46, C.red, SKIN[2]); person(out, 84, 46, C.green, SKIN[0]);
  return { id: "senior", px: out, labels: [] };
}

function deansList(): SceneDef {
  const out: Px[] = [];
  const rng = mulberry32(6);
  interior(out, "#f5e8cc", C.floor, C.floor2, 40);
  windowFrame(out, 8, 7, 26, 17, ["#ffd27a", "#ffb06a", "#ff8f7c", "#d87aa6"]);
  out.push(px(17, 15, 8, 2, C.yellow), px(19, 13, 4, 6, C.yellow));
  windowBars(out, 8, 7, 26, 17);
  frame(out, 46, 8, 20, 14);
  frame(out, 70, 11, 14, 10);
  bookshelf(out, 82, 48, 12, 22, rng);
  desk(out, 40, 48, 32);
  laptop(out, 44, 44);
  mug(out, 54, 44, C.blue);
  plant(out, 64, 44);
  paperStack(out, 58, 44, 2);
  person(out, 50, 48, C.purple, SKIN[1]);
  out.push(px(0, 36, SCENE_W, 1, C.wall2));
  return { id: "deans-list", px: out, labels: [] };
}

function honorsThesis(): SceneDef {
  const out: Px[] = [];
  const rng = mulberry32(7);
  interior(out, "#5b4a3b", "#3a2e26", "#302520", 38);
  cabinet(out, 4, 38); cabinet(out, 10, 38); cabinet(out, 16, 38);
  bookshelf(out, 28, 36, 44, 28, rng, true);
  out.push(px(82, 10, 8, 10, C.gray2), px(83, 11, 6, 8, C.night2));
  stars(out, rng, 3, 84, 88, 12, 18);
  person(out, 48, 50, C.teal, SKIN[0]);
  desk(out, 26, 52, 46);
  paperStack(out, 30, 48, 5); paperStack(out, 38, 48, 3); paperStack(out, 60, 48, 4);
  lamp(out, 66, 48, C.green);
  [C.red, C.blue, C.green, C.yellow].forEach((c, i) => out.push(px(44 + i * 2, 45, 1, 3, c)));
  return { id: "honors-thesis", px: out, labels: [] };
}

function summa(): SceneDef {
  const out: Px[] = [];
  const rng = mulberry32(8);
  bands(out, ["#6fc1ff", "#8fd3ff", "#b3e3ff"], 0, 32);
  sun(out, 10, 5);
  cloud(out, 30, 6, 2); cloud(out, 70, 9, 5);
  groundGrass(out, 32);
  tree(out, 2, 32); tree(out, 88, 32);
  platform(out, 26, 36, 44, 3);
  podium(out, 45, 33);
  out.push(px(28, 22, 40, 1, C.gray2), px(28, 23, 40, 5, C.white), px(28, 28, 40, 1, C.gray2));
  chairs(out, 14, 42, 22, 4, 3);
  grad(out, 6, 52, SKIN[0]); grad(out, 86, 52, SKIN[2]); grad(out, 78, 44, SKIN[1]);
  return { id: "summa", px: out, labels: [{ x: 48, y: 26.8, text: "REHEARSAL", f: C.ink, size: 2.6 }] };
}

function commencement(): SceneDef {
  const out: Px[] = [];
  const rng = mulberry32(9);
  bands(out, ["#6fc1ff", "#8fd3ff", "#b3e3ff"], 0, 30);
  cloud(out, 6, 4, 0); cloud(out, 80, 7, 4);
  bleachers(out, 0, 30, SCENE_W, 7, rng);
  groundGrass(out, 30);
  platform(out, 26, 40, 44, 3);
  podium(out, 45, 37);
  out.push(px(28, 10, 40, 1, C.gray2), px(28, 11, 40, 6, C.blue), px(28, 17, 40, 1, C.gray2));
  for (let x = 4; x < SCENE_W - 4; x += 6) grad(out, x, 50, SKIN[Math.floor(rng() * 3)]);
  for (let x = 8; x < SCENE_W - 4; x += 6) grad(out, x, 54, SKIN[Math.floor(rng() * 3)]);
  balloons(out, rng, 8, 2, 94, 14, 34);
  return { id: "commencement", px: out, labels: [{ x: 48, y: 15.4, text: "CONGRATS GRADS", f: C.white, size: 2.4 }] };
}

function valedictorian(): SceneDef {
  const out: Px[] = [];
  const rng = mulberry32(10);
  bands(out, [C.black, C.night0, C.night1], 0, 34);
  stars(out, rng, 14, 0, SCENE_W, 1, 12);
  bleachers(out, 0, 34, SCENE_W, 8, rng, true);
  out.push(px(0, 34, SCENE_W, 20, "#1c1a2e"));
  spotlight(out, 48, 0, 36);
  out.push(px(24, 6, 48, 1, C.gold), px(24, 7, 48, 6, C.yellow), px(24, 13, 48, 1, C.gold));
  platform(out, 20, 42, 56, 4);
  grad(out, 47, 40, SKIN[1]);
  podium(out, 45, 38);
  out.push(px(48, 30, 1, 2, C.gray), px(47, 29, 3, 1, C.ink));
  for (let x = 2; x < SCENE_W; x += 5) out.push(px(x, 48 + (x % 3), 3, 6, C.black));
  confetti(out, rng, 40);
  return { id: "valedictorian", px: out, labels: [{ x: 48, y: 11.2, text: "VALEDICTORIAN", f: C.ink, size: 2.8 }] };
}

let cache: SceneDef[] | null = null;

export function scenes(): SceneDef[] {
  if (!cache) cache = [orientation(), freshman(), sophomore(), junior(), senior(), deansList(), honorsThesis(), summa(), commencement(), valedictorian()];
  return cache;
}

export function sceneFor(stage: number): SceneDef {
  const all = scenes();
  return all[Math.max(0, Math.min(all.length - 1, stage))];
}

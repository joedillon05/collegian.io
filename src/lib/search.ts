import type { School } from "./types";

export interface SearchHit {
  school: School;
  score: number;
  /** Which string matched, for highlighting. */
  matched: string;
}

const DIACRITICS = /[̀-ͯ]/g;

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’'`.,()\-–—/]/g, " ")
    .replace(/\buniv(ersity)?\b/g, " ")
    .replace(/\bof\b/g, " ")
    .replace(/\bthe\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Damerau-Levenshtein (optimal string alignment) distance. */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

interface Indexed {
  school: School;
  /** [normalizedString, original] pairs: name first, then fullName, then aliases. */
  keys: Array<[string, string]>;
}

let INDEX: Indexed[] | null = null;
let INDEX_SOURCE: School[] | null = null;

function buildIndex(schools: School[]): Indexed[] {
  if (INDEX && INDEX_SOURCE === schools) return INDEX;
  INDEX = schools.map((school) => ({
    school,
    keys: [school.name, school.fullName, ...school.aliases].map((k) => [normalize(k), k] as [string, string]),
  }));
  INDEX_SOURCE = schools;
  return INDEX;
}

function allowedTypos(len: number): number {
  if (len < 4) return 0;
  if (len < 7) return 1;
  return 2;
}

function scoreKey(q: string, key: string): number {
  if (key === q) return 100;
  if (key.startsWith(q)) return 90 - Math.min(10, key.length - q.length) * 0.25;
  const tokens = key.split(" ");
  if (tokens.some((t) => t.startsWith(q))) return 80;
  // Multi-word query: every query token is a prefix of some key token, in order.
  const qTokens = q.split(" ");
  if (qTokens.length > 1) {
    let ti = 0;
    let ok = true;
    for (const qt of qTokens) {
      while (ti < tokens.length && !tokens[ti].startsWith(qt)) ti++;
      if (ti >= tokens.length) { ok = false; break; }
      ti++;
    }
    if (ok) return 78;
  }
  if (key.includes(q)) return 70;
  // Typo tolerance against the key's prefix (same length ±1) and whole tokens.
  const budget = allowedTypos(q.length);
  if (budget > 0) {
    let best = Infinity;
    for (const len of [q.length - 1, q.length, q.length + 1]) {
      if (len > 0 && len <= key.length) best = Math.min(best, editDistance(q, key.slice(0, len)));
    }
    for (const t of tokens) {
      if (Math.abs(t.length - q.length) <= budget) best = Math.min(best, editDistance(q, t));
    }
    if (best <= budget) return 60 - best * 8;
  }
  return 0;
}

export function searchSchools(query: string, schools: School[], limit = 7): SearchHit[] {
  const q = normalize(query);
  if (!q) return [];
  const index = buildIndex(schools);
  const hits: SearchHit[] = [];
  for (const entry of index) {
    let best = 0;
    let matched = entry.school.name;
    for (let i = 0; i < entry.keys.length; i++) {
      const [nk, raw] = entry.keys[i];
      // Prefer the canonical name slightly over aliases when scores tie.
      const s = scoreKey(q, nk) - (i === 0 ? 0 : 0.5);
      if (s > best) { best = s; matched = raw; }
    }
    if (best > 0) hits.push({ school: entry.school, score: best, matched });
  }
  hits.sort((a, b) => b.score - a.score || a.school.name.length - b.school.name.length || a.school.name.localeCompare(b.school.name));
  return hits.slice(0, limit);
}

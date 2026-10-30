/**
 * Turn data/candidates.csv (raw Wikidata rows) into data/review.csv: one row
 * per NEW athlete whose school resolves to a school in src/data/schools.ts,
 * in the same column layout as data/curation.csv plus a few helper columns.
 *
 *   npm run match:candidates
 *
 * Review rows, fix sport/number/active/tier/fame, set verified=human, and
 * paste them into data/curation.csv. Then `npm run build:pool`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { SCHOOLS } from "../src/data/schools.ts";
import { normalize } from "../src/lib/search.ts";

const CANDIDATES = new URL("../data/candidates.csv", import.meta.url);
const CURATION = new URL("../data/curation.csv", import.meta.url);
const OUT = new URL("../data/review.csv", import.meta.url);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((f) => f.trim() !== "")) rows.push(row); }
  return rows;
}

function records(url: URL): Record<string, string>[] {
  const lines = parseCsv(readFileSync(url, "utf8"));
  const header = lines.findIndex((l) => l[0] === "wikidata_id" || l[0] === "id");
  if (header < 0) throw new Error(`${url.pathname}: header row not found`);
  const cols = lines[header];
  return lines.slice(header + 1).map((cells) => Object.fromEntries(cols.map((c, i) => [c, (cells[i] ?? "").trim()])));
}

// Exact match on normalized name / full name / alias, plus a few generic
// rewrites ("University of X" -> "X", "X University" -> "X").
const schoolIndex = new Map<string, string>();
function addKey(key: string, id: string) {
  const k = normalize(key);
  if (k && !schoolIndex.has(k)) schoolIndex.set(k, id);
}
for (const s of SCHOOLS) {
  addKey(s.name, s.id);
  addKey(s.fullName, s.id);
  for (const a of s.aliases) addKey(a, s.id);
}
function resolveSchool(raw: string): string | null {
  const variants = [raw, raw.replace(/^the\s+/i, ""), raw.replace(/\s*\(.*\)\s*$/, ""), raw.replace(/\s+university$/i, ""), raw.replace(/^university of\s+/i, ""), raw.replace(/\s+college$/i, "")];
  for (const v of variants) {
    const hit = schoolIndex.get(normalize(v));
    if (hit) return hit;
  }
  return null;
}

const known = new Set(records(CURATION).map((r) => normalize(r.name)));

interface Cand {
  wid: string; name: string; sport: string; tier: string; gender: string; birth: string; links: number; schools: Set<string>; unresolved: Set<string>;
}
const byId = new Map<string, Cand>();
let droppedKnown = 0;
for (const r of records(CANDIDATES)) {
  if (!r.name || /^Q\d+$/.test(r.name)) continue; // unlabeled item
  if (known.has(normalize(r.name))) { droppedKnown++; continue; }
  let c = byId.get(r.wikidata_id);
  if (!c) {
    c = { wid: r.wikidata_id, name: r.name, sport: r.sport, tier: r.tier_hint, gender: r.gender, birth: r.birth_year, links: Number(r.sitelinks) || 0, schools: new Set(), unresolved: new Set() };
    byId.set(r.wikidata_id, c);
  }
  const id = resolveSchool(r.school_name);
  if (id) c.schools.add(id); else c.unresolved.add(r.school_name);
}

const cands = [...byId.values()].filter((c) => c.schools.size > 0);
// Fame suggestion: rank by sitelinks within sport, cut into fifths.
const bySport = new Map<string, Cand[]>();
for (const c of cands) (bySport.get(c.sport) ?? bySport.set(c.sport, []).get(c.sport)!).push(c);
const fameOf = new Map<string, number>();
for (const list of bySport.values()) {
  list.sort((a, b) => b.links - a.links);
  list.forEach((c, i) => fameOf.set(c.wid, Math.min(5, Math.floor((i * 5) / list.length) + 1)));
}

const slug = (s: string) => normalize(s).replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, "-");
const csv = (v: string) => `"${v.replace(/"/g, '""')}"`;
const out = ["id,name,sport,league,number,active,gender,tier,fame,schools,source,verified,wikidata_id,birth_year,sitelinks,unresolved_schools"];
cands.sort((a, b) => a.sport.localeCompare(b.sport) || b.links - a.links);
for (const c of cands) {
  out.push([
    slug(c.name), csv(c.name), c.sport, "", "", "", c.gender, c.tier, String(fameOf.get(c.wid) ?? 3),
    [...c.schools].join(";"), `https://www.wikidata.org/wiki/${c.wid}`, "", c.wid, c.birth, String(c.links), csv([...c.unresolved].join("; ")),
  ].join(","));
}
writeFileSync(OUT, out.join("\n") + "\n");

const counts = new Map<string, number>();
for (const c of cands) counts.set(c.sport, (counts.get(c.sport) ?? 0) + 1);
console.log(`candidates: ${byId.size + droppedKnown} people | already in pool: ${droppedKnown} | school resolved: ${cands.length} -> data/review.csv`);
for (const [sport, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${sport.padEnd(16)} ${n}`);
const unresolvedTop = new Map<string, number>();
for (const c of byId.values()) for (const u of c.unresolved) unresolvedTop.set(u, (unresolvedTop.get(u) ?? 0) + 1);
console.log("most common unresolved schools (add aliases or non-D1 entries if they matter):");
for (const [name, n] of [...unresolvedTop.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  ${String(n).padStart(4)}  ${name}`);

/**
 * Seed candidate athletes from Wikidata (CC0) for curation.
 *
 * Usage (from a machine with internet access):
 *   npm run import:wikidata          # writes data/candidates.csv
 *   npm run match:candidates         # resolves schools, drops known names -> data/review.csv
 *
 * One row per athlete/school pair. Nothing from this file enters the game
 * directly: data/curation.csv is the hand-reviewed source of truth.
 *
 * Each sport query requires an athlete occupation (so hobbyist golfers such
 * as politicians drop out) and a school located in the United States, then
 * ranks by Wikipedia sitelink count as a fame proxy. Wikidata's "educated at"
 * claim does not say whether the person competed for the school; the human
 * pass has to check that.
 */
import { writeFileSync } from "node:fs";

const ENDPOINT = "https://query.wikidata.org/sparql";
const OUT = new URL("../data/candidates.csv", import.meta.url);

// sport QID (P641), occupation QID (P106), display label, Classic tier hint,
// minimum sitelinks (raise it for huge sports so the query finishes in 60s).
const SPORTS: Array<{ sport: string; occupation: string; label: string; tierHint: number; minLinks: number }> = [
  { sport: "Q41323", occupation: "Q19204627", label: "Football", tierHint: 1, minLinks: 8 },      // American football player
  { sport: "Q5372", occupation: "Q3665646", label: "Basketball", tierHint: 1, minLinks: 12 },     // basketball player
  { sport: "Q5369", occupation: "Q10871364", label: "Baseball", tierHint: 2, minLinks: 8 },       // baseball player
  { sport: "Q41466", occupation: "Q11774891", label: "Hockey", tierHint: 2, minLinks: 8 },        // ice hockey player
  { sport: "Q2736", occupation: "Q937857", label: "Soccer", tierHint: 3, minLinks: 12 },          // association football player
  { sport: "Q5377", occupation: "Q11303721", label: "Golf", tierHint: 4, minLinks: 6 },           // golfer
  { sport: "Q847", occupation: "Q10833314", label: "Tennis", tierHint: 4, minLinks: 8 },          // tennis player
  { sport: "Q542", occupation: "Q11513337", label: "Track & Field", tierHint: 4, minLinks: 8 },   // athletics competitor
  { sport: "Q31920", occupation: "Q10843402", label: "Swimming", tierHint: 4, minLinks: 8 },      // swimmer
  { sport: "Q43450", occupation: "Q16004431", label: "Gymnastics", tierHint: 4, minLinks: 6 },    // gymnast
  { sport: "Q42486", occupation: "Q13381863", label: "Wrestling", tierHint: 5, minLinks: 6 },     // sport wrestler
  { sport: "Q185851", occupation: "Q13365117", label: "Lacrosse", tierHint: 5, minLinks: 4 },     // lacrosse player
  { sport: "Q1734", occupation: "Q15117302", label: "Volleyball", tierHint: 5, minLinks: 6 },     // volleyball player
  { sport: "Q4543", occupation: "Q16876195", label: "Softball", tierHint: 5, minLinks: 4 },       // softball player
  { sport: "Q2208", occupation: "Q15306067", label: "Diving", tierHint: 5, minLinks: 5 },         // diver
];

function sparql(s: (typeof SPORTS)[number]): string {
  return `
SELECT DISTINCT ?person ?personLabel ?school ?schoolLabel ?birth ?genderLabel ?sitelinks WHERE {
  ?person wdt:P106 wd:${s.occupation} ;
          wdt:P69 ?school ;
          wikibase:sitelinks ?sitelinks .
  ?school wdt:P17 wd:Q30 .                 # school is in the United States
  OPTIONAL { ?person wdt:P569 ?birth . }
  OPTIONAL { ?person wdt:P21 ?gender . }
  FILTER(?sitelinks >= ${s.minLinks})      # fame floor: drop near-unknowns
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?sitelinks)
LIMIT 1500`;
}

interface Binding {
  [k: string]: { value: string } | undefined;
}

async function fetchSport(s: (typeof SPORTS)[number], attempt = 1): Promise<Binding[] | null> {
  const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(sparql(s))}`;
  const res = await fetch(url, { headers: { "User-Agent": "collegian.io data import (contact: see repo)" } });
  if (!res.ok) {
    console.error(`${s.label}: HTTP ${res.status}${attempt === 1 ? ", retrying once" : ""}`);
    if (attempt === 1) {
      await new Promise((r) => setTimeout(r, 5000));
      return fetchSport(s, 2);
    }
    return null;
  }
  const json = (await res.json()) as { results: { bindings: Binding[] } };
  return json.results.bindings;
}

async function run(): Promise<void> {
  const rows: string[] = ["wikidata_id,name,sport,tier_hint,school_wikidata_id,school_name,birth_year,gender,sitelinks"];
  const failed: string[] = [];
  for (const s of SPORTS) {
    const bindings = await fetchSport(s);
    if (!bindings) { failed.push(s.label); continue; }
    for (const b of bindings) {
      const id = (v?: { value: string }) => (v ? v.value.replace(/^.*\//, "") : "");
      const csv = (v: string) => `"${v.replace(/"/g, '""')}"`;
      rows.push(
        [
          id(b.person),
          csv(b.personLabel?.value ?? ""),
          s.label,
          String(s.tierHint),
          id(b.school),
          csv(b.schoolLabel?.value ?? ""),
          (b.birth?.value ?? "").slice(0, 4),
          b.genderLabel?.value === "female" ? "f" : b.genderLabel?.value === "male" ? "m" : "",
          b.sitelinks?.value ?? "",
        ].join(","),
      );
    }
    console.error(`${s.label}: ${bindings.length} rows`);
    await new Promise((r) => setTimeout(r, 1500)); // be polite to the endpoint
  }
  writeFileSync(OUT, rows.join("\n") + "\n");
  console.error(`wrote ${rows.length - 1} rows -> data/candidates.csv`);
  if (failed.length) console.error(`FAILED (re-run later or raise minLinks): ${failed.join(", ")}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

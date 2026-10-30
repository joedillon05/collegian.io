/**
 * Seed candidate athletes from Wikidata (CC0) for curation.
 *
 * Usage (from a machine with internet access):
 *   npx tsx scripts/import-wikidata.ts > data/candidates.csv
 *
 * It queries, per sport, people who are US nationals (or educated at a US
 * school) with an `educated at` (P69) claim, and writes one row per
 * athlete/school pair. Nothing from this file enters the game directly:
 * data/curation.csv is the hand-reviewed source of truth, and
 * scripts/build-pool.ts turns it into src/data/athletes.generated.ts.
 *
 * This container cannot reach query.wikidata.org, so the script has not been
 * run here. Expect to iterate on the SPARQL (Wikidata's sport taxonomy is
 * messy) and to cap each query with LIMIT to stay under the 60s timeout.
 */

const ENDPOINT = "https://query.wikidata.org/sparql";

// Wikidata QIDs for sports we care about, with the sport label we display.
const SPORTS: Array<{ qid: string; sport: string; tierHint: number }> = [
  { qid: "Q41323", sport: "Football", tierHint: 1 },      // American football
  { qid: "Q5372", sport: "Basketball", tierHint: 1 },
  { qid: "Q5369", sport: "Baseball", tierHint: 2 },
  { qid: "Q41466", sport: "Hockey", tierHint: 2 },         // ice hockey
  { qid: "Q2736", sport: "Soccer", tierHint: 3 },          // association football
  { qid: "Q5377", sport: "Golf", tierHint: 4 },
  { qid: "Q847", sport: "Tennis", tierHint: 4 },
  { qid: "Q542", sport: "Track & Field", tierHint: 4 },    // athletics
  { qid: "Q31920", sport: "Swimming", tierHint: 4 },
  { qid: "Q43450", sport: "Gymnastics", tierHint: 4 },
  { qid: "Q42486", sport: "Wrestling", tierHint: 5 },
  { qid: "Q185851", sport: "Lacrosse", tierHint: 5 },
  { qid: "Q1734", sport: "Volleyball", tierHint: 5 },
  { qid: "Q4543", sport: "Softball", tierHint: 5 },
  { qid: "Q2208", sport: "Diving", tierHint: 5 },
];

function sparql(sportQid: string): string {
  return `
SELECT ?person ?personLabel ?school ?schoolLabel ?birth ?genderLabel ?sitelinks WHERE {
  ?person wdt:P106 ?occupation ;
          wdt:P641 wd:${sportQid} ;
          wdt:P69 ?school ;
          wikibase:sitelinks ?sitelinks .
  ?school wdt:P17 wd:Q30 .                 # school is in the United States
  OPTIONAL { ?person wdt:P569 ?birth . }
  OPTIONAL { ?person wdt:P21 ?gender . }
  FILTER(?sitelinks >= 8)                  # fame floor: drop near-unknowns
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?sitelinks)
LIMIT 1500`;
}

interface Binding {
  [k: string]: { value: string } | undefined;
}

async function run(): Promise<void> {
  const rows: string[] = ["wikidata_id,name,sport,tier_hint,school_wikidata_id,school_name,birth_year,gender,sitelinks"];
  for (const s of SPORTS) {
    const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(sparql(s.qid))}`;
    const res = await fetch(url, { headers: { "User-Agent": "collegian.io data import (contact: see repo)" } });
    if (!res.ok) {
      console.error(`${s.sport}: HTTP ${res.status}`);
      continue;
    }
    const json = (await res.json()) as { results: { bindings: Binding[] } };
    for (const b of json.results.bindings) {
      const id = (v?: { value: string }) => (v ? v.value.replace(/^.*\//, "") : "");
      const csv = (v: string) => `"${v.replace(/"/g, '""')}"`;
      rows.push(
        [
          id(b.person),
          csv(b.personLabel?.value ?? ""),
          s.sport,
          String(s.tierHint),
          id(b.school),
          csv(b.schoolLabel?.value ?? ""),
          (b.birth?.value ?? "").slice(0, 4),
          b.genderLabel?.value === "female" ? "f" : b.genderLabel?.value === "male" ? "m" : "",
          b.sitelinks?.value ?? "",
        ].join(","),
      );
    }
    console.error(`${s.sport}: ${json.results.bindings.length} rows`);
    await new Promise((r) => setTimeout(r, 1500)); // be polite to the endpoint
  }
  process.stdout.write(rows.join("\n") + "\n");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

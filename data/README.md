# Athlete data pipeline

The game ships with a hand-verified sample pool in `src/data/athletes.ts`
(about 110 athletes). The launch target is 2,000.

## Flow

1. `scripts/import-wikidata.ts` pulls candidates from Wikidata into
   `data/candidates.csv` (not committed; regenerate as needed).
2. Review candidates into `data/curation.csv`. Only rows with
   `verified = yes` make it into the game.
3. `scripts/build-pool.ts` (to be written with the database phase) validates
   `curation.csv` against the schools list and emits the pool.

## curation.csv columns

| column | meaning |
|---|---|
| `id` | slug, e.g. `patrick-mahomes` |
| `name` | display name |
| `sport` | shown on the clue card: Football, Basketball, Hockey, Golf, ... |
| `league` | NFL, NBA, WNBA, PGA Tour, USATF, ... (curation only) |
| `number` | jersey number as displayed, blank for sports without one |
| `active` | `yes` / `no`. Re-check every season. |
| `gender` | `m` / `f` (used only for the two-women-per-day cap) |
| `tier` | 1 Prime Time, 2 Pro Ranks, 3 Legends & Pioneers, 4 Olympic Stage, 5 Deep Cuts |
| `schools` | `;`-separated school ids from `src/data/schools.ts`. Every school where they played a game. |
| `source` | URL you verified against |
| `verified` | `yes` once a human has checked the row |

## Rules of inclusion

- Must have competed for a US college in the sport. Athletes who attended but
  never played (e.g. turned pro before competing) are out.
- Any school where they played a game counts as a correct answer, JUCO included.
  Add non-D1 schools to the `OTHER` list in `src/data/schools.ts` as needed.
- No photos, no logos. Names and facts only.

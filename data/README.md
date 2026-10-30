# Athlete data pipeline

The game ships the pool in `src/data/athletes.generated.ts`, built from
`data/curation.csv` by `npm run build:pool`. The launch target is 2,000
human-verified rows.

## Flow

1. `scripts/import-wikidata.ts` pulls candidates from Wikidata into
   `data/candidates.csv` (not committed; regenerate as needed).
2. Review candidates into `data/curation.csv`. Rows with `verified` blank
   never ship; `claude` means the row was drafted from Claude's knowledge and
   still needs a human check; `human` means someone verified it against the
   source URL.
3. `npm run build:pool` validates every row (slug ids, unique ids and names,
   known school ids, tier 1-5, yes/no, m/f) and regenerates
   `src/data/athletes.generated.ts`. Commit the generated file.

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
| `tier` | Classic-mode difficulty: 1 Prime Time, 2 Pro Ranks, 3 Legends & Pioneers, 4 Olympic Stage, 5 Deep Cuts |
| `fame` | Within-sport fame for sport modes: 1 household name, 2 every fan knows, 3 regulars, 4 diehards, 5 deep cut |
| `schools` | `;`-separated school ids from `src/data/schools.ts`. Every school where they played a game. |
| `source` | URL you verified against |
| `verified` | `human`, `claude`, or blank (blank rows are excluded) |

## Rules of inclusion

- Must have competed for a US college in the sport. Athletes who attended but
  never played (e.g. turned pro before competing) are out.
- Any school where they played a game counts as a correct answer, JUCO included.
  Add non-D1 schools to the `OTHER` list in `src/data/schools.ts` as needed.
- No photos, no logos. Names and facts only.

## Current state

The first ~1,500 rows were drafted by Claude in one pass without web access,
so every row is marked `verified = claude`. Known soft spots to check first:

- `active` for anyone who changed teams or retired during the 2025-26
  seasons; it was set from knowledge as of mid-2026.
- Jersey `number` for players who changed teams in 2025 (NBA rookies and
  NFL free agents especially).
- Tier placement is a judgment call; tiers 1 and 3 are the thinnest, so
  promote fan-favorite tier 2 names into tier 1 as you review.
- `fame` was seeded from the tier plus per-sport overrides in one pass. It
  only matters relative to the same sport, so review it sport by sport.
- Transfers: a second school was added only when the athlete played games
  there. JUCO and non-D1 stops were added to `src/data/schools.ts` only for
  a handful of famous cases (Cam Newton, Jimmy Butler, Tyreek Hill...).

Wikidata is a seed for *new* names, not a verifier: its `educated at` claim
does not say whether the person competed for the school.

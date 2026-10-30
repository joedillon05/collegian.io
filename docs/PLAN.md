# collegian.io — Product & Build Plan

> Status: prototype playable (Phase 1 done). Decisions below are locked unless
> marked *open*.

## 1. Concept

A daily, Kahoot-style speed trivia game. An athlete appears on screen and the
player types the college that athlete played for. The day's athletes get
progressively more niche:

| Tier | Label | Pool |
|---|---|---|
| 1 | Prime Time | NFL / NBA household names |
| 2 | Pro Ranks | deeper NFL / NBA, MLB, NHL |
| 3 | Legends & Pioneers | WNBA, soccer, college-only legends (Heisman winners, March Madness heroes) |
| 4 | Olympic Stage | golf, tennis, track, swimming, gymnastics, wrestling |
| 5 | Deep Cuts | lacrosse, softball, volleyball, diving, Paralympians, PWHL... |

Scope: athletes who competed for a US college in that sport. Attending without
playing does not count. Any school where they played a game is a correct
answer (JUCO included).

Points convert into progress through a college career. Like Krillion's ocean
getting deeper as you score, the background evolves from **Orientation** all
the way to **Valedictorian at the graduation podium**.

Visual direction: Krillion-style chunky outlines and pixel typography, with
retro-video-game animations (screen shake, score pop-ups, level-up banners,
sprite confetti, CRT scanlines and optional chiptune SFX).

## 2. Core loop (locked)

| Element | Decision |
|---|---|
| Athletes per day | **15**, 3 per tier, tiers in order 1 → 5 |
| Timer | **60 s** per athlete. Resets after a correct guess or a skip. Runs out = 0 points, move on. |
| Points | Linear decay from max at 0 s to the floor at **15 s**; 15 s+ scores the floor. Max/floor = **100t / 50t** for tier *t*. Perfect fast day = 4,500. |
| Lives | None. |
| Wrong guesses | Free. Stay on the athlete, clock keeps running. |
| Skip | Sends the athlete to the **end of its tier**. When it returns ("second look") the skip button becomes **Give Up** for 0 points. If it was the last athlete in its tier it returns immediately. |
| Hints | None. |
| Clue card | **Name, Sport, Number, Active/Retired.** No photos, no color hints. |
| Reveal | No fun facts. Give-ups and timeouts flash the correct school in a toast and move on; everything is listed on the report card. |
| Input | Type, fuzzy dropdown, **must pick from the dropdown** (Enter takes the highlighted match). "USC" shows both Southern California and South Carolina. |
| Attempts | **One scored attempt per day**; unlimited unscored practice. |
| Reset | **Midnight US Eastern.** |
| Grade & GPA | Each daily run gets a letter grade. **GPA** = average grade points over daily games (4.0 scale). No other cross-day progression. |
| Women per day | Usually 0–1, **cap 2**. |
| Share | Wordle-style grid: 🟩 correct, 🟨 correct on second look, ⬛ miss. |
| Leaderboard | Global daily top list with anonymous display names (needs the backend phase). |
| Accounts | None. Anonymous device token. |
| Ads | Planned. Leave room in the layout. |

## 3. Progression ladder (locked)

Both thresholds must be met.

| # | Stage | Correct ≥ | Points ≥ |
|---|---|---|---|
| 0 | Orientation | 0 | 0 |
| 1 | Freshman | 1 | 0 |
| 2 | Sophomore | 3 | 0 |
| 3 | Junior | 5 | 0 |
| 4 | Senior | 7 | 0 |
| 5 | Dean's List | 9 | 30% |
| 6 | Honors Thesis | 11 | 40% |
| 7 | Summa Cum Laude | 13 | 50% |
| 8 | Commencement | 14 | 60% |
| 9 | Valedictorian | 15 | 80% |

A perfect-but-slow run tops out at Summa Cum Laude; Valedictorian needs every
athlete right at a strong pace.

## 4. Grading

`composite = 0.65 × (correct / 15) + 0.35 × pace`, where pace = points earned
divided by the max points of the athletes you got right. Letters use a
standard scale compressed so that a mid run lands B-/C+: A+ ≥ 0.95, A ≥ 0.88,
A- ≥ 0.82, B+ ≥ 0.76, B ≥ 0.70, B- ≥ 0.64, C+ ≥ 0.58, C ≥ 0.52, C- ≥ 0.46,
D+ ≥ 0.40, D ≥ 0.34, D- ≥ 0.28, else F. GPA points: A+/A 4.0, A- 3.7, B+ 3.3,
B 3.0, B- 2.7, C+ 2.3, C 2.0, C- 1.7, D+ 1.3, D 1.0, D- 0.7, F 0.

## 5. Daily puzzle

- Deterministic generator seeded by the ET date (`src/lib/daily.ts`): 3 per
  tier, women budget drawn 0/1/2 (1:2:1) and capped at 2, no school twice in a
  day when avoidable. Practice uses the same generator with a random seed.
- Puzzle #1 = 2026-10-30. Rollover checked every 30 s while the tab is open.
- With the database phase the generator also excludes athletes used in the last
  90 days and publishes rows ahead of time for review.

## 6. Data

- `src/data/schools.ts`: every NCAA D1 school (365) with aliases, abbreviations
  and mascots; non-D1 schools added only when an athlete needs them.
- `src/data/athletes.ts`: ~110 verified sample athletes across all tiers.
- `scripts/import-wikidata.ts` + `data/README.md`: pipeline to 2,000 curated
  athletes (Wikidata seed → curation CSV → generated pool).
- No photos, no logos. School colors may be used for accents later.

## 7. Architecture

- Next.js 16 (App Router) + TypeScript + Tailwind v4, Vercel hosting.
- Pure game engine in `src/lib/engine.ts` (reducer, scoring, skip queue,
  stages) with Vitest coverage; UI in `src/components`.
- Client-side fuzzy autocomplete over the shipped schools list (`src/lib/search.ts`).
- Persistence today: `localStorage` (daily state, grade history, settings).
- Backend phase: Postgres on Supabase + Drizzle; server-side answer checking
  and timing; anonymous player token; daily leaderboard. Schema sketch:

```
schools, school_aliases, athletes, athlete_schools, daily_puzzles,
daily_puzzle_items, players, plays, play_answers
```

## 8. Roadmap

| Phase | Goal | Status |
|---|---|---|
| 0 | Scaffold: Next.js, Tailwind, fonts, tests | done |
| 1 | Playable prototype: engine, autocomplete, timer, skip rules, ladder, scenes, grade/GPA, share, practice | done |
| 2 | Data: run the Wikidata import, curate to 500 then 2,000 athletes, add non-D1 schools as needed | next |
| 3 | Backend: Postgres, daily publish + review, server validation, anonymous players, leaderboard | |
| 4 | Polish: commissioned pixel scenes, more SFX, OG share image, ad slot, analytics | |
| 5 | Growth: archive of past days, SEO, domain launch | |

## 9. Open items

- Art: procedural placeholder scenes are in; decide when to commission real
  pixel art (same ten stage ids).
- Analytics provider (Plausible vs Vercel Analytics) and ad network.
- Whether timeouts should also get a second look (currently: no, a timeout is
  final).

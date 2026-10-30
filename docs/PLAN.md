# collegian.io — Product & Build Plan (draft v0)

> Status: discovery. Nothing here is final. Every "Default" below is a
> recommendation that can be overridden; see **Open questions** at the end.

## 1. Concept

A daily, Kahoot-style speed trivia game. An athlete appears on screen and the
player types the college that athlete attended. The day's athletes get
progressively more niche:

1. NFL / NBA household names
2. Deeper NFL / NBA, MLB, NHL
3. WNBA / women's basketball, MLS / USWNT, college-only legends
4. Olympic and individual sports: golf, tennis, track, swimming, gymnastics
5. Deep cuts: softball, volleyball, wrestling, lacrosse, Paralympians, etc.

Scope is athletes who competed at a US college (any division, JUCO included).

Points convert into progress through a college career. Like Krillion's ocean
getting deeper as you score, the background evolves from **Orientation** all
the way to **Valedictorian at the graduation podium**.

Visual direction: Krillion-style chunky outlines and pixel typography, with
retro-video-game animations (screen shake, score pop-ups, level-up banners,
sprite confetti, optional CRT scanlines and chiptune SFX).

## 2. Core loop (proposed defaults)

| Element | Default | Notes |
|---|---|---|
| Athletes per day | 10 | Krillion uses 7. 10 gives a clean tier curve (2 per tier). |
| Timer per athlete | 20 s | Kahoot's default. Points decay as the clock runs. |
| Lives | None | Wrong answer = 0 points for that athlete, streak resets, play continues. |
| Attempts per day | 1 official | Unlimited **practice** mode on random sets; **archive** for past days. |
| Input | Type + autocomplete | Enter submits the top autocomplete match. Arrow keys / tap to pick another. |
| Hints | 2 per game | Reveal conference, state, or first letter. Each hint costs 25% of that athlete's max points. |
| Clue card | Name, sport, league, position, pro teams, years active | **No photos** (licensing). Pixel jersey silhouette in team colors instead. |
| On wrong / timeout | Reveal correct school(s) + short fact, 2 s, then next | |
| End of game | Rank reached, score, per-athlete grid, share button, stats | |

## 3. Scoring (Kahoot-style)

For each athlete with base points `B` and timer `T` seconds, answered correctly
at `t` seconds:

```
points = round(B * (1 - (t / T) / 2))      # full speed = B, at the buzzer = B/2
streak_bonus = min(100 * (streak - 1), 500) # 2nd correct in a row +100, cap +500
hint_penalty = 0.25 * B per hint used
```

Base points by tier: 500 / 750 / 1000 / 1250 / 1500. Theoretical max for a
10-athlete day with 2 per tier is roughly 10,000 + streak bonuses ≈ 14,000.

## 4. Progression ladder (proposed)

Points earned during the day's run unlock stages. Stage thresholds are tuned so
a casual player reaches Junior/Senior and only a near-perfect run reaches
Valedictorian.

| # | Stage | Scene (pixel background) |
|---|---|---|
| 0 | Orientation | Campus quad, welcome banner, name-tag lanyard |
| 1 | Freshman | Dorm move-in, boxes, lofted bed |
| 2 | Sophomore | Lecture hall, projector |
| 3 | Junior | Library all-nighter, coffee, laptop glow |
| 4 | Senior | Tailgate outside the stadium |
| 5 | Dean's List | Certificate on the wall, sunrise office hours |
| 6 | Honors Thesis | Lab / archive, binder stack |
| 7 | Summa Cum Laude | Cords and stole, commencement rehearsal |
| 8 | Commencement | Cap and gown, stadium full of chairs |
| 9 | Valedictorian | At the podium, mic, crowd, cap toss on finish |

Optional cross-day meta-progression: lifetime "credits" or a GPA that rises
with daily results, shown on the stats screen.

## 5. Athlete pool & tiering

- Target pool at launch: 500 verified athletes, growing to 2,000+.
- Each athlete has a `tier` (1–5) and a `fame_score` (1–100) used by the
  generator to shape the daily curve.
- Exclude athletes who never attended a US college (v1). A later "Straight to
  the pros" trap answer is possible.
- Transfers / multi-school athletes: **any** school where the athlete competed
  in that sport counts as correct; one is flagged `is_primary` and all are
  shown on reveal.

## 6. Schools, aliases & answer matching

- Canonical `schools` table: every NCAA D1 school first (~360), then D2 / D3 /
  NAIA / JUCO as athletes require them.
- `school_aliases`: "Michigan", "University of Michigan", "UMich", "U of M",
  "Michigan Wolverines". Ambiguous aliases (e.g. "USC") are flagged and shown
  with a disambiguator in the dropdown ("USC — Southern California" vs
  "South Carolina").
- Matching: normalize (case, punctuation, diacritics, "St."/"State"), exact
  alias hit first, then fuzzy (edit distance ≤ 2 on strings ≥ 6 chars) via a
  client-side index (uFuzzy or Fuse.js). Server does the authoritative check.
- The full schools + aliases list ships to the client (a few hundred KB gzipped)
  so autocomplete is instant and works offline.

## 7. Daily puzzle system

- Canonical day boundary: midnight **US Eastern**. Puzzle number increments
  from launch date.
- Puzzles are generated ahead of time into the DB by a script (Vercel Cron or a
  GitHub Action) and can be hand-edited in a simple admin page before publish.
- Generator constraints: tier curve (2/2/2/2/2), no athlete repeated within
  90 days, no school repeated within a day, mix of sports and genders.
- Deterministic fallback: if no puzzle row exists for a date, generate one
  seeded by the date so the site never shows a blank day.
- Share text (Wordle-style):

```
Collegian #37  🎓 Valedictorian
🟩🟩🟩🟥🟩🟩🟩🟩🟥🟩  8,940 pts
collegian.io
```

## 8. Data model (Postgres)

```
schools            id, name, short_name, city, state, division, conference,
                   primary_color, secondary_color, mascot, wikidata_id
school_aliases     id, school_id, alias, is_ambiguous
athletes           id, full_name, display_name, sport, league, position, gender,
                   birth_year, active_from, active_to, nationality,
                   tier (1-5), fame_score (1-100), fun_fact, wikidata_id,
                   in_pool (bool), verified_at
athlete_schools    athlete_id, school_id, start_year, end_year, is_primary, level
athlete_teams      athlete_id, team_name, league, start_year, end_year
daily_puzzles      id, puzzle_date, puzzle_number, status (draft|published)
daily_puzzle_items puzzle_id, position, athlete_id, base_points
players            id, anon_token, display_name, auth_user_id (nullable), created_at
plays              id, player_id, puzzle_id, started_at, finished_at,
                   total_points, correct_count, max_streak, stage_reached
play_answers       play_id, position, guessed_school_id, raw_text, is_correct,
                   response_ms, points, hints_used
```

Player stats (current streak, max streak, games played, average score, stage
histogram) are computed from `plays` and mirrored in `localStorage` for
no-account play.

## 9. Architecture & stack (proposed)

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind. Mobile-first.
- **Backend:** Next.js route handlers. Postgres on Supabase or Neon, Drizzle ORM.
- **Hosting:** Vercel. Vercel Cron for daily publish. Domain `collegian.io`.
- **Auth:** none required to play. Anonymous player token in a cookie. Optional
  sign-in later (Supabase Auth or Clerk) for cross-device stats and
  leaderboards.
- **Anti-cheat:** answers are never sent to the client. Server records
  served-at / answered-at timestamps; the client timer is cosmetic.
- **Autocomplete:** static JSON of schools + aliases, client-side fuzzy index.
- **Art/animation:** layered PNG or canvas pixel scenes per stage, CSS
  keyframes + small sprite sheets, `image-rendering: pixelated`.
- **Fonts:** Press Start 2P (headings), VT323 or Silkscreen (body).
- **Audio:** chiptune SFX (jsfxr), muted by default on mobile.
- **Analytics / errors:** Plausible or Vercel Analytics; Sentry.
- **Admin:** protected `/admin` pages for athlete curation and puzzle preview;
  Supabase table editor is fine until that exists.

### API sketch

```
GET  /api/puzzle/today            -> clue cards (no answers) + play token
POST /api/play/:playId/answer     -> { position, schoolId|rawText, hints } -> result + reveal
GET  /api/play/:playId/summary    -> final score, stage, share text
GET  /api/leaderboard/:date       -> top scores for the day
GET  /schools.json                -> static schools + aliases for autocomplete
```

## 10. Data pipeline

1. Seed schools from a curated CSV (D1 first) with colors and aliases.
2. Pull candidate athletes from **Wikidata** (CC0) via SPARQL: sport, league,
   `educated at` (P69), nationality, birth year. Sports-Reference sites are
   great for verification but their ToS restrict scraping, so treat them as
   manual-check sources only.
3. Curation spreadsheet (CSV in repo): tier, fame_score, primary school,
   transfer schools, fun fact, verified flag.
4. Import script validates every row (school resolves, tier set, no duplicates)
   and upserts into Postgres.

## 11. Roadmap

| Phase | Goal | Deliverable |
|---|---|---|
| 0 | Scaffold | Next.js app, Tailwind, fonts, lint, CI, deploy preview |
| 1 | Playable prototype | 10-athlete JSON puzzle, autocomplete, timer, scoring, placeholder stage backgrounds, results + share, localStorage stats |
| 2 | Data | D1 schools + aliases, Wikidata import, curation CSV, 500 verified athletes |
| 3 | Backend | Postgres schema, daily generator + cron, server-side validation, anonymous players, play records, daily leaderboard |
| 4 | Polish | Pixel scenes, retro animations, SFX, mobile tuning, accessibility |
| 5 | Growth | Accounts, archive, practice mode, friends leaderboards, OG share images, SEO |

## 12. Open questions

See the discussion thread for the full list with recommended defaults. Short
form:

**Gameplay:** athletes per day; timer length; lives vs. no lives; hints; skips;
what the clue card shows; multi-school handling; no-college athletes; accept
JUCO; "USC" ambiguity policy; typo tolerance; require autocomplete selection?

**Progression:** stage names and count; evolve by points or by question index;
cross-day meta-progression; school-neutral vs. Michigan-flavored theme.

**Daily:** reset time zone; one attempt vs. practice; archive; leaderboard;
share format; streaks.

**Data:** which leagues/sports in each tier; include MLB; include college-only
stars; pool size at launch; who curates; photos (no) and logos (no).

**Tech:** stack preference; hosting budget; domain ownership; accounts at
launch; analytics; monetization.

**Art:** source of pixel art (commission, asset packs, AI-assisted, or
procedural); sound on/off; CRT filter.

**Project:** timeline, launch target, solo vs. team, design skills available.

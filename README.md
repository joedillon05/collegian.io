# collegian.io

A daily, Kahoot-style speed trivia game. An athlete appears, you type the
college they played for. 15 athletes a day, 3 per tier, and the tiers get more
niche as you go. Your points carry you from **Orientation** to
**Valedictorian**, you get a grade for the day, and your GPA tracks your run.

See [docs/PLAN.md](docs/PLAN.md) for the full design and roadmap and
[data/README.md](data/README.md) for the athlete data pipeline.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine, grading, search, daily generator
npm run typecheck
npm run build
```

## Deploying

[placeholder/](placeholder/) holds a static "coming soon" page for the
domain, and the root `vercel.json` makes Vercel serve it as-is with no build.
When the game is ready to go live, delete `vercel.json` and Vercel will
detect the Next.js app at the repo root.

## Layout

- `src/lib/engine.ts` — pure game reducer: timer, scoring, skip/second-look queue, stages
- `src/lib/daily.ts` — ET date, puzzle numbering, seeded generator
- `src/lib/search.ts` — fuzzy school autocomplete
- `src/lib/grading.ts` — letter grades and GPA
- `src/lib/pixelart.ts` — procedural stage backgrounds
- `src/data/schools.ts`, `src/data/athletes.ts` — datasets
- `src/components/` — Home, Game, Results, modals
- `placeholder/` — static coming-soon page currently deployed

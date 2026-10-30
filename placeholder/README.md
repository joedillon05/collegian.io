# Placeholder page

A single static file, `index.html`, to park on collegian.io until the real
app exists. No build step, no dependencies.

What it does:

- Cycles through a pool of college-sports "coming soon" lines with a
  typewriter effect (tap the line to skip to the next one).
- Animates a blurred stadium scene on a canvas behind the card: crowd wave,
  bouncing balls, confetti, fireworks, scoreboard, blimp, scrolling yard lines.
- Honors `prefers-reduced-motion` by painting a single still frame and
  showing one fixed message.

## Deploying

**Vercel (planned host).** The root `vercel.json` points Vercel's output
directory at this folder, so importing the repo with the default "Other"
framework preset serves the placeholder as-is. Delete that file when the
Next.js app lands at the repo root. Alternatively, leave `vercel.json` out
and set the project's Root Directory to `placeholder` in the Vercel dashboard.

**Anything else.** Any static host works: upload `index.html` to Netlify,
Cloudflare Pages, GitHub Pages, or an S3 bucket.

## Editing the messages

The message pool is the `MESSAGES` array near the top of the script in
`index.html`. Keep lines short enough to fit on two lines of the card at
phone width (roughly 40 characters).

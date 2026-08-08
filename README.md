# Bible Study Tutor

A free Bible study app for desktop and mobile. Bible Study Tutor helps people and churches read Scripture, work through guided study methods, save notes, memorize verses, journal reflections, and print worksheets for pen-and-paper study.

## What This Version Includes

- Expo app for iOS, Android, and web
- Electron wrapper for a desktop build
- Convex database schema and functions
- Guided tutor sessions for OIA, SOAP, Inductive Study, Lectio Divina, and other study methods
- Inline method switching from the study screen
- Optional local coaching feedback for written answers with no paid AI usage
- Common passage starts for each method
- Study review screen before saving completed work
- Printable Bible study worksheets from the Bible and Study tabs
- Shareable insight notes at the end of completed studies
- Private encouragements with accepted friends and invite-only circles
- Journal filters and two-step draft archiving
- Daily rhythm, memory review history, milestones, and journal review
- Convex Auth email/password or username/password sign-in for cross-device profile sync
- Guest per-device profile fallback so early testing can still run without sign-in

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your Convex project and generate the typed API:

   ```bash
   npx convex dev
   ```

3. Copy the generated Convex URL into `.env`:

   ```bash
   cp .env.example .env
   ```

   Then replace `EXPO_PUBLIC_CONVEX_URL` with your Convex URL.

4. Run on phone:

   ```bash
   npm start
   ```

5. If Metro hits the macOS file-watcher limit, use a static local preview:

   ```bash
   npm run web:export
   npm run serve:dist
   ```

   Then open `http://127.0.0.1:8088`.

6. Run as a desktop app:

   ```bash
   npm run desktop
   ```

## Cloudflare Pages

Cloudflare Pages should build with:

```bash
npm run web:export
```

The published output directory is `dist`. This is also recorded in `wrangler.toml` so Cloudflare uploads the generated Expo JavaScript assets under `dist/_expo/static/js/web/`.

## Notes

Convex generates `convex/_generated/*` after `npx convex dev`. Until then, the app code that imports `api` will not typecheck locally.

This version uses Convex Auth email/password sign-in so study history can follow a signed-in person across devices. If someone does not sign in, the app still falls back to a per-device guest profile for early testing.

## Launch Notes

The current launch build uses email/password sign-in and a local profile fallback. Google and Apple sign-in are intentionally hidden until OAuth, app-store, and support flows are ready.

For search engines, set the public site URL in the hosting environment:

```bash
EXPO_PUBLIC_SITE_URL=https://biblestudytutor.org
SITE_URL=https://biblestudytutor.org
EXPO_PUBLIC_CONVEX_URL=https://fabulous-ladybug-435.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://fabulous-ladybug-435.convex.site
```

For privacy-friendly public analytics, the app can record broad, non-content events to Convex. Keep this disabled locally, then enable it in production only when the Convex backend has been deployed:

```bash
EXPO_PUBLIC_ANALYTICS_ENABLED=true
```

Cloudflare Pages builds fail intentionally if these public production variables are missing. This prevents the live app from silently connecting to the wrong Convex backend and appearing to lose saved verses, account status, or rhythm data.

These public analytics events do not store journal text, study answers, notes, email addresses, names, Scripture search text, or community/encouragement content.

Study coaching is generated locally in the app using built-in prompts. It does not require an AI provider account or paid API credits.

## Cross-Reference Data

Study cross references are generated from the CrossReferences.org BSB dataset, licensed under CC BY 4.0 and derived from the Treasury of Scripture Knowledge tradition. The generated per-book files live in `public/cross-references/bsb/` so the app can lazy-load only the book currently being studied.

To regenerate the bundled cross-reference files:

```bash
node scripts/build-cross-references.mjs
```

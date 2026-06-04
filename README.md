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
- After-study encouragement handoff from saved studies
- Journal filters and two-step draft archiving
- Accountability plan, encouragements, streaks, minutes, and journal
- Convex Auth email/password sign-in for cross-device profile sync
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

## Notes

Convex generates `convex/_generated/*` after `npx convex dev`. Until then, the app code that imports `api` will not typecheck locally.

This version uses Convex Auth email/password sign-in so study history can follow a signed-in person across devices. If someone does not sign in, the app still falls back to a per-device guest profile for early testing.

## Launch Notes

The current launch build uses email/password sign-in and a local profile fallback. Google and Apple sign-in are intentionally hidden until OAuth, app-store, and support flows are ready.

For search engines, set the public site URL in the hosting environment:

```bash
EXPO_PUBLIC_SITE_URL=https://biblestudytutor.org
SITE_URL=https://biblestudytutor.org
```

Study coaching is generated locally in the app using built-in prompts. It does not require an AI provider account or paid API credits.

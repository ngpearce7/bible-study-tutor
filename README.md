# Bible Study Tutor Native

A cross-platform Bible study tutor for phone and desktop.

## What This Version Includes

- Expo app for iOS, Android, and web
- Electron wrapper for a desktop build
- Convex database schema and functions
- Guided tutor sessions for OIA, SOAP, Inductive Study, and Lectio Divina
- Inline method switching from the study screen
- Optional local coaching feedback for written answers
- Optional deeper tutor feedback through a Convex server action and OpenAI Responses API
- Common passage starts for each method
- Study review screen before saving completed work
- Shareable insight notes at the end of completed studies
- After-study check-in handoff from saved studies
- Journal filters and two-step draft archiving
- Accountability plan, check-ins, streaks, minutes, and journal
- Convex Auth email/password, Google, and Apple sign-in for cross-device profile sync
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

## Google Sign-In Setup

Google sign-in is wired in the app, but it needs OAuth credentials in Convex before it can complete a real login.

1. In Google Cloud, create an OAuth client for a web application.
2. Add this authorized redirect URI:

   ```text
   https://your-project.convex.site/api/auth/callback/google
   ```

   For local Convex dev, use the local Convex site URL shown in `.env.local`, for example:

   ```text
   http://127.0.0.1:3211/api/auth/callback/google
   ```

3. Save the Google client values in Convex env:

   ```bash
   npx convex env set AUTH_GOOGLE_ID your_google_oauth_client_id
   npx convex env set AUTH_GOOGLE_SECRET your_google_oauth_client_secret
   ```

4. Restart the Convex dev server and the Expo app, then use **Continue with Google** from Account.

Deeper tutor feedback is optional. To enable it, set `OPENAI_API_KEY` in Convex:

```bash
npx convex env set OPENAI_API_KEY your_api_key
```

You can override the default tutor model with `OPENAI_TUTOR_MODEL`; otherwise the app uses `gpt-5.4-mini`. If no key is configured, the UI falls back to local coaching feedback.

# Design refresh preview — 12 September 2026

This frontend design is on `codex/design-refresh-preview`. It has not been published or merged into the production branch. The preview uses the local Convex configuration, not the production backend.

## Review

Run `npm run web:export`, then serve `dist` locally. The current preview is at http://127.0.0.1:8093/.

Review Home, Bible, Study, Journal and Account at phone and desktop widths. Use the Theme button for Light, Dark and Use device setting. The device setting is stored locally; the backend continues to accept its existing light/dark preferences. No database migration is required.

## Checkpoint and independent stages

The pre-design checkpoint is tag `design-before-refresh-2026-09-12`, commit `288e09a`. It includes the already deployed branded recovery email.

- `4b273d7`: typography, card styling and dark surfaces.
- `86d6990`: simplified home content and prominent continuation shortcuts.
- `63f5b6d`: phone navigation, accessible appearance choices and final visual refinements.

To discard the preview before publication, leave this branch intact and use `codex/reliability-production-release`, which remains at the checkpoint. No production rollback is needed because the design has not been published.

To remove a single stage later, revert its commit and review the resulting diff. For a complete Git rollback after merging, revert the three design commits in reverse order: `63f5b6d`, `86d6990`, `4b273d7`. Use new revert commits rather than resetting shared history. Run validation and publish the reverted frontend. Cloudflare can also restore the preceding successful frontend deployment immediately, followed by the Git reverts to keep the source consistent. No Convex rollback is needed for this frontend-only design.

## Validation

- Full `npm run verify` passed: TypeScript, 20 tests, reading-plan checks, structural checks, web export, SEO and bundle budgets.
- Final navigation-overlap and visual refinements were checked with TypeScript, a new export, SEO validation and bundle validation.
- Browser review at 390 × 844 and 1440 × 1000, light and dark appearance; device choice persists on reload; phone Bible navigation loads Scripture; More opens the full menu.
- The floating Help button clears phone navigation. Navigation hides during reader selection and memory focus views.
- Native iOS/Android builds and actual OS-theme changes have not been exercised in this preview.

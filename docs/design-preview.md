# Design refresh preview — 12 September 2026

The user approved this frontend design after reviewing `codex/design-refresh-preview`. The approved commits are prepared for the GitHub Desktop `main` checkout; publishing remains a separate Push origin step. The local preview uses the local Convex configuration, not the production backend.

## Review

Run `npm run web:export`, then serve `dist` locally. The current preview is at http://127.0.0.1:8093/.

Review Home, Bible, Study, Journal and Account at phone and desktop widths. Use the Theme button for Light, Dark and Use device setting. The device setting is stored locally; the backend continues to accept its existing light/dark preferences. No database migration is required.

## Checkpoint and independent stages

The pre-design checkpoint is tag `design-before-refresh-2026-09-12`, commit `288e09a`. It includes the already deployed branded recovery email.

- `4b273d7`: typography, card styling and dark surfaces.
- `86d6990`: simplified home content and prominent continuation shortcuts.
- `63f5b6d`: phone navigation, accessible appearance choices and final visual refinements.

Before publication, the previous version remains available on `codex/reliability-production-release` at the checkpoint. To remove the design from `main`, use the revert steps below. Do not push if you want to keep the current live design.

To remove a single stage later, revert its commit and review the resulting diff. For a complete Git rollback after merging, revert the three design commits in reverse order: `63f5b6d`, `86d6990`, `4b273d7`. Use new revert commits rather than resetting shared history. Run validation and publish the reverted frontend. Cloudflare can also restore the preceding successful frontend deployment immediately, followed by the Git reverts to keep the source consistent. No Convex rollback is needed for this frontend-only design.

## Validation

- Full `npm run verify` passed: TypeScript, 20 tests, reading-plan checks, structural checks, web export, SEO and bundle budgets.
- Final navigation-overlap and visual refinements were checked with TypeScript, a new export, SEO validation and bundle validation.
- Browser review at 390 × 844 and 1440 × 1000, light and dark appearance; device choice persists on reload; phone Bible navigation loads Scripture; More opens the full menu.
- The floating Help button clears phone navigation. Navigation hides during reader selection and memory focus views.
- Native iOS/Android builds and actual OS-theme changes have not been exercised in this preview.

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

## Follow-up review

The follow-up changes remain on the preview branch until reviewed; they have not been copied into the GitHub Desktop main checkout or published.

- Combined home actions and resource links into one section. Resource links use compact, underlined rows; the hero card no longer stretches to match the sidebar height.
- Shared eyebrow labels follow the active theme across lazy-loaded screens. Fixed dark verse numbers, instruction labels and icons; selected gold translation controls use dark text.
- Slightly darkened light-theme terracotta and muted text to meet the normal-text contrast target on cream, peach and gold surfaces. Build validation now covers those pairs as well as dark labels and translation controls.
- Inspected the rendered default/guest states of Home, Study, Bible, Plans, Methods, Memory, Journal, Community, Help and Account in both modes. This is not a claim that every signed-in, error, modal or user-highlight state has been audited. The clipped SEO heading is not visually rendered and was excluded from the visual contrast findings.
- Added a simulated device-theme integration test using the installed React Native Web appearance listener. It verifies live system changes, fixed Light/Dark overrides, switching back to Device, and listener cleanup.
- Full verification passes with 21 tests. Both iOS and Android JavaScript exports compile. These exports are not signed native app builds or device tests. The current Xcode tools do not provide simctl, so simulator/physical-device behaviour remains unverified.

The previously approved design remains available at commit `dd63352`. Reverting the follow-up commit alone restores that version while preserving the earlier design stages.

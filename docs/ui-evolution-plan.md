# Bible Study Tutor: staged UI evolution

## Scope and evidence

Prepared 10 October 2026 against main commit af3b1fa. This is a plan only; the accompanying implementation changes branding assets and the BT mark. No broader redesign or deployment is included.

The reference conversation confirms a bronze outlined Latin cross on navy and polished light/dark concepts, but the available conversation contains no mockup image attachments. This plan interprets that direction; it does not claim an exact visual match. Before a broader implementation, compare the original images with the stage-one design specification if they become available.

Inspected the live Home page, repository layout/styles, and local export at desktop (1440 × 1000), tablet-width presentation, and phone (390 × 844). Light and dark desktop views and the dark phone menu were visually checked.

## Current UI

- `app/index.tsx` owns navigation, Home, and much of the feature UI; `components/appStyles.ts` holds shared screen styles. Avoid mixing layout extraction with data-flow changes.
- Desktop has a 200px sidebar with ten navigation destinations, appearance control and a Today card. Home has a large content card and a secondary column of starting points/resources/statistics.
- Below 900px, the sidebar becomes a top section and navigation wraps; between 760px and 899px this produces a tall multi-row header. Below 760px the app uses a menu bar, expandable menu and bottom quick navigation.
- Home already has a useful editorial hierarchy: “Draw near. Be shaped by Scripture.”, Georgia headings at 42/48 desktop and 34/40 phone, supporting copy and two working calls to action. Returning-user continuation items appear before the hero.
- Light surfaces are warm cream with olive and terracotta accents. Dark surfaces are charcoal with gold highlights. Theme choices already persist through `AppearanceControl`, `useAppDarkMode`, and the preference helpers.
- Reader, study, journal and memory screens have special mobile docks, keyboard behavior and focus modes. These are functional constraints for a shell redesign.

## Stage 1 — define the visual system and extract the shell (small PR)

**Deliverables:** a short light/dark specification and reusable presentation components (`Brand`, `AppHeader`, `PrimaryNavigation`, `HomeHero`). Extract the existing markup and handlers first, retaining current appearance and behavior.

Define semantic tokens in a dedicated theme module: page, surface, raised surface, text, muted text, border, action, action text, focus and brand. Use the approved navy `#172536` and bronze `#C59868` for branding. Prototype warm ivory/light surfaces and navy/dark surfaces, but do not use bronze as small body text on ivory without a contrast check. Keep body/control text in the platform sans-serif; retain Georgia for web/iOS editorial headings and define an explicit Android fallback. Establish an 8px spacing rhythm, 12–16px card radii, and restrained border/shadow levels.

**Acceptance:** no navigation/URL or preference behavior changes; theme switches without flashing; both themes have AA body-text contrast and visible keyboard focus. Capture Home before/after at 390, 768, 900 and 1440px. Apply new tokens to the shell/Home first, then migrate feature screens in later PRs.

## Stage 2 — header and navigation (separate PR)

**Deliverables:** a compact desktop top header with the cross, single-line wordmark, primary destinations and appearance/account controls. Prototype Home, Bible, Study, Plans and Memory as primary destinations; make Methods, Journal, Community and Help directly reachable through an accessible More menu, with Admin remaining conditional. Validate this grouping with the user before implementing it.

At tablet widths, collapse secondary destinations before labels wrap. On phone, preserve the current 44px-or-larger menu/touch controls and bottom quick navigation. Put the logo in the drawer and optionally a smaller mark in the header only if space permits. Reuse existing `setTab`, URL handling, CTA analytics and menu-close handlers; do not create a second navigation state.

**Acceptance:** every existing destination remains reachable, selected state is announced, keyboard Escape/focus return work, browser back/deep links still select the correct tab. Verify immediately around 759/760 and 899/900px as well as 320 and 390px; no horizontal scrolling or obscured content. Confirm `useAutoHideNavigation`, reader selection docks, and memory focus mode still work.

## Stage 3 — Home hero and typography (separate PR)

**Deliverables:** a centered Home container with a maximum width around 1200px, generous 24–40px desktop gutters and 16px phone gutters. Give the hero a clear heading, 55–65-character supporting-copy measure, primary “Start a guided study” action and secondary Bible-reader action. Preserve current wording, personalization, CTA handlers and analytics.

Use a responsive editorial heading range of roughly 34–52px; tune line breaks at each breakpoint rather than forcing desktop breaks on phones. Keep the Scripture blocks as a calm secondary section and consolidate the existing starting-point links into a consistent grid. Returning users should retain quick access to “Pick up where you left off”; decide its final position using both new-user and returning-user previews.

**Acceptance:** hero and actions remain legible at 200% text scaling, buttons stack when needed, and light/dark layouts share the same hierarchy. No feature is removed from Home. Screenshots cover empty/new-user and populated/returning-user states.

## Stage 4 — responsive and accessibility refinement (separate PR)

**Deliverables:** unified card/button/input states; consistent spacing and text widths; responsive navigation and Home refinements carried through to feature shells. Keep reading/editor content styling separate so typography changes do not disturb verse selection or writing tools.

**Acceptance matrix:** 320, 390, 768, 900, 1280 and 1440px; both themes; keyboard-only navigation; screen-reader labels; reduced motion; 200% text scaling; mobile landscape; software keyboard open. Check reader selection/note docks, journal editing, study recovery, print/export, and memory practice. Use local/staging fixtures for authenticated flows rather than writing test data into production.

## Stage 5 — release readiness (later authorization)

Resolve the existing verification failures before calling the redesign release-ready: the Phase B validator assumes an obsolete guided-panel style string, and the total JavaScript gzip size exceeds its budget. Prefer correcting the assertion to verify intended behavior and reducing unnecessary bundle content over simply raising the budget.

Run `npm run verify`, review the before/after screenshots, and verify iOS/Android launcher masks on simulator/device. Keep each stage independently reviewable/revertible. Do not change backend contracts, analytics semantics, saved study data or authentication as part of the visual redesign. Deployment is a separate future step requiring user authorization.

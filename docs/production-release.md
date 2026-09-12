# Production release record — 2026-09-12

## Prepared release

- Branch: `codex/reliability-production-release`, based on `a6ea6bd` (current `origin/main` when prepared).
- Verified Convex team: `ng-pearce`; project: `bible-study-tutor-ce373`; production deployment: `fabulous-ladybug-435`. Verified through authenticated account/project metadata.
- Cloudflare dashboard verified: project `bible-study-tutor`; site `https://biblestudytutor.org`; production branch `main`, automatic deployments enabled, build `npm run web:export`, output `dist`. Current production deployment: `6bd28aa7-7ed3-40a8-be24-73f17330bb6c`, commit `a6ea6bd`. All non-production branches receive public previews; preview variables are empty. Do not treat a branch preview as an isolated backend.
- Full `npm run verify` passed under Node 24.19.0 with explicit production URLs and analytics disabled: 19 tests, all structural/reading-plan checks, SEO, web export and bundle budgets. Entry JavaScript: 487 KiB gzip; total: 810 KiB gzip.
- The tested website is packaged locally in ignored `.convex/release-artifact/website.tar.gz`, with a per-file SHA-256 manifest. It has 168 files. It is not published.
- After inspecting Cloudflare, the final website was rebuilt with its actual flags: analytics and community circles enabled, production cloud/site URLs, and `CF_PAGES=1`. SEO and bundle validation passed again: entry 485 KiB gzip, total 809 KiB gzip. This final build replaces the earlier artifact with analytics disabled.
- Production deployment dry run passed: schema validation succeeded; `profiles.by_recovery_digest` would be added; no indexes would be deleted. The installed Convex package would update the server function version from 1.40.0 to 1.45.0 and configure the new Node actions. The dry run uploaded/analyzed the proposed functions but did not finalize a production deployment.
- Real local authentication tests passed using synthetic accounts and local signing keys: registration retained the guest profile and study; old guest credentials and a different signed-in account were denied; recovery-code generation/reset worked once; the old password and refresh token were rejected; the new password recovered the existing study. No real emails were sent. The synthetic local server was stopped after testing.

## Backup and schema rehearsal

Production snapshot timestamp: `1789196719577402976`. The snapshot remains available in the [production snapshots dashboard](https://dashboard.convex.dev/d/fabulous-ladybug-435/settings/snapshots).

Snapshot SHA-256: `1e85707d4a39d832dfe6e7745c021678d4dd270d213b8649c4ca6d742be29ecf`.

The proposed backend was deployed to a fresh local anonymous backend, then the production snapshot was imported into it. Import succeeded with the proposed schema. A second export compared equal, record for record, across all 37 application/auth tables and 1,351 documents. No file-storage objects were present. This proves restoration and schema compatibility for that snapshot; it does not prove physical-device behavior or email delivery.

The rehearsal server was stopped. Temporary local snapshot copies and the restored database are removed after verification; production's saved snapshot remains available. Take another fresh snapshot immediately before an eventual release if production has changed. Restoring an older snapshot to production would discard subsequent writes, so prefer code fixes over database rollback for an application defect.

## Configuration to review before publishing

- Production currently has `ADMIN_EMAILS`, `JWKS`, `JWT_PRIVATE_KEY`, and `SITE_URL`.
- `ADMIN_USER_IDS` is absent. One existing operator is supported by the admin audit history and matching auth user/password account (ID ending `86wse4`). Review this candidate before setting the new allowlist; its full ID is retained only in ignored release metadata.
- `RESEND_API_KEY` and `AUTH_EMAIL_FROM` are absent. Keep email recovery disabled until a verified sender is configured and delivery is tested. Existing authentication configuration must be preserved.
- Cloudflare production builds must use the production Convex cloud/site URLs from `wrangler.toml`, never the localhost values in `.env.local`.
- Human editorial records remain pending. This release does not claim human approval of the guidance. Native interruption tests and the manual account/recovery scenarios in `editorial-and-release-checks.md` remain outstanding.

## Release sequence

1. Cloudflare account, production branch, current deployment ID and automatic deployment behavior are verified above. Recheck current main/deployment before publishing if time has elapsed.
2. Review the operator ID and remaining manual scenarios. Proposed initial scope is web-only, with email recovery disabled. Native device checks remain required before a native release. Do not enable an untested sender.
3. Review the exact release commit and production targets. Set the approved operator ID on the verified production backend.
4. With Node 24 and the explicit production environment selector, deploy the reviewed backend using `convex deploy --typecheck enable --env-file .convex/release-production.env`. This ignored selector contains only `CONVEX_DEPLOYMENT=prod:fabulous-ladybug-435`. Run only after production approval.
5. Immediately publish the matching tested website to the verified Cloudflare Pages project. Existing open tabs need refreshing. Existing native clients need the matching update because guest credentials and reader revisions are required.
6. Verify sign-in, studies, reader saves and admin access using designated test accounts. Check error signals after publishing. Record the Convex deployment and Cloudflare deployment IDs.

Keep backend and client compatible during recovery. Do not restore insecure guest access or assume a rollback to the previous website alone will work with the new backend. A production data restore requires separate review of writes made since the snapshot.

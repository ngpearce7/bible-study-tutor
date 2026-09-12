# Reliability and privacy implementation plan

Each stage must pass TypeScript and relevant behavioral tests before proceeding. Changes stay local until a separately reviewed deployment. Existing data fields remain compatible; never delete legacy data to hide a migration problem.

1. **Access controls:** consolidate profile authorization, require possession of the existing device credential for guest requests, restrict administrators to explicitly configured user IDs, test wrong-user and missing-credential access. Preserve existing device profiles while preparing a future authenticated-anonymous migration.
2. **Data preservation:** adopt the correct guest profile on first registration; isolate account caches; protect reader snapshots using server revisions and explicit conflict recovery. Test conversion, account boundaries, concurrent edits and deletion.
3. **Recovery:** configure email password reset with a delivery-provider gate, explain username-only recovery limits, persist native drafts and resolve native cross-reference URLs. Test recovery data handling and asset URLs. Email delivery needs a configured sender/API key; physical-device interruption tests remain a release gate.
4. **Observability:** remove wall-clock dependencies from reactive statistics; replace misleading rolled-back security logging with explicit structured rejection signals; validate malformed telemetry payloads. Test midnight transitions and rejection behavior.
5. **Maintainability and product:** extract focused persistence/style modules without redesigning workflows; add editorial provenance and an honest review queue; document beginner journey and native/browser release checks. Run all existing audits, production-style web export, SEO and bundle checks.

## Rollout gates

- Set `ADMIN_USER_IDS` to verified existing operator user IDs before deploying the admin change. `ADMIN_EMAILS` remains notification routing only.
- Deploy compatible backend argument additions before the client. Old guest clients will fail closed and must refresh; do not restore insecure guest access as rollback.
- Reader writes from clients without a base revision are rejected once data exists; publish updated clients together with the backend change.
- Configure and exercise email delivery in non-production before enabling reset UI in production.
- Verify a backup and rehearse guest conversion, two-device editing, sign-out and account deletion against non-production data.
- Production deployment, live email delivery, human editorial sign-off and physical-device usability testing are not satisfied by local tests.

## Validation record

- Stages 1–5 are implemented locally. Existing guests now prove possession of their device credential; first registration adopts that same profile. This preserves existing guest data without introducing a second account system.
- Reader writes compare server revisions, serialize edits from this device, retain a recovery copy and require an explicit choice after a conflict. Account caches are scoped, async hydration is canceled on account changes, and legacy imports are explicit and non-overwriting.
- Email reset is gated on `RESEND_API_KEY` and `AUTH_EMAIL_FROM`. One-time recovery codes work without email; code consumption, password-hash replacement and session-record removal are atomic. Existing access JWTs follow Convex Auth's token-expiry behavior; deleting sessions prevents refresh, not retroactive invalidation of an already-issued JWT.
- Native draft persistence and asset URLs are implemented with platform-specific modules. All existing style values were moved intact to `components/appStyles.ts`; recovery and legal views load on demand.
- Additional security finding fixed: rich HTML notes now use DOMPurify with a formatting allowlist and safe color styles, with malicious-markup regression tests. The journal bundles five existing icon glyph names instead of the entire catalog.
- TypeScript (app and Convex), behavioral tests, reading-plan/structural audits, SEO and web bundle budgets have passed. See the final task response for final test totals and platform export results.
- Editorial audit identifies 1,180 guidance-bearing days without a recorded current human sign-off. It deliberately does not invent approvals from the older prose audit.
- Approved backend verification passed on 2026-09-12 against a new anonymous local deployment (`anonymous-agent`, localhost ports 3210/3211). Convex regenerated the API/server files, validated TypeScript, and deployed all functions and indexes successfully. No cloud or production deployment was used.
- Real local-backend smoke tests passed for guest profile reuse, study persistence, missing/wrong device credential rejection, stale reader-write rejection, bookmark preservation and revision-based deletion. The Node recovery action executed and rejected an unknown code; malformed telemetry returned HTTP 400 for null, arrays and scalar bodies. Positive password recovery remains covered by the behavioral tests, not an end-to-end email delivery test.
- Local Node actions require Node 20, 22 or 24. The machine default Node 25 was rejected; verification succeeded using the bundled Node 24.19.0 runtime. The local server was stopped afterward; ignored `.env.local` points to the isolated local deployment and ignored `.convex/` retains its synthetic test data.
- Follow-up release preparation completed a production backup, exact-record local restore rehearsal, and production deployment dry run. See `production-release.md` for evidence and remaining gates. Email delivery, approved admin IDs, physical-device tests, beginner sessions and production rollout remain pending.

### Final local verification

- 19 behavioral tests across 6 suites passed.
- App and Convex TypeScript checks passed; six existing structural validation scripts passed.
- 48 plans / 2,980 reading days passed the reading-plan audit.
- Web export and SEO/build checks passed: 56 HTML files, 886 internal links, 52 SEO pages; entry 485 KiB gzip, total JavaScript 809 KiB gzip. Existing size limits were not raised.
- iOS and Android JavaScript/Hermes exports succeeded. These are export checks, not installed-app or physical-device tests.
- Extracted style values match the original byte-for-byte after removing the export prefix. Main screen reduced from 26,160 to 15,205 lines.
- All 19 behavioral tests and app/backend TypeScript checks passed again after actual Convex code generation.
- No tracked whitespace errors. Deployment and synthetic-data mutations were limited to the isolated local backend; production data was untouched.

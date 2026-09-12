# Editorial provenance

The structural reading-plan audit is not human theological approval. Existing prose audits remain useful evidence but do not identify a signed-off reviewer for every day. No reviews have been invented or retroactively attributed.

Run `npm run editorial:audit -- --write-queue` to generate the day-level queue. For each reviewed day, add a record to `docs/editorial-reviews.json` with `planId`, `day`, `reviewer`, `reviewedAt` (YYYY-MM-DD), `sources` (specific sources actually consulted), and `contentHash` copied from the queue. The hash invalidates approval when any day content changes. `--require-reviewed` is an optional release gate when publishing material as human-reviewed.

Prioritize grief/anxiety guidance, promises commonly removed from context, disputed passages, and generated reading guidance. Distinguish what the passage says from interpretation and personal application. The human reviewer should record unresolved denominational differences rather than flatten them into an authoritative claim.

# Beginner journey and device release checks

Ask five beginners to open Scripture, complete one short study, save it, leave, and find it again the next day. Observe without coaching. Record time to first passage, unclear prompts, abandoned steps and whether they can distinguish private answers from explicitly shared insights. Test on a narrow phone and desktop with keyboard-only navigation and a screen reader. Preserve the current workflow until evidence warrants redesign.

Required non-production scenarios:

- Guest writes a draft and completes a study, then registers; the same content remains available.
- Sign out, sign in as a different person, and restart; private reader notes and recovery codes never carry across accounts.
- Two devices edit bookmarks and plans from the same base revision; a stale write is rejected and the user can choose the server or device copy.
- Disconnect during writing, terminate the native app, restart and restore the draft. Repeat with a full/unavailable disk and confirm the UI does not claim a durable save.
- Recover an email account with an expired, incorrect and valid code; an unknown email receives the same public response. Verify the actual sender and delivery separately.
- Create a recovery code, reset a username account, verify all old sessions stop working and the code cannot be reused.
- Open cross references on iOS/Android; verify public-site URL configuration and offline fallback.
- Let an open statistics screen cross midnight and confirm the supplied clock refresh updates results.
- Rehearse account deletion and its resumable cleanup, including authentication records and local cached data expectations.

Production gate: approved administrator user IDs, configured reset sender, verified backup, reviewed deployment target, actual email delivery and physical-device results. Automated checks do not substitute for these observations.

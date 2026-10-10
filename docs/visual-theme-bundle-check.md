# Visual theme bundle check — 10 October 2026

Continued `codex/modern-visual-theme` from `de576da`. All work and validation were local; nothing was deployed.

## Finding

The 848 KiB failure measures the sum of independently gzipped JavaScript files, including lazy chunks. It is not the initial download size and does not include the new hero JPEG. The existing limits remain 500,000 bytes for the entry and 860,000 bytes for all JavaScript (rounded to 488 and 840 KiB in the validator).

Using the same installed dependencies, Node 25.9.0 and local environment configuration:

| Export | Entry gzip bytes | Total JavaScript gzip bytes |
| --- | ---: | ---: |
| Before branding/theme (`af3b1fa`, temporary checkout) | 499,606 | 867,810 |
| Theme branch (`de576da`, clean export) | 499,789 | 868,048 |
| With explicit editor extension imports | 499,789 | 852,750 |

The failure predates the theme refresh. The before/after theme exports differ by only 238 total gzip bytes. Generated hashes and compressed sizes can vary with configuration and toolchain.

## Change

The note editor previously imported all of Tiptap StarterKit while disabling heading, blockquote, code block and horizontal rule at runtime. Its aggregate imports also pulled in unrelated list and utility extensions. Metro still included that code in the lazy editor chunk.

`data/studyNoteExtensions.ts` imports the enabled extensions through their public entry points, retaining formatting, links, bullet/ordered lists, cursor behavior, trailing paragraphs and undo/redo. Underline is registered once (StarterKit already included it). StarterKit remains a development dependency for compatibility tests; imported extensions are explicit runtime dependencies. No package versions were upgraded.

The editor chunk shrank from 144,874 to 129,576 gzip bytes, saving 15,298 bytes. Build failures now print per-chunk gzip byte counts and exact budget totals. Bundle limits and Metro defaults are unchanged.

## Validation and remaining limits

- `npm run verify` passed: type checking, 70 tests across 21 files, reading-plan/editorial and structural validators, fresh web export, SEO and build checks.
- Editor compatibility tests compare enabled extensions, schema, saved HTML/JSON, formatting, bullet lists and undo/redo against StarterKit.
- The separate entry-fingerprint regression test passed.
- Local browser smoke check: Home and Study load; the lazy editor and toolbar render in light and charcoal dark modes. No console errors; React Native Web emits its existing native-animation fallback warning.
- One intermediate export contained identical generated ` 2.js` copies. Only byte-identical duplicates were removed. The subsequent full verification produced a clean 15-chunk export without manual cleanup.
- Total JavaScript has 7,250 bytes of remaining budget; the entry has only 211 bytes. Further entry growth needs a separate reduction. Recheck with release flags before any future publication.
- Editorial review backlog remains: the audit reports 1,719 pending or changed reviews, non-blocking under current checks. Passing verification is not editorial sign-off.
- No native device build, authenticated-flow review, or complete responsive/accessibility matrix was performed in this continuation.

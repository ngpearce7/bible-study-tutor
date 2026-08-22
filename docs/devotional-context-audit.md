# Devotional Context Audit

Date: 2026-08-23

## Scope

This audit covers the built-in Bible reading-plan devotional material in `data/bibleReadingPlans.ts`.

Current inventory:

- Built-in reading plans: 48
- Plan days with devotional or devotional-adjacent material: approximately 1,180
- This pass completed a focused theological/context audit for the highest-risk passages named in the review brief, especially anxiety, peace, grief, and comfort passages that are easy to overgeneralize.

Because the full library is large, this document distinguishes between reviewed entries and pending entries. Anything not listed under "Reviewed in this pass" should be treated as pending a full source-backed editorial review.

## Source Approach

Sources consulted or cross-checked in this pass:

- Biblical text in context using the app's assigned passages and surrounding chapters.
- NET Bible notes for Psalm 23, Psalm 46, Isaiah 26, Matthew 6, John 14, Philippians 4, Isaiah 41, and related cross references.
- Bible Gateway passage context for Matthew 6:25-34 and Philippians 4:4-9.
- Public pastoral/scholarly commentary for Matthew 6:25-34 via Biblical Scholarship.

Reference links:

- https://classic.net.bible.org/verse.php?book=Psa&chapter=23&tab=commentaries&verse=1
- https://classic.net.bible.org/passage.php/o/w/passage.php?passage=Psa+46%3A1%2C5
- https://classic.net.bible.org/verse.php?book=Isa&chapter=26&tab=commentaries&theme=wiki&verse=3
- https://classic.net.bible.org/verse.php?book=Mat&chapter=6&tab=commentaries&theme=wiki&verse=25
- https://classic.net.bible.org/verse.php?book=Joh&chapter=14&tab=commentaries&verse=27
- https://classic.net.bible.org/passage.php?passage=Phi+4%3A4-9
- https://classic.net.bible.org/passage.php/passage.php?passage=isa+41%3A8-20
- https://biblicalscholarship.wordpress.com/2020/08/07/commentary-on-matthew-625-34/

## Reviewed In This Pass

### Shared Psalm 46 devotional helpers

- Passages: Psalm 46:1-11 and Psalm 46:1-7
- Verdict: Improved
- Issue: The wording was pastorally useful, but the context field was missing in shared helpers. This could let "be still" read as a generic relaxation technique.
- Changed fields: Added `context` to shared Psalm 46 helpers.
- Theological review need: Low. The current wording now identifies Psalm 46 as a communal Song of Zion and frames stillness as ceasing striving before God's rule.

### 14 Days on Anxiety and Trust

- Psalm 23:1-4
  - Verdict: Improved
  - Issue: Needed clearer shepherd-psalm setting and valley language.
  - Changed fields: `context`
  - Theological review need: Low
- Psalm 27:1-5
  - Verdict: Improved
  - Issue: Needed clearer movement from confidence amid enemies to desire for God's presence.
  - Changed fields: `context`
  - Theological review need: Low
- Psalm 46:1-11
  - Verdict: Improved
  - Issue: Needed explicit correction against using "be still" as mere private calm.
  - Changed fields: `context`
  - Theological review need: Low
- Psalm 91:1-4
  - Verdict: Improved
  - Issue: Needed poetic/wisdom framing so protection language is not treated as a suffering-free guarantee.
  - Changed fields: `context`
  - Theological review need: Medium; Psalm 91 is often misapplied and should remain carefully worded.
- Isaiah 26:3-4
  - Verdict: Already recently improved; retained
  - Issue: Important to keep this as communal trust in the everlasting Lord, not a private mental technique.
  - Changed fields: None in this pass
  - Theological review need: Low
- Isaiah 41:8-13
  - Verdict: Already recently improved; retained
  - Issue: Important to preserve first address to Israel/Jacob as God's servant.
  - Changed fields: None in this pass
  - Theological review need: Medium; application to Christian readers should keep Israel's first context visible.
- Matthew 6:25-34
  - Verdict: Already recently improved; retained
  - Issue: Needs to remain tied to Sermon on the Mount, treasure, money, the Father's care, and seeking the kingdom.
  - Changed fields: None in this pass
  - Theological review need: Low
- Matthew 11:28-30
  - Verdict: Improved
  - Issue: Needed stronger context around Jesus' invitation after His words about revelation to the humble.
  - Changed fields: `context`
  - Theological review need: Low
- John 14:25-27
  - Verdict: Improved
  - Issue: Needed Farewell Discourse setting and Spirit promise.
  - Changed fields: `context`
  - Theological review need: Low
- Romans 8:31-39
  - Verdict: Improved
  - Issue: Needed connection to Romans 8's no-condemnation, Spirit, suffering, and future glory argument.
  - Changed fields: `context`
  - Theological review need: Low
- Philippians 4:4-9
  - Verdict: Already recently improved; retained
  - Issue: Needs communal context, especially unity and practice, not only private anxiety relief.
  - Changed fields: None in this pass
  - Theological review need: Low
- Colossians 3:12-17
  - Verdict: Already recently improved; retained
  - Issue: Needs communal Christian-formation framing.
  - Changed fields: None in this pass
  - Theological review need: Low
- 1 Peter 5:6-11
  - Verdict: Improved
  - Issue: Needed suffering/scattered-believers context and final restoration emphasis.
  - Changed fields: `context`
  - Theological review need: Low
- 1 John 4:13-19
  - Verdict: Already recently improved; retained
  - Issue: Needs judgment/confidence/abiding context, not a generic fear-management promise.
  - Changed fields: None in this pass
  - Theological review need: Low

### 7 Days of Peace and Anxiety and Peace

- Passages updated where duplicated: Psalm 23:1-4, Isaiah 26:3-4, Matthew 6:25-34, Matthew 11:28-30, John 14:25-27, Philippians 4:4-9, Colossians 3:12-17, 1 Peter 5:6-11.
- Verdict: Improved
- Issue: These shorter plans reused high-risk comfort/anxiety passages with briefer context that could be read too generically.
- Changed fields: `context`
- Theological review need: Low to medium. Psalm 91 and Isaiah 41 remain passages worth future second-pass review wherever they appear.

### Grief and Comfort

- Psalm 13:1-6
  - Verdict: Improved
  - Issue: Needed explicit lament shape so trust is not read as bypassing grief.
  - Changed fields: `context`
  - Theological review need: Low
- Psalm 34:17-22
  - Verdict: Improved
  - Issue: Needed wisdom/acrostic framing and affliction-deliverance balance.
  - Changed fields: `context`
  - Theological review need: Medium; this passage is often over-promised to sufferers.
- Psalm 42:5-11
  - Verdict: Improved
  - Issue: Needed worshiper-lament setting and repeated soul-address refrain.
  - Changed fields: `context`
  - Theological review need: Low
- Isaiah 40:27-31
  - Verdict: Improved
  - Issue: Needed exilic comfort setting and waiting-on-the-Lord framing.
  - Changed fields: `context`
  - Theological review need: Low
- John 11:32-44
  - Verdict: Improved
  - Issue: Needed Lazarus context and grief/resurrection balance.
  - Changed fields: `context`
  - Theological review need: Low
- 2 Corinthians 1:3-7
  - Verdict: Improved
  - Issue: Needed Paul's affliction/comfort/ministry setting.
  - Changed fields: `context`
  - Theological review need: Low
- Revelation 21:1-5
  - Verdict: Improved
  - Issue: Needed future-consummation framing so present grief is not minimized.
  - Changed fields: `context`
  - Theological review need: Low

## Pending Full Review

The following areas still need plan-by-plan source-backed review before claiming the whole library has been audited:

- Long whole-Bible plans and generated chapter-range plans.
- Old Testament overview plans.
- New Testament overview plans.
- Major Prophets Overview.
- Psalms and Proverbs in 1 Year.
- New Testament in 1 Year.
- Bible in 365 Days / chronological / Old-New variants.
- Medium overview plans with generated or broad devotional entries.
- All lighter topical plans not listed above.

## Editorial Rules To Preserve

- Keep pastoral care notes attached to anxiety/grief plans.
- Keep context concise: usually 2-4 sentences, under 700 characters where possible.
- Do not turn Old Testament promises into direct individual guarantees without naming first context.
- Do not turn poetry or wisdom into unconditional promises.
- Do not use Psalm 46:10 as a simple relaxation slogan.
- Do not shame anxiety or grief as spiritual failure.
- Keep Christ-centered application tethered to the passage's actual argument.


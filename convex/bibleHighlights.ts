import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authorizeProfileAccess } from "./profileAccess";
import { assertProfileCanWrite } from "./security";

const color = v.union(v.literal("gold"), v.literal("blue"), v.literal("green"));

function validLocation(book: string, chapter: number) {
  return book.length > 0 && book.length <= 40 && Number.isInteger(chapter) && chapter >= 1 && chapter <= 150;
}

export const chapterHighlights = query({
  args: { profileId: v.id("profiles"), clientKey: v.optional(v.string()), book: v.string(), chapter: v.number() },
  returns: v.array(v.object({ verse: v.number(), color })),
  handler: async (ctx, args) => {
    await authorizeProfileAccess(ctx, args.profileId, args.clientKey);
    if (!validLocation(args.book, args.chapter)) return [];
    const rows = await ctx.db.query("bibleVerseHighlights")
      .withIndex("by_profile_and_book_and_chapter_and_verse", (q) =>
        q.eq("profileId", args.profileId).eq("book", args.book).eq("chapter", args.chapter))
      .take(176);
    return rows.map(({ verse, color }) => ({ verse, color }));
  }
});

export const setHighlights = mutation({
  args: {
    profileId: v.id("profiles"), clientKey: v.optional(v.string()),
    book: v.string(), chapter: v.number(), verses: v.array(v.number()),
    color: v.union(color, v.null())
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await authorizeProfileAccess(ctx, args.profileId, args.clientKey);
    assertProfileCanWrite(profile);
    if (!validLocation(args.book, args.chapter) || args.verses.length < 1 || args.verses.length > 176) {
      throw new Error("Invalid highlight range");
    }
    const verses = [...new Set(args.verses)];
    if (verses.some((verse) => !Number.isInteger(verse) || verse < 1 || verse > 176)) {
      throw new Error("Invalid verse number");
    }
    for (const verse of verses) {
      const existing = await ctx.db.query("bibleVerseHighlights")
        .withIndex("by_profile_and_book_and_chapter_and_verse", (q) =>
          q.eq("profileId", args.profileId).eq("book", args.book).eq("chapter", args.chapter).eq("verse", verse))
        .unique();
      if (args.color === null) {
        if (existing) await ctx.db.delete(existing._id);
      } else if (existing) {
        await ctx.db.patch(existing._id, { color: args.color, updatedAt: Date.now() });
      } else {
        await ctx.db.insert("bibleVerseHighlights", {
          profileId: args.profileId, book: args.book, chapter: args.chapter,
          verse, color: args.color, updatedAt: Date.now()
        });
      }
    }
    return null;
  }
});

// @vitest-environment jsdom
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import { studyNoteExtensions } from "./studyNoteExtensions";

function originalExtensions() {
  return [StarterKit.configure({
    heading: false, codeBlock: false, horizontalRule: false, blockquote: false
  })];
}

describe("study note extension bundle", () => {
  it("preserves the enabled editor schema and extensions", () => {
    const original = new Editor({ extensions: originalExtensions() });
    const compact = new Editor({ extensions: studyNoteExtensions() });
    try {
      const names = (editor: Editor) => editor.extensionManager.extensions
        .map(extension => extension.name).filter(name => name !== "starterKit").sort();
      expect(names(compact)).toEqual(names(original));
      expect(Object.keys(compact.schema.nodes)).toEqual(Object.keys(original.schema.nodes));
      expect(Object.keys(compact.schema.marks)).toEqual(Object.keys(original.schema.marks));
    } finally {
      original.destroy();
      compact.destroy();
    }
  });

  it("round-trips saved formatting and keeps list and undo/redo commands", () => {
    const content = '<p><strong>Bold</strong> <em>italic</em> <u>underline</u> <s>strike</s> <code>code</code><br>Next line <a href="https://example.com">link</a></p><ul><li><p>Bullet</p></li></ul><ol><li><p>Numbered</p></li></ol>';
    const original = new Editor({ extensions: originalExtensions(), content });
    const compact = new Editor({ extensions: studyNoteExtensions(), content });
    try {
      expect(compact.getJSON()).toEqual(original.getJSON());
      expect(compact.getHTML()).toBe(original.getHTML());
      compact.commands.setContent("<p>Note</p>");
      compact.commands.setTextSelection({ from: 1, to: 5 });
      compact.commands.toggleBold();
      compact.commands.toggleItalic();
      compact.commands.toggleUnderline();
      compact.commands.toggleBulletList();
      const formatted = compact.getHTML();
      expect(formatted).toContain("<ul>");
      expect(formatted).toContain("<strong>");
      expect(formatted).toContain("<em>");
      expect(formatted).toContain("<u>");
      expect(compact.commands.undo()).toBe(true);
      expect(compact.getHTML()).not.toBe(formatted);
      expect(compact.commands.redo()).toBe(true);
      expect(compact.getHTML()).toBe(formatted);
    } finally {
      original.destroy();
      compact.destroy();
    }
  });
});

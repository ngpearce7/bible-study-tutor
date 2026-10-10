import Bold from "@tiptap/extension-bold";
import Code from "@tiptap/extension-code";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Italic from "@tiptap/extension-italic";
import Link from "@tiptap/extension-link";
import { BulletList } from "@tiptap/extension-list/bullet-list";
import { ListItem } from "@tiptap/extension-list/item";
import { ListKeymap } from "@tiptap/extension-list/keymap";
import { OrderedList } from "@tiptap/extension-list/ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Strike from "@tiptap/extension-strike";
import Text from "@tiptap/extension-text";
import Underline from "@tiptap/extension-underline";
import { Dropcursor } from "@tiptap/extensions/drop-cursor";
import { Gapcursor } from "@tiptap/extensions/gap-cursor";
import { TrailingNode } from "@tiptap/extensions/trailing-node";
import { UndoRedo } from "@tiptap/extensions/undo-redo";

// Match the enabled StarterKit features, using public subpath exports so Metro
// does not ship disabled nodes, task lists, and unrelated utility extensions.
export function studyNoteExtensions() {
  return [
    Bold, BulletList, Code, Document, Dropcursor, Gapcursor, HardBreak,
    UndoRedo, Italic, ListItem, ListKeymap, Link, OrderedList, Paragraph,
    Strike, Text, Underline, TrailingNode
  ];
}

import { Mark, mergeAttributes } from "@tiptap/core";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { createElement, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { View } from "react-native";

import { colors } from "@/components/ui";

type NoteFormatKind = "undo" | "redo" | "bold" | "italic" | "underline" | "highlight" | "bullet";

type ScriptureInsertSettings = {
  disabled: boolean;
  bold: boolean;
  italic: boolean;
  color: string;
  highlightColor: string;
  referencePosition: "front" | "end";
};

type ScriptureInsertRequest = {
  reference?: string;
  typedReference?: string;
};

type ScriptureInsertResult = {
  reference: string;
  text: string;
  typedReference?: string;
};

type ScriptureMatch = {
  reference: string;
  typed: string;
  start: number;
  end: number;
};

type ScriptureEditorMatch = ScriptureMatch & {
  from: number;
  to: number;
};

const ScriptureTextColor = Mark.create({
  name: "scriptureTextColor",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-scripture-color") || element.style.color || null,
        renderHTML: (attributes) =>
          attributes.color ? { "data-scripture-color": attributes.color, style: `color: ${attributes.color}` } : {}
      }
    };
  },
  parseHTML() {
    return [
      { tag: "span[data-scripture-color]" },
      {
        tag: "span",
        getAttrs: (element) => {
          const color = (element as HTMLElement).style.color;
          return color ? { color } : false;
        }
      }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  }
});

export function StudyNoteTiptapEditor({
  value,
  onChange,
  onSelectionChange,
  placeholder,
  studyFocusMode,
  writingPrompts = [],
  customWritingPrompts = [],
  writingPromptStatus,
  onAddCustomWritingPrompt,
  onRemoveCustomWritingPrompt,
  scriptureInsertStatus,
  scriptureInsertFocusKey,
  onInsertScripture,
  scriptureInsertSettings,
  onSaveScriptureInsertSettings,
  highlightPickerOpen,
  onOpenHighlightPicker,
  onCloseHighlightPicker,
  onSaveHighlightColor,
  scriptureSettingsOpen,
  onOpenScriptureSettings,
  onCloseScriptureSettings,
  phoneLayout = false,
  darkMode = false,
  appStyles,
  components,
  helpers
}: {
  value: string;
  onChange: (value: string, plainText?: string) => void;
  onSelectionChange: (selection: { start: number; end: number }) => void;
  placeholder: string;
  studyFocusMode: boolean;
  writingPrompts?: string[];
  customWritingPrompts?: string[];
  writingPromptStatus?: string;
  onAddCustomWritingPrompt?: (prompt: string) => boolean;
  onRemoveCustomWritingPrompt?: (prompt: string) => void;
  scriptureInsertStatus?: string;
  scriptureInsertFocusKey?: number;
  onInsertScripture?: (request?: ScriptureInsertRequest) => Promise<ScriptureInsertResult | null | undefined>;
  scriptureInsertSettings: ScriptureInsertSettings;
  onSaveScriptureInsertSettings: (settings: ScriptureInsertSettings) => Promise<void>;
  highlightPickerOpen: boolean;
  onOpenHighlightPicker: () => void;
  onCloseHighlightPicker: () => void;
  onSaveHighlightColor: (color: string) => Promise<void>;
  scriptureSettingsOpen: boolean;
  onOpenScriptureSettings: (event?: any) => void;
  onCloseScriptureSettings: () => void;
  phoneLayout?: boolean;
  darkMode?: boolean;
  appStyles: any;
  components: {
    WritingPromptChips: any;
    MobileNoteFormatBar: any;
    ScriptureInsertPrompt: any;
    NoteFormatToolbar: any;
    NoteHighlightColorPicker: any;
    ScriptureInsertSettingsDialog: any;
  };
  helpers: {
    findTypedScriptureReferenceMatches: (text: string) => ScriptureMatch[];
    getScriptureMatchKey: (match: { reference: string; from: number; to: number }) => string;
    richScriptureExpansion: (reference: string, verseText: string, settings: ScriptureInsertSettings) => string;
    sanitizeEditorHtml: (html: string) => string;
  };
}) {
  const {
    WritingPromptChips,
    MobileNoteFormatBar,
    ScriptureInsertPrompt,
    NoteFormatToolbar,
    NoteHighlightColorPicker,
    ScriptureInsertSettingsDialog
  } = components;
  const wrapRef = useRef<any>(null);
  const lastHtmlRef = useRef(value || "");
  const [scripturePopoverPosition, setScripturePopoverPosition] = useState({ left: 14, top: 70 });
  const [activeNoteFormats, setActiveNoteFormats] = useState<NoteFormatKind[]>([]);
  const [localScriptureMatch, setLocalScriptureMatch] = useState<ScriptureEditorMatch | null>(null);
  const [selectedTextActive, setSelectedTextActive] = useState(false);
  const [selectedTextRangeKey, setSelectedTextRangeKey] = useState("");
  const [mobileMiniBarPosition, setMobileMiniBarPosition] = useState({ left: 8, top: 0 });
  const [dismissedMobileMiniBarKey, setDismissedMobileMiniBarKey] = useState("");
  const [dismissedScriptureKey, setDismissedScriptureKey] = useState("");
  const scriptureInsertSettingsRef = useRef(scriptureInsertSettings);
  const dismissedScriptureKeyRef = useRef(dismissedScriptureKey);
  const savedEditorHighlightSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scriptureInsertSettingsRef.current = scriptureInsertSettings;
  }, [scriptureInsertSettings]);

  useEffect(() => {
    dismissedScriptureKeyRef.current = dismissedScriptureKey;
  }, [dismissedScriptureKey]);

  const syncTiptapState = (editor: Editor) => {
    const cursorMatch = findTiptapScriptureReferenceBeforeCursor(editor, helpers.findTypedScriptureReferenceMatches);
    const textBeforeCursor = cursorMatch.textBeforeCursor;
    const matchKey = cursorMatch.match ? helpers.getScriptureMatchKey(cursorMatch.match) : "";
    const nextMatch = !scriptureInsertSettingsRef.current.disabled && matchKey !== dismissedScriptureKeyRef.current ? cursorMatch.match : null;
    const nextFormats = getTiptapActiveFormats(editor);
    const nextSelectedTextActive = !editor.state.selection.empty;
    const nextSelectedTextRangeKey = nextSelectedTextActive ? `${editor.state.selection.from}:${editor.state.selection.to}` : "";

    setLocalScriptureMatch((current) => scriptureEditorMatchesEqual(current, nextMatch) ? current : nextMatch);
    setActiveNoteFormats((current) => noteFormatArraysEqual(current, nextFormats) ? current : nextFormats);
    setSelectedTextRangeKey((current) => {
      if (current !== nextSelectedTextRangeKey) setDismissedMobileMiniBarKey("");
      return current === nextSelectedTextRangeKey ? current : nextSelectedTextRangeKey;
    });
    setSelectedTextActive((current) => current === nextSelectedTextActive ? current : nextSelectedTextActive);
    if (nextSelectedTextActive) updateTiptapMobileMiniBarPosition(editor, wrapRef.current, setMobileMiniBarPosition);
    updateTiptapScripturePopoverPosition(editor, wrapRef.current, setScripturePopoverPosition);
    return textBeforeCursor;
  };

  const syncTiptapStateSoon = (editor: Editor) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      syncTimeoutRef.current = null;
      if (!editor.isDestroyed) syncTiptapState(editor);
    }, 16);
  };

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
        blockquote: false
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      ScriptureTextColor
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": placeholder,
        "data-placeholder": placeholder,
        class: "bst-note-editor"
      },
      handleDOMEvents: {
        keyup: () => {
          if (editor) syncTiptapStateSoon(editor);
          return false;
        },
        input: () => {
          if (editor) syncTiptapStateSoon(editor);
          return false;
        },
        paste: () => {
          if (editor) syncTiptapStateSoon(editor);
          return false;
        },
        click: () => {
          if (editor) syncTiptapStateSoon(editor);
          return false;
        },
        focus: () => {
          if (editor) syncTiptapStateSoon(editor);
          return false;
        },
        touchend: () => {
          if (editor) syncTiptapStateSoon(editor);
          return false;
        }
      }
    },
    onCreate: ({ editor }) => {
      syncTiptapStateSoon(editor);
    },
    onUpdate: ({ editor }) => {
      const nextHtml = helpers.sanitizeEditorHtml(editor.getHTML());
      lastHtmlRef.current = nextHtml;
      onChange(nextHtml, syncTiptapState(editor));
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      onSelectionChange({ start: from, end: to });
      syncTiptapState(editor);
    }
  });

  useEffect(() => {
    if (!editor || lastHtmlRef.current === value) return;
    const currentHtml = helpers.sanitizeEditorHtml(editor.getHTML());
    if (currentHtml === value) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
    lastHtmlRef.current = value || "";
    syncTiptapStateSoon(editor);
  }, [editor, value]);

  useEffect(() => {
    if (!editor || !scriptureInsertFocusKey) return;
    editor.commands.focus("end");
  }, [editor, scriptureInsertFocusKey]);

  useEffect(() => {
    if (scriptureInsertSettings.disabled) setLocalScriptureMatch(null);
  }, [scriptureInsertSettings.disabled]);

  const insertWritingPromptWeb = (prompt: string) => {
    if (!editor) return;
    const prefix = editor.getText().trim() ? "\n" : "";
    editor.chain().focus().insertContent(`${prefix}${prompt} `).run();
  };

  const insertScriptureWeb = async (chosenMatch?: ScriptureEditorMatch) => {
    if (!editor) return;
    const liveMatch =
      chosenMatch ||
      findTiptapScriptureReferenceBeforeCursor(editor, helpers.findTypedScriptureReferenceMatches).match ||
      localScriptureMatch;
    const reference = liveMatch?.reference || "";
    const typedReference = liveMatch?.typed || "";
    const result = await onInsertScripture?.({ reference, typedReference });
    if (!result) return;

    const { from } = editor.state.selection;
    const deleteFrom = liveMatch?.from || from;
    const deleteTo = liveMatch?.to || from;
    const html = helpers.richScriptureExpansion(result.reference, result.text, scriptureInsertSettingsRef.current);

    editor
      .chain()
      .focus()
      .deleteRange({ from: deleteFrom, to: deleteTo })
      .insertContent(html)
      .insertContent(" ")
      .run();

    const nextHtml = helpers.sanitizeEditorHtml(editor.getHTML());
    lastHtmlRef.current = nextHtml;
    setLocalScriptureMatch(null);
    onChange(nextHtml, syncTiptapState(editor));
  };

  const restoreEditorSelectionAfterDialog = () => {
    if (!editor) return;
    const savedSelection = savedEditorHighlightSelectionRef.current;
    if (!savedSelection) return;
    const windowRef = (globalThis as any).window;
    const scrollX = windowRef?.scrollX || 0;
    const scrollY = windowRef?.scrollY || 0;
    const restoreScroll = () => windowRef?.scrollTo?.(scrollX, scrollY);
    requestAnimationFrame(() => {
      if (editor.isDestroyed) return;
      editor.view.dom.focus?.({ preventScroll: true });
      editor.commands.setTextSelection(savedSelection);
      syncTiptapState(editor);
      updateTiptapMobileMiniBarPosition(editor, wrapRef.current, setMobileMiniBarPosition);
      restoreScroll();
      requestAnimationFrame(() => {
        if (editor.isDestroyed) return;
        editor.commands.setTextSelection(savedSelection);
        syncTiptapState(editor);
        updateTiptapMobileMiniBarPosition(editor, wrapRef.current, setMobileMiniBarPosition);
        restoreScroll();
      });
    });
  };

  const openEditorHighlightPicker = () => {
    if (editor && !editor.state.selection.empty) {
      const { from, to } = editor.state.selection;
      savedEditorHighlightSelectionRef.current = { from, to };
    }
    onOpenHighlightPicker();
  };

  const saveEditorHighlightColor = async (color: string) => {
    await onSaveHighlightColor(color);
    restoreEditorSelectionAfterDialog();
  };

  const applyTiptapFormat = (kind: NoteFormatKind) => {
    if (!editor) return;
    const selectedRange = !editor.state.selection.empty
      ? { from: editor.state.selection.from, to: editor.state.selection.to }
      : savedEditorHighlightSelectionRef.current;
    if (selectedRange) savedEditorHighlightSelectionRef.current = selectedRange;

    let chain = editor.chain();
    if (selectedRange) chain = chain.setTextSelection(selectedRange);
    if (!phoneLayout) chain = chain.focus();
    if (kind === "undo") chain.undo().run();
    if (kind === "redo") chain.redo().run();
    if (kind === "bold") chain.toggleBold().run();
    if (kind === "italic") chain.toggleItalic().run();
    if (kind === "underline") chain.toggleUnderline().run();
    if (kind === "highlight") chain.toggleHighlight({ color: scriptureInsertSettingsRef.current.highlightColor }).run();
    if (kind === "bullet") chain.toggleBulletList().run();
    setActiveNoteFormats(getTiptapActiveFormats(editor));
    syncTiptapState(editor);
  };

  const editorStyle = {
    backgroundColor: darkMode ? "#151a19" : "#fffaf2",
    border: `1px solid ${darkMode ? "rgba(233, 183, 106, 0.2)" : colors.line}`,
    borderRadius: 11,
    color: darkMode ? "#f7eddc" : colors.ink,
    marginBottom: 14,
    minHeight: studyFocusMode ? (phoneLayout ? 220 : 260) : phoneLayout ? 170 : 150,
    outline: "none",
    overflow: "hidden"
  };
  const visibleScriptureReference = localScriptureMatch?.reference || "";
  const dismissScripturePrompt = () => {
    if (localScriptureMatch) {
      const nextKey = helpers.getScriptureMatchKey(localScriptureMatch);
      dismissedScriptureKeyRef.current = nextKey;
      setDismissedScriptureKey(nextKey);
    }
    setLocalScriptureMatch(null);
  };

  return (
    <View ref={wrapRef} style={appStyles.studyNoteEditorWrap}>
      {createElement("style", {
        children: `.bst-note-editor{box-sizing:border-box;min-height:${editorStyle.minHeight}px;padding:${phoneLayout ? "15px" : "14px"};outline:none;line-height:22px;white-space:pre-wrap;color:inherit}.bst-note-editor p{margin:0 0 10px}.bst-note-editor p:last-child{margin-bottom:0}.bst-note-editor ul{margin:0 0 10px 20px;padding:0}.bst-note-editor mark{border-radius:4px;padding:0 2px}.bst-note-editor:empty:before{content:attr(data-placeholder);color:${darkMode ? "#8f8678" : "#7c7162"};pointer-events:none}`
      })}
      <WritingPromptChips
        prompts={writingPrompts}
        customPrompts={customWritingPrompts}
        status={writingPromptStatus}
        onInsert={insertWritingPromptWeb}
        onAddCustomPrompt={onAddCustomWritingPrompt}
        onRemoveCustomPrompt={onRemoveCustomWritingPrompt}
        compact={phoneLayout}
        darkMode={darkMode}
      />
      {createElement("div", { style: editorStyle, children: createElement(EditorContent, { editor }) })}
      {phoneLayout && selectedTextActive && dismissedMobileMiniBarKey !== selectedTextRangeKey && (
        <MobileNoteFormatBar
          onFormat={applyTiptapFormat}
          highlightColor={scriptureInsertSettings.highlightColor}
          onOpenHighlightPicker={openEditorHighlightPicker}
          onDismiss={() => setDismissedMobileMiniBarKey(selectedTextRangeKey)}
          floating
          style={{
            left: mobileMiniBarPosition.left,
            top: mobileMiniBarPosition.top
          }}
          darkMode={darkMode}
        />
      )}
      {!!visibleScriptureReference &&
        createElement("div", {
          style: {
            position: "absolute",
            left: scripturePopoverPosition.left,
            top: scripturePopoverPosition.top,
            zIndex: 20
          },
          children: createElement(ScriptureInsertPrompt, {
            reference: visibleScriptureReference,
            status: scriptureInsertStatus,
            onInsert: insertScriptureWeb,
            onDismiss: dismissScripturePrompt,
            compact: true,
            darkMode
          })
        })}
      <NoteFormatToolbar
        onFormat={applyTiptapFormat}
        activeFormats={activeNoteFormats}
        highlightActive={activeNoteFormats.includes("highlight")}
        highlightColor={scriptureInsertSettings.highlightColor}
        onOpenHighlightPicker={openEditorHighlightPicker}
        onOpenSettings={onOpenScriptureSettings}
        compact={phoneLayout}
        darkMode={darkMode}
      />
      {highlightPickerOpen && (
        <NoteHighlightColorPicker
          color={scriptureInsertSettings.highlightColor}
          onSelect={saveEditorHighlightColor}
          onClose={onCloseHighlightPicker}
          darkMode={darkMode}
        />
      )}
      {scriptureSettingsOpen && (
        <ScriptureInsertSettingsDialog
          settings={scriptureInsertSettings}
          onSave={onSaveScriptureInsertSettings}
          onClose={onCloseScriptureSettings}
          darkMode={darkMode}
          phoneLayout={phoneLayout}
        />
      )}
    </View>
  );
}

function findTiptapScriptureReferenceBeforeCursor(
  editor: Editor,
  findTypedScriptureReferenceMatches: (text: string) => ScriptureMatch[]
) {
  const { from } = editor.state.selection;
  if (!editor.state.selection.empty) return { textBeforeCursor: "", match: null };

  const textMap = getTiptapTextMapBeforeCursor(editor, from);
  const scanStart = Math.max(0, textMap.text.length - 700);
  const textBeforeCursor = textMap.text.slice(scanStart);
  const match = findTypedScriptureReferenceMatches(textBeforeCursor).at(-1);
  if (!match) return { textBeforeCursor, match: null };

  const textAfterMatch = textBeforeCursor.slice(match.end);
  if (textAfterMatch.length > 0) {
    return { textBeforeCursor, match: null };
  }

  const mappedStart = textMap.positions[scanStart + match.start];
  const mappedEnd = textMap.positions[scanStart + match.end - 1];
  if (!Number.isFinite(mappedStart) || !Number.isFinite(mappedEnd)) return { textBeforeCursor, match: null };

  return {
    textBeforeCursor,
    match: {
      ...match,
      from: mappedStart,
      to: Math.min(from, mappedEnd + 1)
    }
  };
}

function getTiptapTextMapBeforeCursor(editor: Editor, cursorPosition: number) {
  let text = "";
  const positions: number[] = [];

  editor.state.doc.descendants((node, pos) => {
    if (pos >= cursorPosition) return false;

    if (node.isText) {
      const nodeText = node.text || "";
      const end = Math.min(nodeText.length, Math.max(0, cursorPosition - pos));
      for (let index = 0; index < end; index += 1) {
        text += nodeText[index];
        positions.push(pos + index);
      }
      return false;
    }

    if (node.isBlock && text && !text.endsWith("\n")) {
      text += "\n";
      positions.push(Math.max(1, pos));
    }

    return true;
  });

  return { text, positions };
}

function getTiptapActiveFormats(editor: Editor): NoteFormatKind[] {
  const formats: NoteFormatKind[] = [];
  if (editor.isActive("bold")) formats.push("bold");
  if (editor.isActive("italic")) formats.push("italic");
  if (editor.isActive("underline")) formats.push("underline");
  if (editor.isActive("highlight")) formats.push("highlight");
  if (editor.isActive("bulletList")) formats.push("bullet");
  return formats;
}

function scriptureEditorMatchesEqual(left: ScriptureEditorMatch | null, right: ScriptureEditorMatch | null) {
  if (left === right) return true;
  if (!left || !right) return false;
  return left.reference === right.reference && left.typed === right.typed && left.from === right.from && left.to === right.to;
}

function noteFormatArraysEqual(left: NoteFormatKind[], right: NoteFormatKind[]) {
  if (left.length !== right.length) return false;
  return left.every((format, index) => format === right[index]);
}

function updateTiptapScripturePopoverPosition(
  editor: Editor,
  wrapper: any,
  setPosition: Dispatch<SetStateAction<{ left: number; top: number }>>
) {
  if (!wrapper) return;
  const view = editor.view;
  let coords;
  try {
    coords = view.coordsAtPos(editor.state.selection.from);
  } catch {
    return;
  }
  const wrapperRect = wrapper.getBoundingClientRect?.();
  const editorRect = view.dom.getBoundingClientRect?.();
  if (!coords || !wrapperRect || !editorRect) return;

  const left = Math.max(8, Math.min(coords.left - wrapperRect.left + 24, wrapperRect.width - 260));
  const top = Math.max(editorRect.top - wrapperRect.top + 8, coords.top - wrapperRect.top - 46);
  setPosition((current) => Math.abs(current.left - left) < 1 && Math.abs(current.top - top) < 1 ? current : { left, top });
}

function updateTiptapMobileMiniBarPosition(
  editor: Editor,
  wrapper: any,
  setPosition: Dispatch<SetStateAction<{ left: number; top: number }>>
) {
  if (!wrapper || editor.state.selection.empty) return;

  const view = editor.view;
  let coords;
  try {
    coords = view.coordsAtPos(editor.state.selection.to);
  } catch {
    return;
  }

  const wrapperRect = wrapper.getBoundingClientRect?.();
  const editorRect = view.dom.getBoundingClientRect?.();
  if (!coords || !wrapperRect || !editorRect) return;

  const estimatedWidth = 292;
  const left = Math.max(8, Math.min(coords.left - wrapperRect.left - estimatedWidth / 2, wrapperRect.width - estimatedWidth - 8));
  const top = Math.max(editorRect.top - wrapperRect.top + 8, coords.bottom - wrapperRect.top + 48);
  setPosition((current) => Math.abs(current.left - left) < 1 && Math.abs(current.top - top) < 1 ? current : { left, top });
}

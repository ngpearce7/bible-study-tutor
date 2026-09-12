/** Native notes are rendered as Text; strip active blocks before markup-to-text conversion. */
export function sanitizeEditorHtml(html: string) {
  return html.replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
}

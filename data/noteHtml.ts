import DOMPurify from "dompurify";

const safeColor = /^(?:#[0-9a-f]{3,8}|[a-z]{1,20}|rgba?\([\d.,%\s]+\))$/i;
const safeStyles = new Set(["color", "background-color"]);
if (typeof DOMPurify.addHook === "function") DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
  if (data.attrName !== "style") return;
  data.attrValue = data.attrValue.split(";").flatMap(declaration => {
    const [property, value] = declaration.split(":").map(part => part.trim());
    return safeStyles.has(property) && safeColor.test(value || "") ? [`${property}:${value}`] : [];
  }).join(";");
  if (!data.attrValue) data.keepAttr = false;
});

export function sanitizeEditorHtml(html: string) {
  // Static rendering has no DOM. Never pass untrusted markup through on the server.
  if (typeof DOMPurify.sanitize !== "function") return html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "mark", "ul", "ol", "li", "span", "blockquote"],
    ALLOWED_ATTR: ["style", "data-scripture-color"],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false
  });
}

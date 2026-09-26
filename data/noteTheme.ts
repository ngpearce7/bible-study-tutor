// Display-only counterparts: stored note colours stay unchanged across themes.
const scriptureColors = [
  { light: "#241d19", rgb: "rgb(36, 29, 25)", dark: "#f7eddc" },
  { light: "#a04734", rgb: "rgb(160, 71, 52)", dark: "#e9a18c" },
  { light: "#39452e", rgb: "rgb(57, 69, 46)", dark: "#b9c9a2" },
  { light: "#9a6a1f", rgb: "rgb(154, 106, 31)", dark: "#e9b76a" }
];

export function scriptureDisplayColor(color: string, darkMode: boolean) {
  if (!darkMode) return color;
  const key = color.toLowerCase().replace(/\s/g, "");
  return scriptureColors.find(item => [item.light, item.rgb.replace(/\s/g, "")].includes(key))?.dark || color;
}

export const noteThemeCss = scriptureColors.map(({ light, rgb, dark }) => {
  const values = [light, rgb, rgb.replace(/\s/g, "")];
  const selectors = values.map(value => `.bst-note-theme-dark .bst-note-editor [data-scripture-color="${value}" i]`);
  return `${selectors.join(",")} {color:${dark}!important}`;
}).join("\n") + `
.bst-note-editor mark,.bst-note-theme-dark .bst-note-editor mark [data-scripture-color],.bst-note-theme-light .bst-note-editor mark [data-scripture-color] {color:#241d19!important}
`;

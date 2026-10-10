// Shared visual language for the existing app layout and feature screens.
// Keep functional states (success, warning, Scripture highlights) separate.
export const theme = {
  light: {
    ink: "#10233b",
    muted: "#50647a",
    page: "#edf1f4",
    sidebar: "#f8fafc",
    surface: "#ffffff",
    line: "#dce4ea",
    soft: "#ecf3f8",
    selected: "#dcecf9",
    bronzeText: "#855120"
  },
  dark: {
    ink: "#f6f2ed",
    muted: "#bbb8b4",
    page: "#0d0d0e",
    sidebar: "#171718",
    surface: "#202021",
    raised: "#2b2a28",
    line: "#3a3a3b",
    selected: "#393229",
    bronze: "#d4a768"
  },
  brand: {
    navy: "#102640",
    bronze: "#bb824a"
  }
} as const;

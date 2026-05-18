import { createContext, PropsWithChildren, useContext } from "react";
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

export const colors = {
  ink: "#241d19",
  muted: "#766d63",
  paper: "#f8f1e6",
  panel: "#fffaf2",
  line: "#e4d6c5",
  olive: "#66724e",
  oliveDark: "#39452e",
  gold: "#c3923e",
  coral: "#c96750",
  blue: "#426f7d",
  soft: "#f0eadf",
  blush: "#f7ddd2",
  sage: "#e5ecda"
};

export type ThemeColors = typeof colors;
type ThemeContextValue = { colors: ThemeColors; isDefault: boolean };

const ThemeContext = createContext<ThemeContextValue>({ colors, isDefault: true });

export function ThemeProvider({ children, isDefault = false, value }: PropsWithChildren<{ isDefault?: boolean; value: ThemeColors }>) {
  return <ThemeContext.Provider value={{ colors: value, isDefault }}>{children}</ThemeContext.Provider>;
}

export function useThemeColors() {
  return useContext(ThemeContext).colors;
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const theme = useContext(ThemeContext);
  const themedStyle = theme.isDefault ? null : { backgroundColor: theme.colors.panel, borderColor: theme.colors.line, shadowColor: theme.colors.ink };
  return <View style={[styles.card, themedStyle, style]}>{children}</View>;
}

export function Eyebrow({ children }: PropsWithChildren) {
  const theme = useContext(ThemeContext);
  return <Text style={[styles.eyebrow, !theme.isDefault && { color: theme.colors.coral }]}>{children}</Text>;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  style,
  labelStyle
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}) {
  const theme = useContext(ThemeContext);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary"
          ? [styles.secondaryButton, !theme.isDefault && { backgroundColor: theme.colors.panel, borderColor: theme.colors.line }]
          : [styles.primaryButton, !theme.isDefault && { backgroundColor: theme.colors.coral }],
        pressed && styles.pressed,
        style
      ]}
    >
      <Text style={[variant === "secondary" ? [styles.secondaryLabel, !theme.isDefault && { color: theme.colors.oliveDark }] : styles.primaryLabel, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderColor: "rgba(108, 91, 67, 0.18)",
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#5a3f2d",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }
  },
  eyebrow: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: "uppercase"
  },
  button: {
    alignItems: "center",
    borderRadius: 11,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  primaryButton: {
    backgroundColor: colors.coral
  },
  secondaryButton: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1
  },
  primaryLabel: {
    color: "white",
    fontWeight: "700"
  },
  secondaryLabel: {
    color: colors.oliveDark,
    fontWeight: "700"
  },
  pressed: {
    opacity: 0.78
  }
});

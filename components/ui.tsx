import { createContext, useContext, PropsWithChildren } from "react";
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { theme } from "./theme";

export const colors = {
  ink: theme.light.ink,
  muted: theme.light.muted,
  paper: theme.light.page,
  panel: theme.light.surface,
  line: theme.light.line,
  olive: "#6b7d8f",
  oliveDark: theme.light.ink,
  gold: theme.brand.bronze,
  coral: theme.light.bronzeText,
  blue: "#426f94",
  soft: theme.light.soft,
  blush: theme.light.selected,
  sage: "#e9f0f4"
};

export const UIThemeContext = createContext(false);



export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Eyebrow({ children }: PropsWithChildren) {
  const dark = useContext(UIThemeContext);
  return <Text style={[styles.eyebrow, dark && { color: theme.dark.bronze }]}>{children}</Text>;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  style,
  labelStyle,
  disabled = false
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}) {
  const dark = useContext(UIThemeContext);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" ? styles.secondaryButton : styles.primaryButton,
        variant === "primary" && dark && styles.darkPrimaryButton,
        variant === "secondary" && dark && styles.darkSecondaryButton,
        pressed && styles.pressed,
        disabled && { opacity: 0.6 },
        style
      ]}
    >
      <Text style={[variant === "secondary" ? styles.secondaryLabel : styles.primaryLabel, variant === "primary" && dark && styles.darkPrimaryLabel, variant === "secondary" && dark && styles.darkSecondaryLabel, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderColor: theme.light.line,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: "100%",
    minWidth: 0,
    padding: 20,
    shadowColor: theme.light.ink,
    shadowOpacity: 0.045,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }
  },
  eyebrow: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: "uppercase"
  },
  button: {
    alignItems: "center",
    borderRadius: 11,
    maxWidth: "100%",
    minWidth: 0,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  primaryButton: {
    backgroundColor: theme.brand.navy
  },
  darkPrimaryButton: {
    backgroundColor: theme.dark.bronze
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: colors.line,
    borderWidth: 1
  },
  darkSecondaryButton: {
    borderColor: theme.dark.line
  },
  darkSecondaryLabel: {
    color: theme.dark.ink
  },
  primaryLabel: {
    color: "white",
    flexShrink: 1,
    fontWeight: "600",
    textAlign: "center"
  },
  darkPrimaryLabel: {
    color: theme.dark.page
  },
  secondaryLabel: {
    color: colors.oliveDark,
    flexShrink: 1,
    fontWeight: "600",
    textAlign: "center"
  },
  pressed: {
    opacity: 0.78
  }
});

import { PropsWithChildren } from "react";
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
  coral: "#b5533d",
  blue: "#426f7d",
  soft: "#f0eadf",
  blush: "#f7ddd2",
  sage: "#e5ecda"
};

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" ? styles.secondaryButton : styles.primaryButton,
        pressed && styles.pressed,
        disabled && { opacity: 0.6 },
        style
      ]}
    >
      <Text style={[variant === "secondary" ? styles.secondaryLabel : styles.primaryLabel, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderColor: "rgba(108, 91, 67, 0.10)",
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: "100%",
    minWidth: 0,
    padding: 20,
    shadowColor: "#5a3f2d",
    shadowOpacity: 0.025,
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
    maxWidth: "100%",
    minWidth: 0,
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
    flexShrink: 1,
    fontWeight: "700",
    textAlign: "center"
  },
  secondaryLabel: {
    color: colors.oliveDark,
    flexShrink: 1,
    fontWeight: "700",
    textAlign: "center"
  },
  pressed: {
    opacity: 0.78
  }
});

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
  coral: "#c96750",
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
  labelStyle
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" ? styles.secondaryButton : styles.primaryButton,
        pressed && styles.pressed,
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

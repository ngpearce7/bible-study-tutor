import type { StoredDevotionalTextSize } from "@/data/feedbackPreferences";

export type DevotionalTextSize = StoredDevotionalTextSize;

export const DEVOTIONAL_TEXT_SIZE_OPTIONS: { id: DevotionalTextSize; accessibilityLabel: string; iconSize: number }[] = [
  { id: "normal", accessibilityLabel: "Use normal devotional text size", iconSize: 13 },
  { id: "large", accessibilityLabel: "Use large devotional text size", iconSize: 16 },
  { id: "larger", accessibilityLabel: "Use larger devotional text size", iconSize: 19 }
];

export const DEVOTIONAL_TEXT_SIZE_STYLES: Record<DevotionalTextSize, {
  title: { fontSize: number; lineHeight: number };
  label: { fontSize: number; lineHeight: number };
  copy: { fontSize: number; lineHeight: number };
}> = {
  normal: { title: { fontSize: 13, lineHeight: 17 }, label: { fontSize: 10, lineHeight: 13 }, copy: { fontSize: 12, lineHeight: 18 } },
  large: { title: { fontSize: 15, lineHeight: 20 }, label: { fontSize: 12, lineHeight: 15 }, copy: { fontSize: 14, lineHeight: 21 } },
  larger: { title: { fontSize: 17, lineHeight: 23 }, label: { fontSize: 13, lineHeight: 17 }, copy: { fontSize: 16, lineHeight: 24 } }
};

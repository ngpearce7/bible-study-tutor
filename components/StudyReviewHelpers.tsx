import { createElement } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";

import { colors } from "@/components/ui";

function sanitizeEditorHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function richHtmlToMarkupText(text: string) {
  if (!/<\/?[a-z][\s\S]*>/i.test(text)) return text;

  return sanitizeEditorHtml(text)
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, "__$1__")
    .replace(/<(mark)[^>]*>([\s\S]*?)<\/\1>/gi, "==$2==")
    .replace(/<span[^>]*(background-color|background)[^>]*>([\s\S]*?)<\/span>/gi, "==$2==")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderFormattedNoteSegments(text: string, styles: any) {
  const segments = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|==[^=]+==)/g).filter((segment) => segment.length > 0);

  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <Text key={`${segment}-${index}`} style={styles.formattedBold}>
          {segment.slice(2, -2)}
        </Text>
      );
    }
    if (segment.startsWith("*") && segment.endsWith("*")) {
      return (
        <Text key={`${segment}-${index}`} style={styles.formattedItalic}>
          {segment.slice(1, -1)}
        </Text>
      );
    }
    if (segment.startsWith("__") && segment.endsWith("__")) {
      return (
        <Text key={`${segment}-${index}`} style={styles.formattedUnderline}>
          {segment.slice(2, -2)}
        </Text>
      );
    }
    if (segment.startsWith("==") && segment.endsWith("==")) {
      return (
        <Text key={`${segment}-${index}`} style={styles.formattedHighlight}>
          {segment.slice(2, -2)}
        </Text>
      );
    }
    return segment;
  });
}

export function CustomStudyReviewControl({ styles, value, onChange, onSchedule }: any) {
  return (
    <View style={styles.customReviewControl}>
      <Text style={styles.customReviewLabel}>Custom</Text>
      <TextInput
        accessibilityLabel="Custom review interval in days"
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        placeholder="14"
        style={styles.customReviewInput}
      />
      <Text style={styles.customReviewUnit}>days</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Set custom review interval" onPress={onSchedule} style={styles.addPromptButton}>
        <Text style={styles.addPromptText}>Set</Text>
      </Pressable>
    </View>
  );
}

export function FormattedNoteText({ styles, text, darkMode = false }: any) {
  if (!text.trim()) return null;
  const displayText = Platform.OS === "web" ? text : richHtmlToMarkupText(text);

  if (Platform.OS === "web" && /<\/?[a-z][\s\S]*>/i.test(displayText)) {
    return createElement("div", {
      style: {
        color: colors.ink,
        ...(darkMode ? { color: "#f7eddc" } : {}),
        fontSize: 15,
        lineHeight: "21px",
        marginBottom: 8
      },
      dangerouslySetInnerHTML: { __html: sanitizeEditorHtml(displayText) }
    });
  }

  return (
    <View style={styles.formattedNote}>
      {displayText.split("\n").map((line: string, index: number) => {
        const isBullet = line.trimStart().startsWith("- ");
        const content = isBullet ? line.trimStart().slice(2) : line;

        return (
          <View key={`${line}-${index}`} style={isBullet ? styles.formattedBulletRow : undefined}>
            {isBullet && <Text style={styles.formattedBullet}>•</Text>}
            <Text style={[styles.body, darkMode && styles.accountDarkText, isBullet && styles.formattedBulletText]}>{renderFormattedNoteSegments(content, styles)}</Text>
          </View>
        );
      })}
    </View>
  );
}

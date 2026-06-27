import { memo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInput as TextInputType } from "react-native";
import {
  formatMemoryBlankValue,
  memoryAnswerIsReference,
  memoryBlankWidth,
  memoryHintRevealCount,
  memoryHintText,
  normalizeMemoryAnswer
} from "@/data/memory";
import { colors } from "@/components/ui";

type MemoryBlankProps = {
  token: { index: number; answer: string };
  value: string;
  checked: boolean;
  hintsVisible: boolean;
  hintLevel: number;
  inputRef?: (input: TextInputType | null) => void;
  onChange: (value: string, plainText?: string) => void;
  onSubmit?: () => void;
  onMoreHint: () => void;
  returnKeyType?: "next" | "done";
  compact?: boolean;
  darkMode?: boolean;
};

function MemoryBlankComponent({
  token,
  value,
  checked,
  hintsVisible,
  hintLevel,
  inputRef,
  onChange,
  onSubmit,
  onMoreHint,
  returnKeyType = "next",
  compact = false,
  darkMode = false
}: MemoryBlankProps) {
  const correct = !!value && normalizeMemoryAnswer(value) === normalizeMemoryAnswer(token.answer);
  const normalizedValue = normalizeMemoryAnswer(value);
  const normalizedAnswer = normalizeMemoryAnswer(token.answer);
  const incorrect = !!normalizedValue && !correct && (checked || normalizedValue.length >= normalizedAnswer.length);
  const canShowMoreHint = memoryHintRevealCount(token.answer, hintLevel) < token.answer.replace(/[^a-z0-9]/gi, "").length;

  return (
    <View style={[styles.wrap, { width: memoryBlankWidth(token.answer, compact) }]}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(nextValue) => onChange(formatMemoryBlankValue(token.answer, nextValue))}
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
        blurOnSubmit={false}
        keyboardType={memoryAnswerIsReference(token.answer) ? "numbers-and-punctuation" : "default"}
        returnKeyType={returnKeyType}
        style={[
          styles.input,
          darkMode && styles.darkInput,
          correct && styles.correctInput,
          darkMode && correct && styles.darkCorrectInput,
          incorrect && styles.incorrectInput
        ]}
      />
      {hintsVisible && !correct && (
        <View style={styles.hintRow}>
          <Text style={styles.hintText}>{memoryHintText(token.answer, hintLevel)}</Text>
          {canShowMoreHint && (
            <Pressable onPress={onMoreHint} style={styles.moreHintButton}>
              <Text style={[styles.moreHintText, darkMode && styles.darkMutedText]}>Hint</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export const MemoryBlank = memo(MemoryBlankComponent);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 1,
    minHeight: 45
  },
  input: {
    backgroundColor: "transparent",
    borderBottomColor: colors.coral,
    borderBottomWidth: 2,
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 25,
    minHeight: 32,
    paddingHorizontal: 4,
    paddingVertical: 0,
    textAlign: "center",
    width: "100%"
  },
  correctInput: {
    backgroundColor: "rgba(138, 154, 91, 0.14)",
    borderColor: "rgba(102, 114, 78, 0.35)",
    borderBottomColor: colors.olive
  },
  darkInput: {
    color: "#f7eddc"
  },
  darkCorrectInput: {
    backgroundColor: "rgba(233, 183, 106, 0.14)",
    borderColor: "rgba(233, 183, 106, 0.34)",
    borderBottomColor: "#e9b76a",
    color: "#f7eddc"
  },
  incorrectInput: {
    backgroundColor: "rgba(201, 103, 80, 0.18)",
    borderColor: "rgba(201, 103, 80, 0.75)",
    borderBottomColor: colors.coral,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.coral
  },
  hintRow: {
    alignItems: "center",
    gap: 2
  },
  hintText: {
    color: colors.coral,
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12
  },
  moreHintButton: {
    paddingHorizontal: 3,
    paddingVertical: 1
  },
  moreHintText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 10
  },
  darkMutedText: {
    color: "#b9b0a3"
  }
});

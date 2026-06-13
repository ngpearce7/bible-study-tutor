import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import { Card, colors } from "@/components/ui";

export function HelpScreenshot({
  title,
  caption,
  variant,
  darkMode = false,
  styles
}: {
  title: string;
  caption: string;
  variant: "bible" | "study" | "memory" | "journal";
  darkMode?: boolean;
  styles: any;
}) {
  return (
    <Card style={[styles.helpScreenshotCard, darkMode && styles.accountDarkMainCard]}>
      <View style={styles.helpScreenshotHeader}>
        <Text style={[styles.helpCardTitle, darkMode && styles.accountDarkTitle]}>{title}</Text>
        <View style={styles.helpWindowDots}>
          <View style={[styles.helpWindowDot, darkMode && styles.helpDarkWindowDot]} />
          <View style={[styles.helpWindowDot, darkMode && styles.helpDarkWindowDot]} />
          <View style={[styles.helpWindowDot, darkMode && styles.helpDarkWindowDot]} />
        </View>
      </View>
      <View style={[styles.helpScreenshotFrame, darkMode && styles.helpDarkScreenshotFrame]}>
        {variant === "bible" && (
          <>
            <View style={styles.helpScreenshotTopBar}>
              <Text style={[styles.helpScreenshotLabel, darkMode && styles.accountDarkTitle]}>Psalms 23</Text>
              <Text style={[styles.helpScreenshotPill, darkMode && styles.helpDarkScreenshotPill]}>BSB</Text>
            </View>
            <View style={styles.helpVerseLine}><Text style={[styles.helpVerseNumber, darkMode && styles.homeDarkAccentText]}>1</Text><View style={[styles.helpLongLine, darkMode && styles.helpDarkLine]} /></View>
            <View style={[styles.helpVerseLine, styles.helpSelectedLine, darkMode && styles.helpDarkSelectedLine]}><Text style={[styles.helpVerseNumber, darkMode && styles.homeDarkAccentText]}>2</Text><View style={[styles.helpShortLine, darkMode && styles.helpDarkLine]} /></View>
            <View style={[styles.helpDockPreview, darkMode && styles.helpDarkDockPreview]}>
              <Text style={styles.helpDockButton}>Study</Text>
              <Text style={styles.helpDockButton}>Note</Text>
              <Text style={styles.helpDockButton}>Print</Text>
              <Text style={styles.helpDockButton}>Memory</Text>
            </View>
          </>
        )}
        {variant === "study" && (
          <>
            <View style={styles.helpScreenshotTopBar}>
              <Text style={[styles.helpScreenshotLabel, darkMode && styles.accountDarkTitle]}>Step 2 of 4</Text>
              <Text style={[styles.helpScreenshotPill, darkMode && styles.helpDarkScreenshotPill]}>SOAP</Text>
            </View>
            <View style={[styles.helpTextAreaPreview, darkMode && styles.helpDarkTextAreaPreview]}>
              <View style={[styles.helpLongLine, darkMode && styles.helpDarkLine]} />
              <View style={[styles.helpMediumLine, darkMode && styles.helpDarkLine]} />
              <View style={[styles.helpShortLine, darkMode && styles.helpDarkLine]} />
            </View>
            <View style={styles.helpToolbarPreview}>
              {["B", "I", "U", "H"].map((item) => <Text key={item} style={[styles.helpToolButton, darkMode && styles.helpDarkToolButton]}>{item}</Text>)}
            </View>
          </>
        )}
        {variant === "memory" && (
          <>
            <View style={styles.helpScreenshotTopBar}>
              <Text style={[styles.helpScreenshotLabel, darkMode && styles.accountDarkTitle]}>John 3:16</Text>
              <Text style={[styles.helpScreenshotPill, darkMode && styles.helpDarkScreenshotPill]}>Step 2</Text>
            </View>
            <View style={styles.helpMemoryLine}>
              <View style={[styles.helpBlankWord, darkMode && styles.helpDarkBlankWord]} />
              <Text style={[styles.helpMemoryWord, darkMode && styles.accountDarkTitle]}>so</Text>
              <View style={[styles.helpBlankWord, darkMode && styles.helpDarkBlankWord]} />
              <Text style={[styles.helpMemoryWord, darkMode && styles.accountDarkTitle]}>the</Text>
            </View>
            <Text style={styles.helpDockButton}>Check answers</Text>
          </>
        )}
        {variant === "journal" && (
          <>
            <View style={styles.helpScreenshotTopBar}>
              <Text style={[styles.helpScreenshotLabel, darkMode && styles.accountDarkTitle]}>Journal</Text>
              <Text style={[styles.helpScreenshotPill, darkMode && styles.helpDarkScreenshotPill]}>List</Text>
            </View>
            {["Psalm 23", "James 1:5", "Encouragement"].map((item) => (
              <View key={item} style={[styles.helpJournalRow, darkMode && styles.helpDarkJournalRow]}>
                <Text style={[styles.helpJournalTitle, darkMode && styles.accountDarkTitle]}>{item}</Text>
                <Ionicons name="chevron-down-outline" size={14} color={darkMode ? "#c8bda9" : colors.muted} />
              </View>
            ))}
          </>
        )}
      </View>
      <Text style={[styles.helpCardText, darkMode && styles.accountDarkMutedText]}>{caption}</Text>
    </Card>
  );
}

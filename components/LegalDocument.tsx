import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { styles } from "./appStyles";
import { colors } from "./ui";
import { LEGAL_LAST_UPDATED, PRIVACY_POLICY_SECTIONS, TERMS_OF_SERVICE_SECTIONS } from "@/data/legal";

export function LegalDocument({
  title,
  icon,
  open,
  kind,
  onToggle,
  darkMode = false
}: {
  title: string;
  icon: string;
  open: boolean;
  kind: "privacy" | "terms";
  onToggle: () => void;
  darkMode?: boolean;
}) {
  const sections = kind === "privacy" ? PRIVACY_POLICY_SECTIONS : TERMS_OF_SERVICE_SECTIONS;
  return (
    <View style={[styles.legalDocBox, darkMode && styles.accountDarkLegalDocBox]}>
      <Pressable onPress={onToggle} style={styles.legalDocHeader}>
        <View style={styles.feedbackHeader}>
          <Ionicons name={icon as any} size={18} color={darkMode ? "#e9b76a" : colors.coral} />
          <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>{title}</Text>
        </View>
        <Ionicons name={open ? "chevron-up-outline" : "chevron-down-outline"} size={17} color={darkMode ? "#c8bda9" : colors.muted} />
      </Pressable>
      {open && (
        <View style={styles.legalDocBody}>
          <Text style={[styles.legalUpdatedText, darkMode && styles.accountDarkMutedText]}>Last updated {LEGAL_LAST_UPDATED}</Text>
          {sections.map((section) => (
            <View key={section.title} style={styles.legalDocSection}>
              <Text style={[styles.legalDocSectionTitle, darkMode && styles.accountDarkTitle]}>{section.title}</Text>
              <Text style={[styles.legalDocText, darkMode && styles.accountDarkMutedText]}>{section.body}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}


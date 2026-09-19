import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { getContextHelp, type ContextHelpContext } from "@/data/help";
import { styles } from "./appStyles";
import { AppButton } from "./ui";

export default function ContextHelpDialog({ tab, context, dark, onClose, onFullHelp }: {
  tab: string; context: ContextHelpContext; dark: boolean; onClose: () => void; onFullHelp: () => void;
}) {
  const help = getContextHelp(tab, context);
  return <Modal transparent visible animationType="fade" onRequestClose={onClose}>
    <View style={[styles.contextHelpOverlay, { justifyContent: "center" }]}>
      <Pressable accessibilityLabel="Close help" accessibilityRole="button" style={styles.contextHelpScrim} onPress={onClose} />
      <View accessibilityViewIsModal style={[styles.contextHelpCard, { marginTop: 0, maxHeight: "85%" }, dark && styles.accountDarkMainCard]}>
        <View style={styles.contextHelpHeader}>
          <Text accessibilityRole="header" style={[styles.feedbackTitle, { flex: 1 }, dark && styles.accountDarkTitle]}>{help.title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close help" onPress={onClose} style={styles.inlineHelpButton}>
            <Text style={[styles.muted, dark && styles.accountDarkText]}>Close</Text>
          </Pressable>
        </View>
        <ScrollView>
          <Text style={[styles.helpIntro, dark && styles.accountDarkMutedText]}>{help.summary}</Text>
          {help.tips.map(tip => <Text key={tip} style={[styles.contextHelpTipText, { marginTop: 14 }, dark && styles.accountDarkText]}>{tip}</Text>)}
        </ScrollView>
        <AppButton label="Full help" variant="secondary" onPress={onFullHelp} />
      </View>
    </View>
  </Modal>;
}

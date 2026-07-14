import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, Pressable, Text, TextInput, View } from "react-native";

import { HelpScreenshot } from "@/components/HelpScreenshot";
import { AppButton, Card, Eyebrow, colors } from "@/components/ui";

const quickHelpItems = [
  ["1", "Choose Scripture", "Open Bible, search, or type a passage in Study.", "reader-outline"],
  ["2", "Respond honestly", "Use a method, write notes, highlight verses, and save your study.", "create-outline"],
  ["3", "Print when useful", "Create worksheets for pen-and-paper study, groups, or church handouts.", "print-outline"],
  ["4", "Return later", "Review your journal, practise memory verses, and share encouragements.", "refresh-circle-outline"]
];

const contextualHelpItems = [
  ["Selected verses", "When verses are selected, help explains Study, Memory, Print, Note, and Bookmark actions.", "checkbox-outline"],
  ["Memory tools", "During review, browse, history, or meditation, help explains the current mode instead of the whole tab.", "sparkles-outline"],
  ["Journal views", "Calendar, Scripture, and filtered Journal views each get their own quick guidance.", "journal-outline"]
];

const guideItems = [
  {
    icon: "reader-outline",
    title: "Read and navigate Scripture",
    steps: [
      "Open Bible from the menu.",
      "Choose Old Testament or New Testament, then choose a book.",
      "Select a chapter from the chapter grid.",
      "Use Previous and Next at the bottom to keep reading."
    ],
    action: "Open Bible",
    target: "bible"
  },
  {
    icon: "search-outline",
    title: "Search for a passage or idea",
    steps: [
      "Open Bible and expand Search Scripture.",
      "Type exact words, a theme, or a question.",
      "On mobile, tap Search criteria to choose All, a Testament, match type, or a book.",
      "Use the result counts beside Old Testament and New Testament to scan quickly.",
      "Tap Read to open the result in the Bible reader, or Study to open it in the guided study area."
    ],
    action: "Try search",
    target: "bible"
  },
  {
    icon: "color-wand-outline",
    title: "Highlight or note verses",
    steps: [
      "In Bible or Study, tap a verse to select it.",
      "Tap another verse to select a range.",
      "Choose a highlight colour, Note, Bookmark, Study, or Memory.",
      "On mobile, use the action bar that appears near the bottom."
    ],
    action: "Read Scripture",
    target: "bible"
  },
  {
    icon: "book-outline",
    title: "Complete a guided study",
    steps: [
      "Open Study and choose a passage.",
      "Pick a method, or keep the suggested method.",
      "Write a response for each step and use the editor tools if you want bold, italics, underline, highlights, or inserted Scripture.",
      "Review, add a shareable insight, then save to Journal."
    ],
    action: "Start study",
    target: "study"
  },
  {
    icon: "print-outline",
    title: "Print a worksheet",
    steps: [
      "In Bible, select one or more verses and tap Print.",
      "In Study, use Print worksheet to print the current passage.",
      "If verses are selected in Study, the worksheet prints just those verses.",
      "On phone, open the worksheet, then use Share to Print or Save to Files."
    ],
    action: "Open Bible",
    target: "bible"
  },
  {
    icon: "sparkles-outline",
    title: "Memorize Scripture",
    steps: [
      "Save a verse to Memory from Bible or Study.",
      "For longer selections, choose Split into collection so the passage becomes smaller review sections.",
      "Open Memory and press Practice.",
      "Read the verse, fill every second word, then fill all words.",
      "Use hints when needed and choose a review rhythm such as daily, weekly, monthly, or annually.",
      "Use Meditate when you want to slow down with one verse."
    ],
    action: "Open Memory",
    target: "memory"
  },
  {
    icon: "folder-open-outline",
    title: "Group memory verses",
    steps: [
      "Open Memory, then Browse.",
      "Create collections for themes like Identity, Prayer, Promises, or Comfort.",
      "Use Add verses, then Collection, to create a collection from a whole Bible book or chapter range.",
      "To work toward a whole chapter or book, save sections into one collection such as Romans or Psalm 23.",
      "Filter by collection when you want to review or print a focused set.",
      "Use bulk review options after filtering if you want to change several review dates together."
    ],
    action: "Open Memory",
    target: "memory"
  },
  {
    icon: "albums-outline",
    title: "Print memory cards",
    steps: [
      "Open Memory and press Print cards.",
      "Choose due, reviewed, all, current view, or custom verses.",
      "Choose pocket or large cards and how many copies you want.",
      "Download the Word document, then print or adjust it in Word, Pages, or Google Docs."
    ],
    action: "Open Memory",
    target: "memory"
  },
  {
    icon: "journal-outline",
    title: "Review your journal",
    steps: [
      "Open Journal to see saved studies and encouragements.",
      "Use List for quick scanning.",
      "Open Filter when you want studies, meditations, highlights, drafts, pinned entries, or encouragements only.",
      "Use Calendar to review by date.",
      "Use Scripture view to browse entries by book and chapter."
    ],
    action: "Open Journal",
    target: "journal"
  },
  {
    icon: "time-outline",
    title: "Understand your daily rhythm",
    steps: [
      "Your rhythm grows when you engage with Scripture in the app.",
      "Reading, study, memory, encouragements, bookmarks, searches, and worksheets can count.",
      "It shows a steady pattern, not a score to feel guilty about.",
      "A grace day helps if you miss one day after recent activity."
    ],
    action: "Go Home",
    target: "home"
  }
];

const tabHelpItems = [
  ["Home", "Your starting point and next best actions.", "home-outline"],
  ["Bible", "Read, search, select verses, bookmark, note, print worksheets, and send to Study.", "reader-outline"],
  ["Study", "Guided Bible study with notes, highlights, coaching, worksheets, and saving.", "book-outline"],
  ["Methods", "Choose how you want to study a passage.", "layers-outline"],
  ["Plans", "Follow short guided paths over several days.", "calendar-outline"],
  ["Memory", "Review saved verses, meditate on Scripture, view history, and download memory cards.", "sparkles-outline"],
  ["Community", "Share encouragements privately with accepted friends or invite-only circles.", "people-outline"],
  ["Journal", "Review saved studies, drafts, highlights, and encouragements.", "journal-outline"],
  ["Account", "Manage your name, sign-in, username or email account, translation, appearance, and privacy details.", "person-circle-outline"]
];

const commonQuestions = [
  ["How do I make a note on a verse?", "In Bible, select a verse and tap Note. On mobile the note box opens in the bottom action panel."],
  ["How do I study selected verses?", "Select one or more verses in Bible, then tap Study. The app opens Study with those verses loaded."],
  ["How do I search Scripture?", "Open Bible, expand Search Scripture, type a word or idea, then press Search. On mobile, Search criteria hides the filters until you need them."],
  ["What does Read do in search results?", "Read opens the matching chapter in the Bible reader and selects the verse so you can keep reading around it."],
  ["Where do highlights go?", "Highlights stay with the saved study and can be found again from Journal."],
  ["How do I memorize a verse?", "Select verses in Bible or Study, tap Memory, then practise them from the Memory tab. You can also use Meditate for slower reflection."],
  ["How do I group memory verses?", "Open Memory, switch to Browse, and use Collections. Collections work well for themes like Identity, Prayer, Promises, or verses for a study group."],
  ["Can I print memory verses?", "Yes. Open Memory, tap Print cards, choose the saved verses and copies you want, then download the editable Word document."],
  ["How do I print a worksheet?", "Select verses in Bible and tap Print, or open Study and tap Print worksheet. On phone, use Share, then Print or Save to Files."],
  ["Can I create an account without email?", "Yes. In Account, create a free account with either an email address or a unique username. You can add an email later if you want."],
  ["How do I share an insight?", "On the final Study review screen, write or keep the shareable insight, choose a friend or circle, then tap Post insight."],
  ["How does daily rhythm work?", "It is a gentle measure of regular Scripture engagement. Studies, Bible reading actions, memory practice, encouragements, bookmarks, searches, and printed worksheets can count. It also allows a grace day, so missing one day does not immediately erase the rhythm."],
  ["How do I change the Bible translation?", "Open Account, then choose BSB, WEB, or KJV under Bible translations."],
  ["How do I hide busy panels?", "Use Focus mode in Study, collapse the Bible reader panel, and use the small arrow controls on collapsible sections."],
  ["Can I use the app without signing in?", "Yes. You can use a local profile, or sign in later to carry your work between devices."]
];

const troubleshootingItems = [
  ["The screen feels crowded", "Use Study Focus mode, collapse side panels, or open the mobile menu only when you need it."],
  ["I cannot find a saved verse", "Open Memory, switch to Browse, then filter by collection, book, chapter, or status."],
  ["The help button seems to change", "That is intentional. The floating help button responds to the tab and sub-view you are using."],
  ["I saved a note but not a bookmark", "That is expected. A note-only verse shows the note icon; a bookmarked verse shows the bookmark icon."],
  ["I want to find an older study", "Open Journal and use search, Calendar view, or Scripture view."],
  ["I am not signed in", "You can keep using a local profile. Sign in from Account when you want account-connected saving."]
];

const feedbackCategories = [
  ["bug", "Bug"],
  ["confusing", "Confusing"],
  ["suggestion", "Suggestion"],
  ["encouragement", "Encouragement"],
  ["other", "Other"]
];

export function HelpTab({
  styles,
  helpDarkMode,
  phoneLayout,
  firstName,
  setTab,
  openBibleFromPublicSource,
  openStudyFromPublicSource,
  shareAppLink,
  copyAppLink,
  appShareStatus,
  appShareQrDarkUri,
  appShareQrUri,
  ResumeButtonComponent,
  expandedHelpGuideTitle,
  setExpandedHelpGuideTitle,
  feedbackCategory,
  setFeedbackCategory,
  feedbackMessage,
  setFeedbackMessage,
  submitUserFeedback,
  feedbackStatus
}: any) {
  return (
    <View style={[styles.helpPage, helpDarkMode && styles.accountDarkLayout]}>
      <Card style={[styles.helpHeroCard, helpDarkMode && styles.accountDarkMainCard]}>
        <Eyebrow>Help</Eyebrow>
        <Text style={[styles.title, helpDarkMode && styles.accountDarkTitle]}>{firstName ? `${firstName}, start here` : "Start here"}</Text>
        <Text style={[styles.titleSupport, helpDarkMode && styles.accountDarkMutedText]}>
          Bible Study Tutor is a free Bible study app for desktop and mobile, made to help people and churches read, study, remember, journal, share Scripture, and print worksheets for pen-and-paper study.
        </Text>
        <View style={styles.helpActionRow}>
          <AppButton label="Open the Bible reader" onPress={() => openBibleFromPublicSource("help_hero")} style={phoneLayout && styles.phoneFullWidthButton} />
          <AppButton
            label="Start a guided study"
            variant="secondary"
            onPress={() => openStudyFromPublicSource("help_hero")}
            style={[phoneLayout && styles.phoneFullWidthButton, helpDarkMode && styles.homeDarkResumeButton]}
            labelStyle={helpDarkMode && styles.homeDarkResumeButtonText}
          />
          <AppButton
            label="Open journal"
            variant="secondary"
            onPress={() => setTab("journal")}
            style={[phoneLayout && styles.phoneFullWidthButton, helpDarkMode && styles.homeDarkResumeButton]}
            labelStyle={helpDarkMode && styles.homeDarkResumeButtonText}
          />
        </View>
      </Card>

      <Card style={[styles.helpShareCard, phoneLayout && styles.phoneHelpShareCard, helpDarkMode && styles.accountDarkMainCard]}>
        <View style={styles.helpShareCopy}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="qr-code-outline" size={19} color={helpDarkMode ? "#e9b76a" : colors.coral} />
            <Text style={[styles.helpCardTitle, helpDarkMode && styles.accountDarkTitle]}>Share Bible Study Tutor</Text>
          </View>
          <Text style={[styles.helpShareTitle, helpDarkMode && styles.accountDarkTitle]}>Invite someone to study Scripture with you.</Text>
          <Text style={[styles.helpCardText, helpDarkMode && styles.accountDarkMutedText]}>
            Bible Study Tutor is free and works on desktop and mobile. Scan the QR code, copy the link, or send it straight to a friend, church group, or Bible study partner.
          </Text>
          <Text selectable style={[styles.helpShareUrl, helpDarkMode && styles.helpDarkShareUrl]}>biblestudytutor.org</Text>
          <View style={styles.helpShareActions}>
            <ResumeButtonComponent label="Share app" icon="share-outline" onPress={shareAppLink} style={[phoneLayout && styles.phoneHelpShareButton, helpDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneHelpShareButtonText, helpDarkMode && styles.homeDarkResumeButtonText]} iconColor={helpDarkMode ? "#e9b76a" : undefined} />
            <ResumeButtonComponent label="Copy link" icon="copy-outline" onPress={copyAppLink} style={[phoneLayout && styles.phoneHelpShareButton, helpDarkMode && styles.homeDarkResumeButton]} labelStyle={[phoneLayout && styles.phoneHelpShareButtonText, helpDarkMode && styles.homeDarkResumeButtonText]} iconColor={helpDarkMode ? "#e9b76a" : undefined} />
          </View>
          {!!appShareStatus && <Text style={styles.saveStatus}>{appShareStatus}</Text>}
        </View>
        <View style={[styles.helpQrFrame, helpDarkMode && styles.helpDarkQrFrame]}>
          <Image
            source={{ uri: helpDarkMode ? appShareQrDarkUri : appShareQrUri }}
            style={styles.helpQrImage}
            accessibilityLabel="QR code that opens Bible Study Tutor"
          />
          <Text style={[styles.helpQrCaption, helpDarkMode && styles.accountDarkMutedText]}>Scan to open</Text>
        </View>
      </Card>

      <View style={[styles.helpQuickGrid, phoneLayout && styles.phoneHelpGrid]}>
        {quickHelpItems.map(([number, title, body, icon]) => (
          <Card key={title} style={[styles.helpQuickCard, phoneLayout && styles.phoneHelpCard, helpDarkMode && styles.accountDarkMainCard]}>
            <View style={[styles.helpStepNumber, helpDarkMode && styles.helpDarkStepNumber]}><Text style={styles.helpStepNumberText}>{number}</Text></View>
            <Ionicons name={icon as any} size={20} color={helpDarkMode ? "#e9b76a" : colors.coral} />
            <Text style={[styles.helpCardTitle, helpDarkMode && styles.accountDarkTitle]}>{title}</Text>
            <Text style={[styles.helpCardText, helpDarkMode && styles.accountDarkMutedText]}>{body}</Text>
          </Card>
        ))}
      </View>

      <View style={[styles.helpWalkthroughGrid, phoneLayout && styles.phoneHelpGrid]}>
        <HelpScreenshot title="Bible reader" caption="Read by book and chapter, search Scripture, then tap Read to open a result with that verse selected." variant="bible" darkMode={helpDarkMode} styles={styles} />
        <HelpScreenshot title="Guided study" caption="Follow the current step, write notes in the box, then save and continue. Focus mode hides extra panels." variant="study" darkMode={helpDarkMode} styles={styles} />
        <HelpScreenshot title="Memory practice" caption="Save verses to Memory, practise them in three steps, meditate slowly, or download editable verse cards." variant="memory" darkMode={helpDarkMode} styles={styles} />
        <HelpScreenshot title="Journal review" caption="Your saved studies, highlights, encouragements, and reflections collect here for later review." variant="journal" darkMode={helpDarkMode} styles={styles} />
      </View>

      <Card style={[styles.helpSectionCard, helpDarkMode && styles.accountDarkMainCard]}>
        <View style={styles.feedbackHeader}>
          <Ionicons name="help-circle-outline" size={19} color={helpDarkMode ? "#e9b76a" : colors.coral} />
          <Text style={[styles.sectionTitle, helpDarkMode && styles.accountDarkTitle]}>Help from anywhere</Text>
        </View>
        <Text style={[styles.helpCardText, helpDarkMode && styles.accountDarkMutedText]}>
          The floating help button changes with the part of the app you are using. It can explain selected Bible verses, Scripture search results, memory practice, meditation, Journal views, Community history, Account sign-in, and Admin review screens.
        </Text>
        <View style={styles.helpTabGrid}>
          {contextualHelpItems.map(([title, body, icon]) => (
            <View key={title} style={[styles.helpTabItem, phoneLayout && styles.phoneHelpTabItem, helpDarkMode && styles.helpDarkTabItem]}>
              <Ionicons name={icon as any} size={17} color={helpDarkMode ? "#e9b76a" : colors.oliveDark} />
              <View style={styles.helpTabCopy}>
                <Text style={[styles.helpFaqQuestion, helpDarkMode && styles.accountDarkTitle]}>{title}</Text>
                <Text style={[styles.helpFaqAnswer, helpDarkMode && styles.accountDarkMutedText]}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card style={[styles.helpSectionCard, helpDarkMode && styles.accountDarkMainCard]}>
        <Text style={[styles.sectionTitle, helpDarkMode && styles.accountDarkTitle]}>Step-by-step guide</Text>
        <View style={[styles.helpGuideGrid, phoneLayout && styles.phoneHelpGuideGrid]}>
          {guideItems.map((item) => {
            const guideOpen = !phoneLayout || expandedHelpGuideTitle === item.title;

            return (
              <View key={item.title} style={[styles.helpGuideItem, phoneLayout && styles.phoneHelpGuideItem, phoneLayout && guideOpen && styles.phoneHelpGuideItemOpen, helpDarkMode && styles.helpDarkGuideItem]}>
                <Pressable
                  onPress={() => phoneLayout && setExpandedHelpGuideTitle((current: string) => current === item.title ? "" : item.title)}
                  style={[styles.feedbackHeader, phoneLayout && styles.phoneHelpGuideHeader]}
                  accessibilityRole={phoneLayout ? "button" : undefined}
                  accessibilityLabel={phoneLayout ? `${guideOpen ? "Collapse" : "Expand"} ${item.title}` : undefined}
                >
                  <Ionicons name={item.icon as any} size={18} color={helpDarkMode ? "#e9b76a" : colors.coral} />
                  <Text style={[styles.helpGuideTitle, helpDarkMode && styles.accountDarkTitle]}>{item.title}</Text>
                  {phoneLayout && (
                    <Ionicons name={guideOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={helpDarkMode ? "#c8bda9" : colors.muted} />
                  )}
                </Pressable>
                {guideOpen && (
                  <>
                    <View style={[styles.helpGuideStepList, phoneLayout && styles.phoneHelpGuideStepList]}>
                      {item.steps.map((stepText, index) => (
                        <View key={stepText} style={[styles.helpGuideStep, helpDarkMode && styles.helpDarkGuideStep, phoneLayout && styles.phoneHelpGuideStep]}>
                          <Text style={[styles.helpGuideStepNumber, helpDarkMode && styles.helpDarkGuideStepNumber]}>{index + 1}</Text>
                          <Text style={[styles.helpGuideStepText, phoneLayout && styles.phoneHelpGuideStepText, helpDarkMode && styles.accountDarkMutedText]}>{stepText}</Text>
                        </View>
                      ))}
                    </View>
                    <ResumeButtonComponent
                      label={item.action}
                      icon={item.icon}
                      onPress={() => setTab(item.target)}
                      style={[phoneLayout && styles.phoneHelpGuideAction, helpDarkMode && styles.homeDarkResumeButton]}
                      labelStyle={[phoneLayout && styles.phoneHelpGuideActionText, helpDarkMode && styles.homeDarkResumeButtonText]}
                      iconColor={helpDarkMode ? "#e9b76a" : undefined}
                    />
                  </>
                )}
              </View>
            );
          })}
        </View>
      </Card>

      <Card style={[styles.helpSectionCard, helpDarkMode && styles.accountDarkMainCard]}>
        <Text style={[styles.sectionTitle, helpDarkMode && styles.accountDarkTitle]}>What each tab is for</Text>
        <View style={styles.helpTabGrid}>
          {tabHelpItems.map(([title, body, icon]) => (
            <View key={title} style={[styles.helpTabItem, phoneLayout && styles.phoneHelpTabItem, helpDarkMode && styles.helpDarkTabItem]}>
              <Ionicons name={icon as any} size={17} color={helpDarkMode ? "#e9b76a" : colors.oliveDark} />
              <View style={styles.helpTabCopy}>
                <Text style={[styles.helpFaqQuestion, helpDarkMode && styles.accountDarkTitle]}>{title}</Text>
                <Text style={[styles.helpFaqAnswer, helpDarkMode && styles.accountDarkMutedText]}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card style={[styles.helpFaqCard, helpDarkMode && styles.accountDarkMainCard]}>
        <Text style={[styles.sectionTitle, helpDarkMode && styles.accountDarkTitle]}>Common questions</Text>
        {commonQuestions.map(([question, answer]) => (
          <View key={question} style={[styles.helpFaqItem, helpDarkMode && styles.helpDarkFaqItem]}>
            <Text style={[styles.helpFaqQuestion, helpDarkMode && styles.accountDarkTitle]}>{question}</Text>
            <Text style={[styles.helpFaqAnswer, helpDarkMode && styles.accountDarkMutedText]}>{answer}</Text>
          </View>
        ))}
      </Card>

      <Card style={[styles.helpSectionCard, helpDarkMode && styles.accountDarkMainCard]}>
        <Text style={[styles.sectionTitle, helpDarkMode && styles.accountDarkTitle]}>Troubleshooting</Text>
        <View style={styles.helpTroubleList}>
          {troubleshootingItems.map(([title, body]) => (
            <View key={title} style={[styles.helpTroubleItem, helpDarkMode && styles.helpDarkTroubleItem]}>
              <Ionicons name="alert-circle-outline" size={17} color={helpDarkMode ? "#e9b76a" : colors.coral} />
              <View style={styles.helpTabCopy}>
                <Text style={[styles.helpFaqQuestion, helpDarkMode && styles.accountDarkTitle]}>{title}</Text>
                <Text style={[styles.helpFaqAnswer, helpDarkMode && styles.accountDarkMutedText]}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card style={[styles.helpSectionCard, helpDarkMode && styles.accountDarkMainCard]}>
        <Text style={[styles.sectionTitle, helpDarkMode && styles.accountDarkTitle]}>Send feedback</Text>
        <Text style={[styles.helpCardText, helpDarkMode && styles.accountDarkMutedText]}>
          Use this for bugs, confusing areas, suggestions, or encouragement. Feedback is saved with basic context so it can be reviewed without needing private study notes.
        </Text>
        <View style={styles.feedbackCategoryRow}>
          {feedbackCategories.map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setFeedbackCategory(key)}
              style={[styles.feedbackCategoryChip, helpDarkMode && styles.helpDarkCategoryChip, feedbackCategory === key && styles.activeFeedbackCategoryChip, helpDarkMode && feedbackCategory === key && styles.accountDarkActiveOptionCard]}
            >
              <Text style={[styles.feedbackCategoryText, helpDarkMode && styles.accountDarkTitle, feedbackCategory === key && styles.activeFeedbackCategoryText]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          accessibilityLabel="Feedback message"
          multiline
          value={feedbackMessage}
          onChangeText={setFeedbackMessage}
          placeholder="What should be improved, fixed, or made clearer?"
          placeholderTextColor={helpDarkMode ? "#9d927f" : undefined}
          style={[styles.input, styles.feedbackInput, helpDarkMode && styles.accountDarkInput]}
        />
        <View style={styles.helpActionRow}>
          <AppButton label="Send feedback" onPress={submitUserFeedback} style={phoneLayout && styles.phoneFullWidthButton} />
        </View>
        {!!feedbackStatus && <Text style={styles.saveStatus}>{feedbackStatus}</Text>}
      </Card>
    </View>
  );
}

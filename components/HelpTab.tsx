import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";

import { HelpScreenshot } from "@/components/HelpScreenshot";
import { AppButton, Card, Eyebrow, colors } from "@/components/ui";

const quickHelpItems = [
  ["1", "Read", "Open the Bible reader, choose a book and chapter, or search for a word, theme, or question.", "reader-outline"],
  ["2", "Study", "Send a passage to Study, choose a method such as SOAP, then answer one guided step at a time.", "create-outline"],
  ["3", "Keep", "Save highlights, notes, bookmarks, memory verses, meditations, and completed studies for later.", "archive-outline"],
  ["4", "Share or print", "Post private encouragements, print worksheets, or download memory cards for offline use.", "print-outline"]
];

const contextualHelpItems = [
  ["Bible context", "Selected verses, Scripture search, and plan-highlighted readings each explain the next useful action.", "checkbox-outline"],
  ["Plans context", "Plans help explains current-plan days, date tiles, catch-up dates, and marking readings complete.", "calendar-outline"],
  ["Memory context", "Review, Browse, History, Meditation, collections, and printable cards each receive focused guidance.", "sparkles-outline"],
  ["Journal context", "List, Calendar, Scripture, and filtered Journal views explain where saved work goes.", "journal-outline"]
];

const helpCategories = [
  ["all", "All"],
  ["start", "Start"],
  ["plans", "Plans"],
  ["study", "Study"],
  ["keep", "Save"],
  ["memory", "Memory"],
  ["print", "Print"],
  ["share", "Share"],
  ["account", "Account"],
  ["trouble", "Fix"]
];

const guideItems = [
  {
    category: "start",
    icon: "reader-outline",
    title: "Start reading the Bible",
    summary: "Use this when you simply want to open Scripture and keep reading.",
    steps: [
      "Open Bible from the menu.",
      "Choose Old Testament or New Testament, then choose a book.",
      "Select a chapter from the chapter grid. The reader panel moves out of the way after you choose.",
      "Use Previous and Next at the bottom to keep reading.",
      "Use Mark Chapter Read when you want to track ordinary chapter reading."
    ],
    action: "Open Bible",
    target: "bible"
  },
  {
    category: "plans",
    icon: "calendar-outline",
    title: "Follow a reading plan",
    summary: "Reading plans are for steady Bible reading. They are different from guided study plans.",
    steps: [
      "Open Plans and choose a Bible reading plan. The selected plan becomes your Current plan.",
      "Use the horizontal day tiles to select a day. Dates are counted from the day you started following the plan.",
      "Open the day in Bible to read it, or Study to turn it into a guided study.",
      "Use Mark Today’s Plan Reading Complete when you finish that plan day. This is separate from Mark Chapter Read.",
      "If you miss days, use Catch up dates to shift the next incomplete reading to today without changing completed progress."
    ],
    action: "Open Plans",
    target: "plans"
  },
  {
    category: "study",
    icon: "search-outline",
    title: "Search for a passage or idea",
    summary: "Search helps when you know a word, phrase, question, or theme but not the reference.",
    steps: [
      "Open Bible and expand Search Scripture.",
      "Type exact words, a theme, or a question.",
      "On mobile, tap Search criteria to choose All, a Testament, match type, or a specific book.",
      "Use the result counts beside Old Testament and New Testament to scan quickly.",
      "Tap Read to open the result in context, or Study to open it in the guided study area."
    ],
    action: "Try search",
    target: "bible"
  },
  {
    category: "keep",
    icon: "color-wand-outline",
    title: "Save highlights, notes, and bookmarks",
    summary: "These are three different ways to keep a passage.",
    steps: [
      "In Bible or Study, tap a verse to select it.",
      "Tap another verse to select a range.",
      "Use Highlight when you want to mark the text visually.",
      "Use Note when you want to write something beside that passage.",
      "Use Bookmark when you want to quickly return to the passage later."
    ],
    action: "Read Scripture",
    target: "bible"
  },
  {
    category: "study",
    icon: "book-outline",
    title: "Study a passage",
    summary: "Guided Study helps you slow down and respond to Scripture step by step.",
    steps: [
      "Open Study and choose a passage.",
      "Pick a method such as SOAP, OIA, Inductive, Lectio Divina, READ, Verse Mapping, or Word Study.",
      "Read the instruction panel first, then write your response in the note box.",
      "Use editor tools for bold, italics, underline, highlights, bullets, undo, redo, or inserting Scripture references.",
      "Review your answers, add a shareable insight if useful, then save to Journal."
    ],
    action: "Start Study",
    target: "study"
  },
  {
    category: "print",
    icon: "print-outline",
    title: "Print a worksheet",
    summary: "Worksheets are for people who prefer pen and paper or group handouts.",
    steps: [
      "In Bible, select one or more verses and tap Print.",
      "In Study, use Print worksheet to print the current passage.",
      "If verses are selected in Study, the worksheet prints just those verses.",
      "Choose the method and worksheet options, then open the printable sheet.",
      "On phone, open the worksheet, then use Share to Print or Save to Files."
    ],
    action: "Print a worksheet",
    target: "bible"
  },
  {
    category: "memory",
    icon: "sparkles-outline",
    title: "Memorize Scripture",
    summary: "Memory is for reviewing saved verses over time. Journal is for saved studies and reflections.",
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
    category: "memory",
    icon: "folder-open-outline",
    title: "Group memory verses",
    summary: "Collections help you work with related verses without crowding the main Memory list.",
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
    category: "print",
    icon: "albums-outline",
    title: "Print memory cards",
    summary: "Memory cards let you carry verses physically or place them around the house.",
    steps: [
      "Open Memory and press Print cards.",
      "Choose due, reviewed, all, current view, collection, or custom verses.",
      "Choose pocket or large cards and how many copies you want.",
      "Download the Word document, then print or adjust it in Word, Pages, or Google Docs.",
      "Very long passages are better split into collections before printing."
    ],
    action: "Open Memory",
    target: "memory"
  },
  {
    category: "keep",
    icon: "journal-outline",
    title: "Review your journal",
    summary: "Journal brings together saved studies, meditations, encouragements, highlights, drafts, and reflections.",
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
    category: "share",
    icon: "people-outline",
    title: "Share encouragements privately",
    summary: "Community is intentionally private: no public timeline and no social feed.",
    steps: [
      "Create a free account, then add a friend by code/email or join an invite-only circle.",
      "Choose the friend or circle before posting an encouragement.",
      "From Study, use the shareable insight area when you want to post a study takeaway.",
      "Use History to find, copy, edit, or remove your own encouragements."
    ],
    action: "Open Community",
    target: "accountability"
  },
  {
    category: "account",
    icon: "person-circle-outline",
    title: "Manage account and privacy",
    summary: "You can use the app locally, or create a free account to sync across devices.",
    steps: [
      "Open Account to add your name, choose a translation, and set light or dark mode.",
      "Create an account with an email address or a unique username.",
      "Signed-in work can follow you across phone, web, and desktop.",
      "Privacy and Terms explain what is saved. You can request account deletion from Account."
    ],
    action: "Open Account",
    target: "account"
  },
  {
    category: "trouble",
    icon: "time-outline",
    title: "Understand your daily rhythm",
    summary: "Daily rhythm is encouragement, not pressure.",
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
  ["Bible", "Read, search, follow today’s plan reading, select verses, bookmark, note, print worksheets, and send to Study.", "reader-outline"],
  ["Study", "Guided Bible study with methods, notes, highlights, coaching, worksheets, sharing, and saving.", "book-outline"],
  ["Methods", "Choose how you want to study a passage.", "layers-outline"],
  ["Plans", "Browse Bible reading plans, follow one current plan, choose day tiles, create custom plans, and manage progress.", "calendar-outline"],
  ["Memory", "Review saved verses, meditate on Scripture, view history, and download memory cards.", "sparkles-outline"],
  ["Community", "Share encouragements privately with accepted friends or invite-only circles.", "people-outline"],
  ["Journal", "Review saved studies, meditations, drafts, highlights, bookmarks, and encouragements.", "journal-outline"],
  ["Account", "Manage your name, sign-in, username or email account, translation, appearance, and privacy details.", "person-circle-outline"]
];

const commonQuestions = [
  ["How do I follow a reading plan?", "Open Plans, choose a plan, and press Follow. The current plan appears at the top of Plans and as a small status panel in the Bible reader."],
  ["Why is a passage highlighted in the Bible reader?", "A soft highlight means the chapter matches a day in your current Bible reading plan. It helps you see when the passage you are reading belongs to the plan."],
  ["What is the difference between a reading plan and a guided study?", "Reading plans help you move through Bible passages over days. Guided Study helps you think through one passage using a method such as SOAP or OIA."],
  ["What is the difference between Mark Chapter Read and Mark Today’s Plan Reading Complete?", "Mark Chapter Read tracks normal Bible reading by chapter. Mark Today’s Plan Reading Complete only completes the current day in your active reading plan."],
  ["How do I make a note on a verse?", "In Bible, select a verse and tap Note. On mobile the note box opens in the bottom action panel."],
  ["How do I study selected verses?", "Select one or more verses in Bible, then tap Study. The app opens Study with those verses loaded."],
  ["How do I search Scripture?", "Open Bible, expand Search Scripture, type a word or idea, then press Search. On mobile, Search criteria hides the filters until you need them."],
  ["What does Read do in search results?", "Read opens the matching chapter in the Bible reader and selects the verse so you can keep reading around it."],
  ["Bookmark, note, or highlight?", "Bookmark is for returning to a passage, Note is for writing beside it, and Highlight is for marking text visually. Saved study highlights appear again in Journal."],
  ["Where did my notes go?", "Study notes and saved reflections go to Journal. Bible reader notes stay attached to the passage in the Bible tab and show a note icon beside the verse."],
  ["How do I memorize a verse?", "Select verses in Bible or Study, tap Memory, then practise them from the Memory tab. You can also use Meditate for slower reflection."],
  ["How do I group memory verses?", "Open Memory, switch to Browse, and use Collections. Collections work well for themes like Identity, Prayer, Promises, or verses for a study group."],
  ["Can I print memory verses?", "Yes. Open Memory, tap Print cards, choose the saved verses and copies you want, then download the editable Word document."],
  ["How do I print a worksheet?", "Select verses in Bible and tap Print, or open Study and tap Print worksheet. On phone, use Share, then Print or Save to Files."],
  ["How do I print from mobile?", "Open the worksheet or memory card document, then use your phone browser’s Share button. Choose Print, Save to Files, or send it to another app."],
  ["Can I create an account without email?", "Yes. In Account, create a free account with either an email address or a unique username. You can add an email later if you want."],
  ["Can I use the app without signing in?", "Yes. You can use a local profile. Sign in later if you want your saved work to follow you across devices."],
  ["What data is saved?", "The app saves the things you choose to keep: studies, journal entries, memory verses, bookmarks, notes, reading progress, settings, and private encouragements. It does not publish your work publicly."],
  ["How do I share an insight?", "On the final Study review screen, write or keep the shareable insight, choose a friend or circle, then tap Post insight."],
  ["How does daily rhythm work?", "It is a gentle measure of regular Scripture engagement. Studies, Bible reading actions, memory practice, encouragements, bookmarks, searches, and printed worksheets can count. It also allows a grace day, so missing one day does not immediately erase the rhythm."],
  ["How do I change the Bible translation?", "Open Account, then choose BSB, WEB, or KJV under Bible translations."],
  ["What should I do if the screen feels crowded?", "Use Focus mode in Study, collapse the Bible reader panel, hide mobile sections until needed, and open filters only when you are using them."]
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
  const [selectedHelpCategory, setSelectedHelpCategory] = useState("all");
  const visibleGuideItems = useMemo(
    () => selectedHelpCategory === "all"
      ? guideItems
      : guideItems.filter((item) => item.category === selectedHelpCategory),
    [selectedHelpCategory]
  );

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

      <Card style={[styles.helpSectionCard, helpDarkMode && styles.accountDarkMainCard]}>
        <View style={styles.feedbackHeader}>
          <Ionicons name="compass-outline" size={19} color={helpDarkMode ? "#e9b76a" : colors.coral} />
          <Text style={[styles.sectionTitle, helpDarkMode && styles.accountDarkTitle]}>What do you need help with?</Text>
        </View>
        <Text style={[styles.helpCardText, helpDarkMode && styles.accountDarkMutedText]}>
          Choose a task to narrow the guide. Each topic focuses on what to do next, where saved items go, and which buttons matter.
        </Text>
        <View style={styles.helpCategoryRow}>
          {helpCategories.map(([key, label]) => {
            const active = selectedHelpCategory === key;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={`Show ${label} help topics`}
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedHelpCategory(key)}
                style={[styles.helpCategoryChip, helpDarkMode && styles.helpDarkCategoryChip, active && styles.activeHelpCategoryChip, helpDarkMode && active && styles.accountDarkActiveOptionCard]}
              >
                <Text style={[styles.helpCategoryText, helpDarkMode && styles.accountDarkTitle, active && styles.activeHelpCategoryText]}>{label}</Text>
              </Pressable>
            );
          })}
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
          {visibleGuideItems.map((item) => {
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
                    <Text style={[styles.helpGuideSummary, helpDarkMode && styles.accountDarkMutedText]}>{item.summary}</Text>
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
              accessibilityRole="button"
              accessibilityLabel={`Set feedback category to ${label}`}
              accessibilityState={{ selected: feedbackCategory === key }}
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

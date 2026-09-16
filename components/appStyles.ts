import { StyleSheet, Platform } from "react-native";
import { colors } from "./ui";

export const styles = StyleSheet.create({
  // Interior sections share the page surface; reserve cards for independent content.
  openSection: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 16,
    shadowOpacity: 0
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  darkSectionDivider: {
    borderTopColor: "rgba(247, 237, 220, 0.12)"
  },
  quickNav: { flexDirection: "row", backgroundColor: colors.panel, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 12, borderTopWidth: 1, borderTopColor: "rgba(108,91,67,0.12)", gap: 4 },
  quickNavItem: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
    flexDirection: "row",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    position: "relative"
  },
  appDarkScreen: {
    backgroundColor: "#181818"
  },
  compactScreen: {
    flexDirection: "column",
    maxWidth: "100%",
    minWidth: 0
  },
  connectionErrorBanner: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.coral,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 14,
    padding: 12
  },
  connectionErrorCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  mobileMenuBar: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderBottomColor: "rgba(108, 91, 67, 0.18)",
    borderBottomWidth: 1,
    elevation: 20,
    flexDirection: "row",
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: "relative",
    width: "100%",
    zIndex: 100
  },
  appDarkMobileMenuBar: {
    backgroundColor: "#242424",
    borderBottomColor: "rgba(233, 183, 106, 0.18)"
  },
  mobileMenuButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  appDarkMobileMenuButton: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.22)"
  },
  mobileMenuTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  mobileMenuTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700"
  },
  mobileMenuSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  sidebar: {
    backgroundColor: colors.panel,
    borderColor: "rgba(108, 91, 67, 0.18)",
    borderRightWidth: 1,
    gap: 22,
    padding: 16,
    width: 200
  },
  appDarkSidebar: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  compactSidebar: {
    borderBottomWidth: 1,
    borderRightWidth: 0,
    gap: 10,
    padding: 12,
    width: "100%"
  },
  hiddenMobileSidebar: {
    display: "none"
  },
  mobileMenuDrawer: {
    borderBottomWidth: 1,
    elevation: 18,
    paddingBottom: 12,
    position: "relative",
    zIndex: 90
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14
  },
  brandCopy: {
    flex: 1,
    minWidth: 0
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  appDarkBrandMark: {
    backgroundColor: "#8f6a35"
  },
  brandMarkText: {
    color: "white",
    fontWeight: "800"
  },
  brandTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 21
  },
  tabs: {
    flexDirection: Platform.OS === "web" ? "column" : "row",
    flexWrap: "wrap",
    gap: 8
  },
  compactTabs: {
    flexDirection: "row",
    gap: 6
  },
  tab: {
    alignItems: "center",
    borderRadius: 9,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12
  },
  appDarkTab: {
    borderColor: "rgba(233, 183, 106, 0.08)"
  },
  activeTab: {
    backgroundColor: colors.blush
  },
  appDarkActiveTab: {
    backgroundColor: "#343434",
    borderColor: "rgba(233, 183, 106, 0.28)"
  },
  tabLabel: {
    color: colors.muted,
    fontWeight: "700"
  },
  appDarkTabLabel: {
    color: "#c8bda9"
  },
  activeTabLabel: {
    color: colors.coral
  },
  appDarkActiveTabLabel: {
    color: "#e9b76a"
  },
  todayCard: {
    marginTop: 0
  },
  streakNumber: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: "800"
  },
  progressTrack: {
    backgroundColor: "#dce4dc",
    borderRadius: 999,
    height: 10,
    marginVertical: 14,
    overflow: "hidden"
  },
  appDarkProgressTrack: {
    backgroundColor: "#242424"
  },
  progressFill: {
    backgroundColor: colors.coral,
    height: "100%"
  },
  content: {
    flexGrow: 1,
    maxWidth: "100%",
    minWidth: 0,
    padding: 24
  },
  contentScroll: {
    flex: 1,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%"
  },
  appDarkContent: {
    backgroundColor: "#181818"
  },
  phoneContent: {
    padding: 14
  },
  phoneMemoryPracticeScrollContent: {
    paddingBottom: Platform.OS === "web" ? 32 : 220
  },
  contentWithMobileReaderDock: {
    paddingBottom: 172
  },
  contentWithMobileReaderNoteDock: {
    paddingBottom: 292
  },
  layout: {
    flexDirection: "row",
    gap: 18,
    maxWidth: "100%",
    minWidth: 0
  },
  homeLayout: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 18,
    maxWidth: "100%",
    minWidth: 0
  },
  homeDarkLayout: {
    backgroundColor: "#181818"
  },
  homeMainCard: {
    flex: 1,
    gap: 28,
    maxWidth: "100%",
    minWidth: 0
  },
  homeHero: {
    borderBottomColor: "rgba(102, 114, 78, 0.18)",
    borderBottomWidth: 0,
    gap: 14,
    paddingBottom: 8
  },
  homeDarkHero: {
    borderBottomColor: "rgba(233, 183, 106, 0.18)"
  },
  homeHeroTitle: {
    color: colors.ink,
    fontFamily: Platform.select({ ios: "Georgia", web: "Georgia", default: undefined }),
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 48
  },
  homeDarkHeroTitle: {
    color: "#f7eddc"
  },
  homeHeroTitleAccent: {
    color: colors.oliveDark,
    fontFamily: Platform.select({ ios: "Georgia", web: "Georgia", default: undefined }),
    fontStyle: "italic",
    fontWeight: "700"
  },
  homeDarkHeroTitleAccent: {
    color: "#e9b76a"
  },
  phoneHomeHeroTitle: {
    fontSize: 34,
    lineHeight: 40
  },
  homeHeroText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 27,
    maxWidth: 720
  },
  homeDarkHeroText: {
    color: "#f7eddc"
  },
  homePurposePanel: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.22)",
    borderRadius: 14,
    borderWidth: 0,
    gap: 10,
    padding: 14
  },
  homeDarkPurposePanel: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  homePurposeTitle: {
    color: colors.oliveDark,
    fontSize: 16,
    fontWeight: "700"
  },
  homePurposeText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21
  },
  homePurposePillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  homePurposePill: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  homeDarkPurposePill: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  homePurposePillText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  homeActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%"
  },
  homePhoneActionButton: {
    flex: 1,
    minWidth: 0
  },
  homeScriptureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    maxWidth: "100%",
    minWidth: 0
  },
  homeScriptureBlock: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 0,
    flex: 1,
    gap: 10,
    maxWidth: "100%",
    minWidth: 240,
    padding: 20
  },
  homeDarkScriptureBlock: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  homeScriptureIcon: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  homeDarkIconBubble: {
    backgroundColor: "#343434"
  },
  homeScriptureRef: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: "700"
  },
  homeDarkAccentText: {
    color: "#e9b76a"
  },
  homeScriptureQuote: {
    color: colors.ink,
    fontFamily: Platform.select({ ios: "Georgia", web: "Georgia", default: undefined }),
    fontSize: 20,
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: 31
  },
  homeScriptureNote: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21
  },
  homeSideColumn: {
    gap: 18,
    maxWidth: "100%",
    minWidth: 0,
    width: 360
  },
  homeSideCard: {
    gap: 12,
    maxWidth: "100%",
    minWidth: 0
  },
  homeContinueCard: {
    borderColor: "rgba(201, 103, 80, 0.28)",
    borderWidth: 1.5
  },
  homeSideTitle: {
    color: colors.oliveDark,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2
  },
  homePathList: {
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  homePathItem: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 0,
    flexDirection: "row",
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
    padding: 11
  },
  homeContinueItem: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.52)",
    borderWidth: 1.5
  },
  homeDarkContinueItem: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.38)",
    borderWidth: 1.5
  },
  homeDarkPathItem: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  homeDarkMetric: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)",
    borderWidth: 1
  },
  homeDarkMetricValue: {
    color: "#e9b76a"
  },
  homeDarkResumeButton: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.26)"
  },
  homeDarkResumeButtonText: {
    color: "#f7eddc"
  },
  homePathIcon: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  homePathTextBlock: {
    flex: 1,
    maxWidth: "100%",
    minWidth: 0
  },
  homePathTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  homePathDetail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
    marginTop: 2
  },
  homeMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  homeWeeklyRhythmPanel: {
    backgroundColor: colors.panel,
    borderColor: "rgba(53, 74, 45, 0.16)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    padding: 11
  },
  homeDarkWeeklyRhythmPanel: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  homeWeeklyRhythmHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7
  },
  homeWeeklyRhythmTitle: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  homeWeeklyRhythmText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  },
  homeSmallActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  bibleReaderLayout: {
    flexDirection: "row",
    gap: 18,
    maxWidth: "100%",
    minWidth: 0
  },
  bibleReaderNavCard: {
    gap: 12,
    width: 330
  },
  collapsedBibleReaderNavCard: {
    alignItems: "center",
    paddingHorizontal: 10,
    width: 68
  },
  compactCollapsedBibleReaderNavCard: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: "100%"
  },
  readerNavHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  compactCollapsedReaderNavHeader: {
    justifyContent: "center",
    width: "100%"
  },
  readerNavTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  collapsedReaderIconStack: {
    alignItems: "center",
    gap: 9
  },
  compactCollapsedReaderIconStack: {
    flexDirection: "row",
    justifyContent: "center"
  },
  collapsedReaderIconButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  inactiveCollapsedReaderIconButton: {
    opacity: 0.62
  },
  bibleReaderContentCard: {
    flex: 1,
    gap: 14,
    maxWidth: "100%",
    minWidth: 0
  },
  bibleSearchPanel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
    padding: 14
  },
  bibleSearchHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    maxWidth: "100%",
    minWidth: 0
  },
  bibleSearchHeaderMeta: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 8
  },
  bibleSearchTranslationText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  bibleSearchInputRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  bibleSearchInput: {
    flex: 1,
    marginBottom: 0,
    minWidth: 220
  },
  phoneBibleSearchInputRow: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8,
    width: "100%"
  },
  phoneBibleSearchInput: {
    fontSize: 16,
    minWidth: 0,
    width: "100%"
  },
  phoneBibleSearchButton: {
    flex: 1,
    minWidth: 0,
    width: "100%"
  },
  bibleSearchClearButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    maxWidth: "100%",
    minHeight: 42,
    paddingHorizontal: 13
  },
  bibleSearchClearText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  bibleSearchSummaryBlock: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.28)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  bibleSearchStatusText: {
    color: colors.coral,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19
  },
  bibleSearchDurationText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  mobileBibleCriteriaDropdown: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    width: "100%"
  },
  mobileBibleCriteriaHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  mobileBibleCriteriaCopy: {
    flex: 1,
    minWidth: 0
  },
  mobileBibleCriteriaTitle: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "900"
  },
  mobileBibleCriteriaSummary: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  mobileBibleCriteriaPanel: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: 12,
    padding: 12
  },
  mobileBibleCriteriaGroup: {
    gap: 7,
    maxWidth: "100%",
    minWidth: 0
  },
  mobileBibleCriteriaLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  mobileBibleCriteriaChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "100%",
    minWidth: 0
  },
  bibleSearchControls: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  phoneBibleSearchControls: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "100%",
    width: "100%"
  },
  bibleSearchRefineRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  phoneBibleSearchRefineRow: {
    alignItems: "flex-start",
    flexWrap: "wrap",
    maxWidth: "100%",
    width: "100%"
  },
  bibleSearchModeGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "100%",
    minWidth: 0
  },
  bibleSearchBookFilter: {
    maxWidth: "100%",
    minWidth: 150,
    width: 170
  },
  phoneBibleSearchBookFilter: {
    minWidth: 0,
    width: "100%"
  },
  bibleSearchExactChip: {
    flexShrink: 0
  },
  bibleSearchChip: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  phoneBibleSearchChip: {
    flexShrink: 1,
    height: 36,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 9,
    paddingVertical: 0
  },
  activeBibleSearchChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  bibleSearchChipText: {
    color: colors.oliveDark,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 0
  },
  bibleSearchSelect: {
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    minHeight: 34,
    paddingHorizontal: 11,
    width: "100%"
  },
  phoneBibleSearchSelect: {
    height: 36,
    minHeight: 36
  },
  bibleSearchSelectButton: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 34,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  phoneBibleSearchSelectButton: {
    height: 36,
    minHeight: 36,
    paddingVertical: 0
  },
  bibleSearchSelectText: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 0
  },
  bibleSearchSelectMenu: {
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 220,
    overflow: "hidden"
  },
  bibleSearchSelectOption: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  activeBibleSearchSelectOption: {
    backgroundColor: colors.oliveDark
  },
  bibleSearchSelectOptionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  activeBibleSearchChipText: {
    color: "white"
  },
  bibleSearchFootnote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  bibleSearchResultSection: {
    gap: 8,
    marginTop: 4
  },
  bibleSearchSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  bibleSearchSectionCount: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    color: "white",
    fontSize: 11,
    fontWeight: "900",
    minWidth: 24,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
    textAlign: "center"
  },
  bibleSearchResultCard: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 11
  },
  bibleSearchResultHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  bibleSearchResultReference: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  bibleSearchSourceQuery: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  bibleSearchResultText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20
  },
  bibleSearchResultActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  readerHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    maxWidth: "100%",
    minWidth: 0
  },
  readerTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  readerBookSections: {
    gap: 14
  },
  mobileReaderPicker: {
    gap: 12
  },
  mobileReaderDropdown: {
    gap: 8,
    minWidth: 0,
    width: "100%"
  },
  mobileReaderDropdownButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  mobileReaderDropdownText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    minWidth: 0
  },
  mobileReaderBookList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  mobileReaderBookBlock: {
    gap: 7
  },
  expandedMobileReaderBookBlock: {
    width: "100%"
  },
  mobileReaderBookOption: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  activeMobileReaderBookOption: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  mobileReaderBookText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  activeMobileReaderBookText: {
    color: "white"
  },
  mobileReaderChapterPanel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    maxWidth: "100%",
    padding: 10
  },
  mobileReaderChapterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  mobileReaderChapterSquare: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: 1,
    justifyContent: "center",
    width: 38
  },
  readMobileReaderChapterSquare: {
    backgroundColor: "#edf2dc",
    borderColor: "rgba(102, 114, 78, 0.38)"
  },
  darkReadMobileReaderChapterSquare: {
    backgroundColor: "rgba(233, 183, 106, 0.14)",
    borderColor: "rgba(233, 183, 106, 0.38)"
  },
  activeMobileReaderChapterSquare: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  mobileReaderChapterText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  readMobileReaderChapterText: {
    color: colors.oliveDark
  },
  darkReadMobileReaderChapterText: {
    color: "#e9b76a"
  },
  activeMobileReaderChapterText: {
    color: "white"
  },
  readerChapterPanelHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  readerChapterReadCountText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  memoryBookFilterOption: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7
  },
  memoryBookCountText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 12
  },
  memoryChapterAllSquare: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 10
  },
  memoryChapterCountText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 10
  },
  readerBookmarkSection: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    gap: 8,
    paddingBottom: 12
  },
  readerHistorySection: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    gap: 8,
    paddingBottom: 12
  },
  readerHistoryHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  readerHistoryActions: {
    alignItems: "flex-end"
  },
  readerHistoryClearButton: {
    paddingHorizontal: 4,
    paddingVertical: 3
  },
  readerHistoryList: {
    gap: 6
  },
  bibleReadingPlanPanel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  compactBibleReadingPlanPanel: {
    gap: 7,
    paddingVertical: 9
  },
  bibleReadingPlanStack: {
    gap: 8,
    marginBottom: 14
  },
  bibleReadingPlanHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  bibleReadingPlanTitleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  bibleReadingPlanChooser: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  bibleReadingPlanStarter: {
    gap: 8,
    marginBottom: 14
  },
  phoneBibleReadingPlanChooser: {
    flexWrap: "wrap"
  },
  bibleReadingPlanChip: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
    maxWidth: 180,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  bibleReadingPlanChipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  bibleReadingPlanToday: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 9
  },
  clickableBibleReadingPlanToday: {
    borderColor: "rgba(185, 91, 72, 0.34)"
  },
  bibleReadingPlanOpenHint: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  bibleReadingPlanStatusText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  bibleReadingPlanMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  bibleReadingPlanMetaChip: {
    backgroundColor: colors.panel,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  bibleReadingPlanDoneRow: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.24)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    padding: 9
  },
  bibleReadingPlanDoneIcon: {
    alignItems: "center",
    backgroundColor: "#edf3e4",
    borderColor: "rgba(102, 114, 78, 0.28)",
    borderRadius: 999,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    width: 26
  },
  bibleReadingPlanDoneTextBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  bibleReadingPlanTodayHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  bibleReadingPlanTodayTitleBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  bibleReadingPlanActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  phoneBibleReadingPlanActions: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  planCustomForm: {
    gap: 9
  },
  planCustomDaysInput: {
    minHeight: 110,
    textAlignVertical: "top"
  },
  readerQuickListToggle: {
    alignItems: "center",
    backgroundColor: "#f8efe4",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    padding: 4
  },
  readerQuickListToggleButton: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 30,
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  readerQuickListToggleText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  readerQuickListToggleCount: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900"
  },
  readerHistoryChip: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 9
  },
  readerHistoryText: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    minWidth: 0
  },
  readerHistoryTranslation: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900"
  },
  readerReadChapterList: {
    gap: 8
  },
  readerReadChapterSwipeWrap: {
    overflow: "hidden",
    position: "relative"
  },
  readerReadChapterSwipeClear: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: 10,
    bottom: 0,
    gap: 2,
    justifyContent: "center",
    paddingHorizontal: 8,
    position: "absolute",
    right: 0,
    top: 0,
    width: 70
  },
  readerReadChapterSwipeClearText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900"
  },
  readerReadChapterBook: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  readerReadChapterBookRevealed: {
    transform: [{ translateX: -76 }]
  },
  readerReadChapterBookHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  readerReadChapterBookMeta: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 8
  },
  readerReadChapterBookTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    minWidth: 0
  },
  readerReadChapterClearButton: {
    paddingHorizontal: 4,
    paddingVertical: 3
  },
  readerReadChapterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  readerReadChapterChip: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 28,
    minWidth: 34,
    paddingHorizontal: 8
  },
  readerReadChapterChipText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900"
  },
  readerBookmarkHeader: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  readerBookmarkHeaderTitle: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 6,
    minWidth: 0
  },
  readerBookmarkHeaderMeta: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 6
  },
  readerBookmarkCount: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  readerBookmarkSearchInput: {
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  readerBookmarkFilterChip: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  readerBookmarkFilterText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  readerBookmarkExpandButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 4
  },
  readerBookmarkExpandText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  readerBookmarkItem: {
    gap: 6
  },
  readerBookmarkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  readerBookmarkOpen: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    minWidth: 0,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  readerBookmarkText: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: "800"
  },
  readerBookmarkIconButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 31,
    justifyContent: "center",
    width: 31
  },
  activeBookmarkNoteButton: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  readerBookmarkRemove: {
    padding: 6
  },
  readerBookmarkNoteEditor: {
    gap: 8
  },
  readerBookmarkNoteInput: {
    minHeight: 70,
    textAlignVertical: "top"
  },
  mobileReaderBookmarkNoteInput: {
    fontSize: 16,
    lineHeight: 22
  },
  readerBookmarkNoteActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  readerBookSection: {
    gap: 8
  },
  readerBookSectionTitle: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  readerBookGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  desktopReaderBookList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  desktopReaderBookBlock: {
    gap: 7
  },
  expandedDesktopReaderBookBlock: {
    width: "100%"
  },
  readerBookChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  activeReaderBookChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  readerBookText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  activeReaderBookText: {
    color: "white"
  },
  desktopReaderChapterPanel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    maxWidth: "100%",
    padding: 10
  },
  desktopReaderChapterHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  desktopReaderChapterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  readerNavigationRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 7,
    justifyContent: "space-between",
    maxWidth: "100%",
    minWidth: 0
  },
  phoneReaderNavigationRow: {
    gap: 4,
    maxWidth: "100%",
    width: "100%"
  },
  readerNavIconButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  phoneReaderNavIconButton: {
    height: 34,
    width: 34
  },
  readerIconTooltip: {
    alignSelf: "flex-start",
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    color: "white",
    fontSize: 12,
    fontWeight: "800",
    marginTop: -6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  readerChapterControl: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    maxWidth: "100%",
    minWidth: 132,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  phoneReaderChapterControl: {
    flex: 1,
    gap: 4,
    maxWidth: 132,
    minWidth: 0,
    paddingHorizontal: 6
  },
  readerChapterLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  phoneReaderChapterLabel: {
    flexShrink: 0,
    fontSize: 11
  },
  readerChapterInput: {
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 9,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    minWidth: 40,
    paddingHorizontal: 6,
    paddingVertical: 4,
    textAlign: "center"
  },
  phoneReaderChapterInput: {
    fontSize: 14,
    height: 28,
    minWidth: 0,
    paddingHorizontal: 4,
    width: 42
  },
  readerChapterCountText: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 0
  },
  phoneReaderChapterCountText: {
    flexShrink: 1,
    fontSize: 11
  },
  readerReadButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  activeReaderReadButton: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  activeReaderBookmarkButton: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  readerReadButtonText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  activeReaderReadButtonText: {
    color: "white"
  },
  readerProgressRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    marginTop: -6
  },
  readerProgressText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  readerProgressClearButton: {
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  readerProgressClearText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900"
  },
  mobileReaderSelectionDock: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.22)",
    borderRadius: 14,
    borderWidth: 1,
    bottom: 12,
    gap: 8,
    left: 12,
    padding: 9,
    position: "absolute",
    right: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    zIndex: 200
  },
  mobileReaderSelectionText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  mobileReaderSelectionActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  mobileReaderSelectionButton: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    flexBasis: "24%",
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 0,
    paddingHorizontal: 7
  },
  primaryMobileReaderSelectionButton: {
    backgroundColor: colors.olive,
    borderColor: colors.olive
  },
  mobileReaderMemoryButton: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  savedMemoryButton: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  mobileReaderSelectionButtonText: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  primaryMobileReaderSelectionButtonText: {
    color: "white"
  },
  mobileReaderSelectionIconButton: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    marginLeft: "auto",
    width: 34
  },
  mobileReaderNoteEditor: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 9
  },
  readerPassageBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
    padding: 14
  },
  phoneReaderPassageBox: {
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  phoneReaderPassageWithSelectionDock: {
    paddingBottom: 146
  },
  readerBottomNav: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    maxWidth: "100%",
    minWidth: 0,
    marginTop: 4,
    paddingTop: 12
  },
  readerPlanCompletionBox: {
    alignItems: "stretch",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "column",
    gap: 12,
    padding: 10
  },
  phoneReaderPlanCompletionBox: {
    gap: 8
  },
  readerPlanCompletionCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  readerPlanDevotionalBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    gap: 7,
    marginTop: 8,
    padding: 10
  },
  readerPlanCompletionActions: {
    alignSelf: "stretch",
    justifyContent: "flex-end"
  },
  phoneReaderPlanCompletionActions: {
    alignItems: "stretch",
    alignSelf: "stretch",
    flexDirection: "row",
    flexWrap: "nowrap",
    width: "100%"
  },
  phoneReaderPlanCompletionExitButton: {
    flex: 1,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 0,
    paddingHorizontal: 8
  },
  phoneReaderPlanCompletionPrimaryButton: {
    flex: 1,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 0,
    paddingHorizontal: 8
  },
  phoneReaderPlanCompletionButtonText: {
    flexShrink: 1,
    textAlign: "center"
  },
  readerPlanCompleteButton: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark,
    flexShrink: 0
  },
  readerPlanCompletedStatus: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 5,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 4
  },
  readerPlanCompletedStatusDark: {
    backgroundColor: "transparent"
  },
  readerPlanCompletedStatusText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  readerPlanCompletedStatusTextDark: {
    color: "#dcebc8"
  },
  readerBottomNavButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 1,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  readerBottomReadButton: {
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.24)"
  },
  readerBottomNavText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  readerVerseRow: {
    alignItems: "flex-start",
    borderColor: "transparent",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  phoneReaderVerseRow: {
    gap: 5,
    paddingHorizontal: 2,
    paddingVertical: 4
  },
  readerVerseIconRow: {
    alignItems: "center",
    flexDirection: "column",
    gap: 4,
    paddingTop: 3,
    width: 17
  },
  phoneReaderVerseIconRow: {
    width: 16
  },
  selectedReaderVerseRow: {
    backgroundColor: "#f4dfb6"
  },
  phoneSelectedReaderVerseRow: {
    borderColor: colors.coral,
    borderLeftWidth: 4,
    paddingLeft: 7
  },
  inlineReaderActionBar: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#fbf2e4",
    borderColor: "#ead8bc",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 6,
    marginLeft: 32,
    marginTop: 2,
    maxWidth: "100%",
    minWidth: 0,
    padding: 10
  },
  inlineStudyMarkupBar: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 7,
    marginLeft: 28,
    padding: 8
  },
  phoneInlineStudyMarkupBar: {
    marginLeft: 20,
    padding: 8
  },
  selectedMarkupHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    minWidth: 0
  },
  selectedMarkupCloseButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  inlineReaderActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  inlineReaderStudyButton: {
    backgroundColor: colors.olive,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  inlineReaderStudyText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900"
  },
  inlineReaderBookmarkButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  compactInlineActionButton: {
    minHeight: 32,
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  inlineReaderBookmarkText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryReaderButton: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  memoryReaderButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900"
  },
  readerSelectionBar: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    minWidth: 0,
    padding: 10
  },
  readerSelectionText: {
    color: colors.oliveDark,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  readerPlanModeBar: {
    alignItems: "center",
    flexWrap: "nowrap",
    justifyContent: "flex-start"
  },
  readerPlanModeCopy: {
    flex: 1,
    minWidth: 0
  },
  readerPlanModeName: {
    color: colors.coral,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20
  },
  readerDarkPlanModeName: {
    color: "#e17d67"
  },
  readerVerseNumber: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 22,
    minWidth: 24,
    textAlign: "right"
  },
  phoneReaderVerseNumber: {
    minWidth: 18
  },
  readerVerseText: {
    color: colors.ink,
    flex: 1,
    fontSize: 17,
    lineHeight: 27,
    minWidth: 0
  },
  phoneReaderVerseText: {
    fontSize: 16,
    lineHeight: 25
  },
  stackedLayout: {
    flexDirection: "column"
  },
  mainCard: {
    flex: 1,
    minWidth: 0
  },
  focusLayout: {
    gap: 0
  },
  coachCard: {
    gap: 14,
    width: 250
  },
  memoryCoachCard: {
    gap: 14,
    width: 430
  },
  fluidCard: {
    minWidth: 0,
    width: "100%"
  },
  coachTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  studyGuidedHeader: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
    padding: 14,
    position: "relative"
  },
  phoneStudyGuidedHeader: {
    paddingRight: 14,
    position: "relative"
  },
  studyGuidedTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    width: "100%"
  },
  phoneStudyGuidedTopRow: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingRight: 0
  },
  studyGuidedDescriptionRow: {
    width: "100%"
  },
  phoneStudyGuidedDescriptionRow: {
    paddingRight: 0
  },
  studyDraftHint: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 6,
    width: "100%"
  },
  studyDraftHintText: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    minWidth: 0
  },
  studyGuidedTitleBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 0
  },
  phoneStudyGuidedTitleBlock: {
    flexBasis: "100%",
    flex: 0,
    width: "100%"
  },
  phoneStudyGuidedTitle: {
    fontSize: 20,
    lineHeight: 25
  },
  studyHeaderControls: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexShrink: 1,
    gap: 8,
    justifyContent: "flex-end",
    maxWidth: 430,
    minWidth: 0
  },
  phoneStudyHeaderControls: {
    alignItems: "flex-start",
    flex: 1,
    flexDirection: "row",
    maxWidth: "100%",
    minWidth: 0,
    width: "auto"
  },
  studyFocusHeaderToggle: {
    flexShrink: 0
  },
  phoneStudyFocusHeaderToggle: {
    alignSelf: "flex-start",
    position: "relative"
  },
  focusPassageSelector: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    maxWidth: 520,
    paddingHorizontal: 10
  },
  focusPassageInput: {
    color: colors.ink,
    flex: 1,
    minHeight: 42,
    minWidth: 0
  },
  compactMethodPicker: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    maxWidth: "100%",
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: 12
  },
  compactMethodLabel: {
    color: colors.oliveDark,
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  compactMethodChips: {
    flexDirection: "row",
    flexShrink: 1,
    flexWrap: "wrap",
    gap: 5,
    justifyContent: "flex-end",
    minWidth: 0
  },
  compactMethodCurrent: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "900"
  },
  compactMethodMenu: {
    alignSelf: "flex-end",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "flex-end",
    marginBottom: 12,
    marginTop: -6,
    maxWidth: 430,
    padding: 8
  },
  compactMethodChip: {
    backgroundColor: colors.panel,
    borderRadius: 10,
    minWidth: 170,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  activeCompactMethodChip: {
    backgroundColor: colors.oliveDark
  },
  compactMethodText: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  compactMethodDuration: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2
  },
  activeCompactMethodText: {
    color: "white"
  },
  methodDurationText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8
  },
  studyProgressStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8
  },
  phoneStudyProgressStrip: {
    flexWrap: "nowrap",
    gap: 6,
    paddingRight: 8
  },
  phoneStudyProgressScroll: {
    marginBottom: 8,
    maxWidth: "100%"
  },
  phoneStudyProgressPill: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 34,
    minWidth: 0,
    paddingHorizontal: 9
  },
  studyProgressPill: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    flexGrow: 1,
    flexShrink: 1,
    gap: 7,
    minHeight: 36,
    minWidth: 120,
    paddingHorizontal: 10
  },
  completedStudyProgressPill: {
    backgroundColor: colors.sage
  },
  skippedStudyProgressPill: {
    backgroundColor: colors.panel,
    borderColor: colors.line
  },
  activeStudyProgressPill: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  studyProgressNumber: {
    backgroundColor: "white",
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900",
    height: 22,
    lineHeight: 22,
    overflow: "hidden",
    textAlign: "center",
    width: 22
  },
  completedStudyProgressNumber: {
    backgroundColor: "#fffaf2"
  },
  activeStudyProgressNumber: {
    color: colors.oliveDark
  },
  studyProgressText: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    minWidth: 0
  },
  completedStudyProgressText: {
    color: colors.oliveDark
  },
  skippedStudyProgressText: {
    color: colors.coral,
    fontStyle: "italic"
  },
  activeStudyProgressText: {
    color: "white"
  },
  studyIntro: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    marginBottom: 18
  },
  studyIntroCopy: {
    flex: 1,
    minWidth: 0
  },
  methodPill: {
    alignItems: "center",
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    minWidth: 52,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  methodPillText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800"
  },
  title: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: "800",
    lineHeight: 28,
    marginBottom: 3
  },
  methodFullName: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 5
  },
  inlineMethodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14
  },
  inlineMethodChip: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  activeInlineMethodChip: {
    backgroundColor: colors.oliveDark
  },
  inlineMethodText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "700"
  },
  activeInlineMethodText: {
    color: "white"
  },
  coachingToggleRow: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.18)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  togglePill: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  activeTogglePill: {
    backgroundColor: colors.oliveDark
  },
  toggleText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  activeToggleText: {
    color: "white"
  },
  titleSupport: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  input: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 11,
    borderWidth: 1,
    color: colors.ink,
    marginBottom: 14,
    maxWidth: "100%",
    minHeight: 48,
    paddingHorizontal: 14
  },
  accountAuthInput: {
    fontSize: 16,
    lineHeight: 22
  },
  smartPassageBox: {
    backgroundColor: colors.panel,
    borderColor: colors.coral,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 14,
    maxWidth: "100%",
    minWidth: 0,
    padding: 12
  },
  smartPassageHeader: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    minWidth: 0,
    paddingHorizontal: 12
  },
  smartPassageInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    minHeight: 44,
    minWidth: 0,
    outlineStyle: "none" as any
  },
  useInlineButton: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    flexShrink: 0,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  useInlineText: {
    color: "white",
    fontWeight: "800"
  },
  textarea: {
    minHeight: 150,
    paddingTop: 14,
    textAlignVertical: "top"
  },
  noteFormatToolbar: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    marginTop: -6,
    padding: 8
  },
  compactNoteFormatToolbar: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 0,
    marginTop: 0,
    padding: 4
  },
  expandedCompactNoteFormatToolbar: {
    gap: 7,
    padding: 7
  },
  mobileToolbarToggle: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 9,
    flexDirection: "row",
    gap: 7,
    minHeight: 36,
    paddingHorizontal: 10
  },
  mobileToolbarToggleText: {
    color: colors.oliveDark,
    flex: 1,
    fontSize: 12,
    fontWeight: "800"
  },
  mobileNoteFormatBar: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginBottom: 12,
    marginTop: -4,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    width: "100%",
    zIndex: 80
  },
  floatingMobileNoteFormatBar: {
    marginBottom: 0,
    marginTop: 0,
    maxWidth: 292,
    position: "absolute",
    width: 292
  },
  mobileNoteFormatButton: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: "rgba(102, 114, 78, 0.24)",
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  mobileHighlightSwatch: {
    borderColor: "rgba(36, 29, 25, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    width: 18
  },
  noteFormatButtonRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 7,
    width: "100%"
  },
  noteFormatMainButtons: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    flexWrap: "wrap",
    gap: 7,
    minWidth: 0
  },
  noteFormatButton: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: "rgba(102, 114, 78, 0.24)",
    borderRadius: 9,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  compactNoteFormatButton: {
    height: 36,
    width: 36
  },
  noteSettingsButton: {
    marginLeft: "auto"
  },
  activeNoteFormatButton: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  noteFormatText: {
    color: colors.oliveDark,
    fontSize: 15,
    fontWeight: "900"
  },
  activeNoteFormatText: {
    color: "white"
  },
  noteFormatTooltip: {
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    color: "white",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  noteFormatBold: {
    fontWeight: "900"
  },
  noteFormatItalic: {
    fontStyle: "italic"
  },
  noteFormatUnderline: {
    textDecorationLine: "underline"
  },
  noteFormatHighlight: {
    backgroundColor: "#f4dfb6",
    borderRadius: 5,
    overflow: "hidden",
    paddingHorizontal: 3
  },
  studyDarkNoteFormatHighlight: {
    backgroundColor: "#e9b76a",
    color: "#171b1c"
  },
  activeNoteHighlightFormatText: {
    backgroundColor: "transparent",
    color: "white"
  },
  noteFormatHelp: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    minWidth: 180
  },
  compactNoteFormatHelp: {
    alignSelf: "stretch",
    flex: 0,
    minWidth: 0,
    width: "100%"
  },
  writingPromptBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.16)",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: -4,
    padding: 10
  },
  compactWritingPromptBox: {
    marginBottom: 8,
    marginTop: -2,
    padding: 7
  },
  writingPromptHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8
  },
  compactWritingPromptHeader: {
    marginBottom: 5
  },
  writingPromptTitleButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minHeight: 26
  },
  compactWritingPromptTitleButton: {
    flex: 1,
    justifyContent: "space-between",
    minWidth: 0
  },
  writingPromptLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  customizePromptButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3
  },
  compactCustomizePromptButton: {
    paddingHorizontal: 3,
    paddingVertical: 2
  },
  customizePromptText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "800"
  },
  writingPromptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  compactWritingPromptRow: {
    gap: 5
  },
  writingPromptChip: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    flexDirection: "row",
    overflow: "hidden"
  },
  compactWritingPromptChip: {
    borderRadius: 10,
    flexBasis: "100%",
    flexShrink: 1,
    maxWidth: "100%"
  },
  writingPromptInsert: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 7
  },
  compactWritingPromptInsert: {
    gap: 0,
    justifyContent: "flex-start",
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 6,
    width: "100%"
  },
  writingPromptText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  compactWritingPromptText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15
  },
  removePromptButton: {
    borderColor: "rgba(102, 114, 78, 0.18)",
    borderLeftWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  compactRemovePromptButton: {
    paddingHorizontal: 6,
    paddingVertical: 6
  },
  customPromptEditor: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  customPromptInput: {
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 10
  },
  addPromptButton: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  addPromptText: {
    color: "white",
    fontWeight: "800"
  },
  writingPromptStatus: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8
  },
  responseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: -6
  },
  responseWorkspace: {
    gap: 12
  },
  responseEditorColumn: {
    flex: 1,
    minWidth: 0
  },
  saveStatus: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  studySaveStatusRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    marginTop: 10
  },
  studySaveRetryButton: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 34,
    paddingHorizontal: 12,
    justifyContent: "center"
  },
  studySaveRetryText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  warningText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  coachingBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.2)",
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
    padding: 12
  },
  coachingHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minWidth: 0
  },
  coachingToggleBadge: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    color: colors.muted,
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  activeCoachingToggleBadge: {
    backgroundColor: colors.oliveDark
  },
  activeCoachingToggleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900"
  },
  collapsedCoachingBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.16)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    marginBottom: 14,
    padding: 10
  },
  collapsedCoachingText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  coachingItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  coachingText: {
    color: colors.oliveDark,
    flex: 1,
    fontSize: 14,
    lineHeight: 20
  },
  aiOptionCard: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.18)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
    padding: 11
  },
  aiOptionCopy: {
    flex: 1,
    minWidth: 0
  },
  aiOptionTitle: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3
  },
  aiOptionText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  feedbackHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    minWidth: 0
  },
  collapsiblePanelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  collapsiblePanelTitle: {
    flex: 1,
    marginBottom: 0,
    minWidth: 0
  },
  feedbackTitle: {
    color: colors.coral,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  studyPlansBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  planSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  planChip: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  activePlanChip: {
    backgroundColor: colors.oliveDark
  },
  planChipText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  activePlanChipText: {
    color: "white"
  },
  planDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  planProgressText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  currentPlanBox: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    gap: 5,
    padding: 11
  },
  currentPlanTitle: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "800"
  },
  currentPlanHeaderSpacer: {
    minHeight: 18
  },
  currentPlanText: {
    color: colors.oliveDark,
    fontSize: 13,
    lineHeight: 18
  },
  planActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  currentPlanBottomActions: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
    marginTop: 2,
    width: "50%"
  },
  currentPlanActionButton: {
    flex: 1,
    minWidth: 0
  },
  currentPlanManagementRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end"
  },
  phoneCurrentPlanManagementRow: {
    justifyContent: "flex-start"
  },
  currentPlanManagementButton: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  currentPlanManagementButtonDark: {
    backgroundColor: "#181510",
    borderColor: "#4f4636"
  },
  currentPlanManagementText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  phonePlanActionRow: {
    flexWrap: "nowrap",
    gap: 6,
    width: "100%"
  },
  phonePlanPrimaryButton: {
    flex: 1.35,
    minHeight: 42,
    paddingHorizontal: 8
  },
  phonePlanSecondaryButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 8
  },
  phonePlanActionButton: {
    flex: 1,
    minHeight: 42,
    minWidth: 0,
    paddingHorizontal: 8
  },
  phonePlanResumeButton: {
    flex: 1,
    justifyContent: "center",
    marginTop: 0,
    minHeight: 38,
    minWidth: 0,
    paddingHorizontal: 8
  },
  phonePlanButtonLabel: {
    fontSize: 12,
    textAlign: "center"
  },
  planDayRow: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderRadius: 12,
    flexDirection: "row",
    gap: 9,
    padding: 10
  },
  completedPlanDayRow: {
    backgroundColor: "#fff",
    borderColor: colors.sage,
    borderWidth: 1
  },
  planDayBadge: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    color: "white",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  completedPlanDayBadge: {
    backgroundColor: colors.oliveDark
  },
  planDayCopy: {
    flex: 1,
    minWidth: 0
  },
  planDayTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  planDayPassage: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  phonePlanDayTitle: {
    fontSize: 12
  },
  phonePlanDayPassage: {
    fontSize: 11,
    lineHeight: 16
  },
  feedbackOptionsBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  selectedAiOption: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start"
  },
  activeAiOptionCard: {
    borderColor: colors.oliveDark,
    borderWidth: 2
  },
  aiDetailsBox: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    gap: 5,
    padding: 11
  },
  aiDetailsTitle: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "800"
  },
  aiDetailsText: {
    color: colors.oliveDark,
    fontSize: 13,
    lineHeight: 19
  },
  studyHelpsBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  communityBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  avatarRow: {
    flexDirection: "row",
    marginBottom: 2
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderColor: colors.panel,
    borderRadius: 999,
    borderWidth: 2,
    height: 38,
    justifyContent: "center",
    marginRight: -8,
    width: 38
  },
  avatarLead: {
    backgroundColor: colors.coral
  },
  avatarText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  communityTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
    lineHeight: 21
  },
  communityFocusBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    marginBottom: 14,
    padding: 14
  },
  communityStepBlock: {
    gap: 6,
    marginBottom: 18
  },
  communitySubViewTabs: {
    alignSelf: "flex-start",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    marginBottom: 18,
    marginTop: 12,
    padding: 4
  },
  communitySubViewTab: {
    borderRadius: 999,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 13
  },
  activeCommunitySubViewTab: {
    backgroundColor: colors.oliveDark
  },
  communitySubViewTabText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "900"
  },
  activeCommunitySubViewTabText: {
    color: "white"
  },
  communityHistoryPanel: {
    gap: 12
  },
  communityHistoryFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  communityHistoryGroupList: {
    gap: 12
  },
  communityHistoryGroup: {
    backgroundColor: "rgba(255, 250, 242, 0.7)",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 9,
    padding: 10
  },
  communityStepHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 9,
    marginBottom: 8
  },
  communityStepBadge: {
    alignItems: "center",
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    marginTop: 1,
    width: 24
  },
  communityStepBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 14
  },
  phoneCommunityFocusBox: {
    borderRadius: 12,
    marginBottom: 10,
    padding: 11
  },
  phoneCommunityStepBlock: {
    gap: 6,
    marginBottom: 16
  },
  communityRecipientText: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26
  },
  communityTargetSelect: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.22)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  communityTargetSelectTextBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  communityTargetPickerPanel: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.16)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 10
  },
  communityTargetPickerGroup: {
    gap: 7
  },
  communityTargetOption: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10
  },
  activeCommunityTargetOption: {
    backgroundColor: "#f5eedf",
    borderColor: "rgba(102, 114, 78, 0.42)"
  },
  communityTargetOptionTitle: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "900"
  },
  communityTargetModeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  communityTargetModeChip: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 10
  },
  activeCommunityTargetModeChip: {
    backgroundColor: "#f5eedf",
    borderColor: "rgba(102, 114, 78, 0.42)"
  },
  communityTargetModeText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  phoneCommunityMetricGrid: {
    flexWrap: "nowrap",
    gap: 6,
    marginBottom: 12
  },
  lastCheckinBox: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 11
  },
  emptyCommunityBox: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    gap: 5,
    padding: 12
  },
  checkinHistoryItem: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 11
  },
  phoneCheckinHistoryItem: {
    borderRadius: 11,
    padding: 10
  },
  focusedCheckinHistoryItem: {
    borderColor: "rgba(102, 114, 78, 0.34)"
  },
  checkinHistoryHeader: {
    alignItems: "flex-start",
    gap: 8
  },
  checkinHistoryMeta: {
    gap: 4,
    minWidth: 0,
    width: "100%"
  },
  checkinTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  checkinDestinationText: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  communityPostFooterRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    width: "100%"
  },
  phoneCommunityPostFooterRow: {
    alignItems: "flex-start",
    flexWrap: "wrap"
  },
  checkinActionRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "flex-end"
  },
  phoneCheckinActionRow: {
    flexWrap: "nowrap"
  },
  checkinIconButton: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  checkinSaveIconButton: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  checkinDeleteIconButton: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.28)"
  },
  checkinEditInput: {
    minHeight: 84,
    textAlignVertical: "top"
  },
  checkinMood: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  communityPanelHeader: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 42,
    paddingHorizontal: 11,
    paddingVertical: 9
  },
  communityHeaderMeta: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 6,
    minWidth: 0
  },
  communityHeaderMetaText: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800"
  },
  partnerManagerBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
    padding: 14
  },
  phonePartnerManagerBox: {
    borderRadius: 12,
    gap: 6,
    marginBottom: 10,
    padding: 11
  },
  communityGoalBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
    padding: 12
  },
  communityConnectionGrid: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
    marginTop: 18
  },
  phoneCommunityConnectionGrid: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8,
    marginBottom: 22,
    width: "100%"
  },
  communityConnectionPanel: {
    flex: 1,
    minWidth: 280
  },
  phoneCommunityConnectionPanel: {
    alignSelf: "stretch",
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 1,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%"
  },
  mobileCommunityPanelHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
    minHeight: 42
  },
  mobileCommunityPanelTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 8
  },
  mobileCommunityPanelSummaryRow: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 6,
    justifyContent: "flex-end",
    minWidth: 0
  },
  mobileCommunityPanelSummary: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 15,
    textAlign: "right"
  },
  communityCircleBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
    padding: 12
  },
  circleManagementBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 2,
    padding: 10
  },
  phoneCircleManagementBox: {
    padding: 8
  },
  circleSelectorPanel: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  circleSelectorHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  circleCountText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  circleManagementContent: {
    gap: 9
  },
  circleManagementLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  circleActionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  phoneCircleActionGrid: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8,
    maxWidth: "100%",
    width: "100%"
  },
  circleActionBox: {
    flex: 1,
    gap: 8,
    minWidth: 170
  },
  phoneCircleActionBox: {
    alignSelf: "stretch",
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 1,
    maxWidth: "100%",
    minWidth: 0
  },
  phoneCommunityInput: {
    marginBottom: 8,
    width: "100%"
  },
  circleManagerToggle: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  circleList: {
    gap: 8
  },
  circleChip: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.16)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    padding: 10
  },
  circleChipHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  activeCircleChip: {
    backgroundColor: "#f5eedf",
    borderColor: "rgba(102, 114, 78, 0.42)"
  },
  circleChipTitle: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "900"
  },
  circleChipMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  activeCircleChipText: {
    color: colors.oliveDark
  },
  circleInlineManagement: {
    borderTopColor: "rgba(102, 114, 78, 0.14)",
    borderTopWidth: 1,
    gap: 8,
    marginTop: 8,
    paddingTop: 9
  },
  circleInviteLine: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  phoneCircleInviteLine: {
    alignItems: "flex-start",
    justifyContent: "flex-start"
  },
  circleInviteCodeText: {
    color: colors.oliveDark,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
    minWidth: 0
  },
  circleCopyButton: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    flexDirection: "row",
    flexShrink: 0,
    gap: 4,
    minHeight: 30,
    paddingHorizontal: 8
  },
  circleCopyText: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  circleManagementRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8
  },
  circleManageButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  activeCircleManageButton: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  circleDangerManageButton: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.28)"
  },
  activeCircleDangerManageButton: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  circleManageText: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  activeCircleManageText: {
    color: "white"
  },
  circleDangerManageText: {
    color: colors.coral
  },
  activeCircleDangerManageText: {
    color: "white"
  },
  circlePostCard: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 11
  },
  circleReactionRow: {
    flexShrink: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  circlePostIconRow: {
    flexDirection: "row",
    flexShrink: 0,
    gap: 7
  },
  pendingDeleteButton: {
    backgroundColor: colors.blush,
    borderColor: "rgba(201, 103, 80, 0.32)"
  },
  circleReactionChip: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 32,
    minWidth: 46,
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  activeCircleReactionChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  circleReactionText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  circleReactionSymbol: {
    fontSize: 15,
    lineHeight: 18
  },
  activeCircleReactionText: {
    color: "white"
  },
  communityDivider: {
    backgroundColor: colors.line,
    height: 1,
    marginVertical: 4
  },
  communityShowMoreButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 6
  },
  communityShowMoreText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  partnerList: {
    gap: 8
  },
  partnerChip: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.16)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    padding: 10
  },
  phonePartnerChip: {
    borderRadius: 11,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  activePartnerChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  partnerChipText: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "800"
  },
  activePartnerChipText: {
    color: "white"
  },
  partnerContactText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  accountabilitySummaryBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14
  },
  phoneAccountabilitySummaryBox: {
    borderRadius: 12,
    marginBottom: 10,
    padding: 11
  },
  sendNoteBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12
  },
  phoneSendNoteBox: {
    borderRadius: 11,
    padding: 10
  },
  lastCheckinLabel: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
    textTransform: "uppercase"
  },
  lastCheckinText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20
  },
  shareMessageText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8
  },
  phoneShareMessageText: {
    fontSize: 13,
    lineHeight: 19
  },
  phoneCheckinTextarea: {
    minHeight: 112
  },
  phoneFullWidthButton: {
    width: "100%",
    minHeight: 42
  },
  phoneCommunityButtonLabel: {
    fontSize: 12,
    textAlign: "center"
  },
  shareInsightBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.25)",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    padding: 14
  },
  shareInput: {
    marginBottom: 0,
    minHeight: 86,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  shareInsightCommunityBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    marginTop: 10,
    padding: 10
  },
  savedSummaryBox: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.22)",
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 18
  },
  savedSummaryIcon: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderRadius: 999,
    height: 54,
    justifyContent: "center",
    width: 54
  },
  savedSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    width: "100%"
  },
  phoneSavedSummaryGrid: {
    flexWrap: "nowrap",
    gap: 6
  },
  savedSummaryPanel: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 12,
    width: "100%"
  },
  savedReviewLaterHeaderCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  savedReviewLaterSummary: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  savedReviewLaterBody: {
    marginTop: 12
  },
  savedSummaryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  phoneSavedSummaryActions: {
    gap: 6
  },
  phoneSavedSummaryActionButton: {
    flex: 1,
    minHeight: 40,
    minWidth: 132,
    paddingHorizontal: 8
  },
  phoneSavedSummaryActionLabel: {
    fontSize: 12,
    textAlign: "center"
  },
  reviewPresetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8
  },
  phoneReviewPresetRow: {
    gap: 6
  },
  customReviewControl: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  customReviewLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  customReviewInput: {
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.ink,
    minHeight: 38,
    paddingHorizontal: 10,
    width: 70
  },
  customReviewUnit: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  helpIntro: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4
  },
  helpLink: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    padding: 10
  },
  helpIcon: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  helpTextBlock: {
    flex: 1
  },
  helpTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  helpDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  scriptureBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    maxWidth: "100%",
    minWidth: 0,
    padding: 16
  },
  phoneScriptureBox: {
    borderRadius: 11,
    padding: 11
  },
  passageStatusBox: {
    gap: 10
  },
  retryLink: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 5,
    minHeight: 32
  },
  retryLinkText: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: "700"
  },
  scriptureHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    minWidth: 0,
    marginBottom: 10
  },
  scriptureReference: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  scriptureText: {
    color: "#342821",
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 12
  },
  markupHelp: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginBottom: 10
  },
  verseList: {
    gap: 7,
    marginBottom: 12
  },
  verseRow: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 250, 242, 0.55)",
    borderColor: "transparent",
    borderRadius: 9,
    borderWidth: 2,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    position: "relative"
  },
  phoneVerseRow: {
    borderRadius: 8,
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  selectedVerseRow: {
    borderColor: colors.coral
  },
  verseText: {
    borderRadius: 5,
    color: "#342821",
    fontSize: 16,
    lineHeight: 24
  },
  verseTextBlock: {
    flex: 1,
    gap: 5,
    minWidth: 0
  },
  memoryVerseBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.28)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    marginLeft: 4,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  memoryVerseBadgeText: {
    color: colors.coral,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  verseStatusBadges: {
    alignItems: "flex-end",
    gap: 4
  },
  methodVerseBadge: {
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.28)"
  },
  methodVerseBadgeText: {
    color: colors.oliveDark,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  phoneVerseText: {
    fontSize: 15,
    lineHeight: 22
  },
  verseNumber: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 20,
    minWidth: 18,
    textAlign: "right"
  },
  phoneVerseNumber: {
    minWidth: 16
  },
  markupToolbar: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
    padding: 10
  },
  phoneMarkupToolbar: {
    borderRadius: 10,
    padding: 9
  },
  markupToolbarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  markupToolbarTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  markupToolbarHelp: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  markupCloseButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  markupOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  compactMarkupOptionsRow: {
    gap: 5
  },
  markupOption: {
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 2,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 11
  },
  compactMarkupOption: {
    minHeight: 30,
    paddingHorizontal: 9
  },
  markupLegendOption: {
    opacity: 0.9
  },
  activeMarkupOption: {
    borderColor: colors.ink
  },
  markupOptionText: {
    fontSize: 12,
    fontWeight: "800"
  },
  clearMarkupButton: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 999,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 11
  },
  clearAllMarkupButton: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.35)",
    borderWidth: 1
  },
  memoryMarkupButton: {
    backgroundColor: colors.oliveDark
  },
  memoryMarkupText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800"
  },
  clearMarkupText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  markupNoteBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10
  },
  markupNoteLabel: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 7,
    textTransform: "uppercase"
  },
  markupNoteInput: {
    marginBottom: 0,
    minHeight: 70,
    paddingTop: 10,
    textAlignVertical: "top"
  },
  translationBadge: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    color: "white",
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  translationControls: {
    backgroundColor: "#f8eadf",
    borderRadius: 999,
    flexDirection: "row",
    flexShrink: 1,
    maxWidth: "100%",
    padding: 3
  },
  translationRow: {
    alignSelf: "flex-start",
    backgroundColor: "#f8eadf",
    borderRadius: 999,
    flexDirection: "row",
    flexShrink: 1,
    maxWidth: "100%",
    padding: 3
  },
  translationOption: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  activeTranslationOption: {
    backgroundColor: colors.gold
  },
  translationOptionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  activeTranslationOptionText: {
    color: colors.ink
  },
  translationNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  studyPrintRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  studyContextTools: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
    padding: 11
  },
  studyContextToolHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  },
  studyContextToolTitleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 190
  },
  studyContextToolTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  studyContextToolIntro: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  studyContextToggle: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.soft,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    minHeight: 44,
    paddingHorizontal: 11
  },
  studyContextToggleText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  studyContextPreviewBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.18)",
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  studyContextPreviewLabel: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  studyContextVerseList: {
    gap: 5
  },
  studyContextVerseRow: {
    alignItems: "flex-start",
    borderRadius: 8,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  studyContextSelectedVerseRow: {
    backgroundColor: "#fff0df"
  },
  studyContextVerseNumber: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 19,
    minWidth: 18,
    textAlign: "right"
  },
  studyContextSelectedVerseNumber: {
    color: colors.coral
  },
  studyContextVerseText: {
    color: "#342821",
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    minWidth: 0
  },
  studyContextSelectedVerseText: {
    color: colors.ink,
    fontWeight: "700"
  },
  studyCrossReferenceArea: {
    gap: 8
  },
  studyCrossReferenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  studyCrossReferenceChip: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  activeStudyCrossReferenceChip: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  studyCrossReferenceText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  activeStudyCrossReferenceText: {
    color: "white"
  },
  studyCrossReferencePreviewBox: {
    marginTop: 2
  },
  studyCrossReferencePreviewHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  studyCrossReferencePreviewTitleBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  studyCrossReferenceReason: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  studyCrossReferenceClose: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 30
  },
  studyDarkPreviewBox: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  studyDarkContextVerseRow: {
    backgroundColor: "rgba(247, 237, 220, 0.03)"
  },
  studyDarkContextSelectedVerseRow: {
    backgroundColor: "rgba(233, 183, 106, 0.12)"
  },
  studyDarkCrossReferenceChip: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  studyDarkActiveCrossReferenceChip: {
    backgroundColor: "#8f6a35",
    borderColor: "#e9b76a"
  },
  studyPassageActions: {
    alignItems: "flex-start",
    marginTop: 9
  },
  translationComparisonBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 10,
    padding: 12
  },
  translationComparisonHeader: {
    gap: 4
  },
  translationComparisonGrid: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 10
  },
  phoneTranslationComparisonGrid: {
    flexDirection: "column"
  },
  translationComparisonColumn: {
    backgroundColor: "#fffefa",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    gap: 7,
    minWidth: 0,
    padding: 10
  },
  translationComparisonLabel: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900"
  },
  translationComparisonVerse: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19
  },
  translationComparisonVerseNumber: {
    color: colors.coral,
    fontSize: 10,
    fontWeight: "900"
  },
  phoneStudyPrintButton: {
    alignSelf: "stretch",
    justifyContent: "center",
    width: "100%"
  },
  phoneStudyPrintButtonText: {
    textAlign: "center"
  },
  mobilePrintHint: {
    alignItems: "flex-start",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  mobilePrintHintText: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  methodChip: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  activeMethodChip: {
    backgroundColor: colors.oliveDark
  },
  methodChipText: {
    color: colors.oliveDark,
    fontWeight: "700"
  },
  activeMethodChipText: {
    color: "white"
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14
  },
  guidedStudyStepPanel: {
    backgroundColor: colors.panel,
    borderRadius: 14,
    borderColor: colors.line,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16
  },
  methodGuidedExampleBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
    padding: 12
  },
  methodGuidedExampleHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  methodGuidedExampleText: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 22
  },
  contemplativeTimerBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12
  },
  contemplativeTimerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  contemplativeTimerBody: {
    gap: 10,
    marginTop: 10
  },
  contemplativeTimerValue: {
    color: colors.oliveDark,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1
  },
  contemplativeTimerActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  phoneGuidedStudyStepPanel: {
    borderRadius: 11,
    padding: 12
  },
  focusModeRow: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    padding: 12
  },
  focusMainCard: {
    flexBasis: "100%",
    paddingTop: 14,
    width: "100%"
  },
  focusScriptureBox: {
    padding: 14
  },
  focusTextarea: {
    minHeight: 240
  },
  reviewBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16
  },
  reviewMeta: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },
  reviewAnswers: {
    gap: 10,
    marginBottom: 14
  },
  reviewAnswer: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 12
  },
  reviewStepTitle: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 5
  },
  skippedReviewText: {
    color: colors.muted,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20
  },
  stepTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800"
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    color: "white",
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  body: {
    color: "#3e4d44",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12
  },
  bodyStrong: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18
  },
  instructionBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16
  },
  actionText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 8
  },
  collapsedActionText: {
    marginBottom: 0
  },
  instructionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  phoneInstructionHeader: {
    flexDirection: "column",
    gap: 10
  },
  instructionHeaderCopy: {
    flex: 1,
    minWidth: 0
  },
  phoneInstructionHeaderCopy: {
    alignSelf: "stretch",
    flex: 0,
    width: "100%"
  },
  collapseButton: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    minHeight: 34,
    paddingHorizontal: 10
  },
  phoneInstructionCollapseButton: {
    alignSelf: "flex-end"
  },
  collapseButtonText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  checklist: {
    gap: 8,
    marginBottom: 12
  },
  checkItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  checkText: {
    color: "#3e4d44",
    flex: 1,
    fontSize: 15,
    lineHeight: 21
  },
  outputBox: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 12
  },
  outputLabel: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
    textTransform: "uppercase"
  },
  outputText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21
  },
  readyBox: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.25)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    padding: 14
  },
  methodSupportBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.24)",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
    padding: 14
  },
  methodFocusReminder: {
    alignItems: "flex-start",
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.24)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    padding: 12
  },
  methodFocusReminderText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3
  },
  methodSupportReference: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19
  },
  methodSupportInput: {
    marginBottom: 0,
    minHeight: 78,
    paddingTop: 11,
    textAlignVertical: "top"
  },
  methodSupportActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9
  },
  methodSupportAction: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.3)",
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 13,
    paddingVertical: 8
  },
  methodSupportContextAction: {
    alignSelf: "flex-start"
  },
  methodSupportActionText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "800"
  },
  methodSupportClear: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  methodSupportClearText: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: "800"
  },
  methodContextPreview: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    gap: 7,
    padding: 11
  },
  methodContextWholeChapter: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    padding: 11
  },
  methodContextVerseRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  methodContextVerseNumber: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "800",
    minWidth: 20
  },
  methodContextVerseText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    lineHeight: 20
  },
  methodFollowUpBox: {
    alignItems: "flex-start",
    backgroundColor: "#fffaf2",
    borderColor: "rgba(102, 114, 78, 0.24)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    marginBottom: 14,
    padding: 14
  },
  activeMethodFollowUpBox: {
    backgroundColor: colors.sage,
    borderColor: colors.olive
  },
  studyNoteEditorWrap: {
    position: "relative"
  },
  scriptureInsertBox: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    padding: 10
  },
  compactScriptureInsertBox: {
    boxShadow: "0 10px 24px rgba(52, 40, 33, 0.16)" as any,
    marginBottom: 0,
    maxWidth: 270,
    minWidth: 230
  },
  scriptureInsertText: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 160
  },
  scriptureInsertButton: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  scriptureInsertButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800"
  },
  scriptureInsertCloseButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  scriptureSettingList: {
    gap: 14
  },
  editorSettingsScrollArea: {
    flexShrink: 1
  },
  scriptureSettingToggle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    minHeight: 34
  },
  scriptureColorOption: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  activeScriptureColorOption: {
    borderColor: colors.coral,
    borderWidth: 2
  },
  scriptureColorSwatch: {
    borderColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 999,
    borderWidth: 1,
    height: 16,
    width: 16
  },
  scriptureColorActiveText: {
    color: colors.coral
  },
  readyCopy: {
    flex: 1
  },
  readyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4
  },
  readyText: {
    color: "#4b4039",
    fontSize: 15,
    lineHeight: 21
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  studyStepButtonRow: {
    flexWrap: "wrap",
    gap: 6,
    width: "100%"
  },
  studyOtherActions: {
    alignSelf: "flex-start",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minHeight: 44
  },
  studyStepBackButton: {
    flex: 0.72,
    minHeight: 42,
    paddingHorizontal: 8
  },
  studyStepContinueButton: {
    flex: 1.65,
    minHeight: 42,
    paddingHorizontal: 8
  },
  studyStepFreshButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 8
  },
  studyStepButtonLabel: {
    fontSize: 12,
    textAlign: "center"
  },
  planBrowseSectionStack: {
    gap: 12
  },
  planSectionHeading: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    marginBottom: 8,
    marginTop: 6,
    textTransform: "uppercase"
  },
  planSectionHeadingDark: {
    color: "#e9b76a"
  },
  planBrowseIntro: {
    marginTop: 4
  },
  planBrowseSection: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 12
  },
  planBrowseSectionDark: {
    backgroundColor: "#242424",
    borderColor: "#3a3329"
  },
  planBrowseSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  planBrowseSectionTitleBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  planBrowseSectionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  planBrowseSectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  planBrowseSectionDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  planBrowseCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  planPageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  phonePlanPageGrid: {
    gap: 10
  },
  otherFollowedPlanGrid: {
    marginBottom: 14,
    marginTop: 10
  },
  completedReadingPlanGrid: {
    gap: 10,
    marginBottom: 14
  },
  completedReadingPlanSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 6
  },
  completedReadingPlanSectionTitle: {
    marginBottom: 0,
    marginTop: 0
  },
  completedReadingPlanCard: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  phoneCompletedReadingPlanCard: {
    borderRadius: 12,
    padding: 12
  },
  completedReadingPlanHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  completedReadingPlanStatus: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    paddingTop: 2
  },
  completedReadingPlanStatusText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  completedReadingPlanStatusTextDark: {
    color: "#b8d39b"
  },
  completedReadingPlanActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end"
  },
  phoneCompletedReadingPlanActions: {
    justifyContent: "flex-start"
  },
  completedReadingPlanRemoveButton: {
    backgroundColor: colors.panel
  },
  planPageCard: {
    gap: 10,
    maxWidth: "100%",
    width: 360
  },
  expandedBrowsePlanCard: {
    width: "100%"
  },
  followingBiblePlanCard: {
    backgroundColor: colors.panel,
    borderColor: colors.coral,
    borderWidth: 1.5
  },
  followingBiblePlanCardDark: {
    backgroundColor: "#242424",
    borderColor: "#e9b76a"
  },
  phonePlanPageCard: {
    gap: 8,
    padding: 12,
    width: "100%"
  },
  planPageTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  followingPlanBadge: {
    backgroundColor: "#f8efe4",
    borderColor: colors.coral,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.coral,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: "uppercase"
  },
  planPageMetaText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  planLastCompletedText: {
    color: colors.oliveDark
  },
  planPageHeaderActions: {
    alignItems: "flex-end",
    gap: 8
  },
  planCardActionRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 1
  },
  planCardActionChip: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  planCardPrimaryChip: {
    backgroundColor: "#eef3e7",
    borderColor: "#b8c8a7"
  },
  planCardPrimaryChipDark: {
    backgroundColor: "#263026",
    borderColor: "rgba(172, 196, 151, 0.45)"
  },
  planCardSecondaryChip: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line
  },
  planCardSecondaryChipDark: {
    backgroundColor: "#181510",
    borderColor: "#4f4636"
  },
  planCardDangerChip: {
    backgroundColor: colors.panel,
    borderColor: "#f0c4b7"
  },
  planCardDangerChipDark: {
    backgroundColor: "#251817",
    borderColor: "rgba(242, 160, 136, 0.3)"
  },
  planCardActionText: {
    fontSize: 12,
    fontWeight: "900"
  },
  planCardPrimaryText: {
    color: colors.oliveDark
  },
  planCardPrimaryTextDark: {
    color: "#dce7c8"
  },
  planCardSecondaryText: {
    color: colors.oliveDark
  },
  planCardDangerText: {
    color: colors.coral
  },
  planCardDangerTextDark: {
    color: "#f2a088"
  },
  planExpandButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 30,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  planExpandButtonText: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  planDetailsButton: {
    minHeight: 38,
    paddingHorizontal: 12
  },
  planDetailsPanel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 12
  },
  planDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  planDetailItem: {
    flexBasis: 220,
    flexGrow: 1,
    gap: 3,
    minWidth: 0
  },
  planDetailLabel: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  planDetailText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  planSampleList: {
    gap: 7
  },
  planSampleReading: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  planPreviewDayBox: {
    alignItems: "flex-start",
    paddingVertical: 10
  },
  phonePlanPreviewDayBox: {
    flexDirection: "column",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  phonePlanPreviewCopy: {
    alignSelf: "stretch",
    width: "100%"
  },
  phonePlanPreviewTitle: {
    fontSize: 14,
    lineHeight: 19
  },
  planPreviewSection: {
    gap: 2,
    marginTop: 8
  },
  planPreviewSectionLabel: {
    marginTop: 8
  },
  planViewAllButton: {
    alignSelf: "flex-start"
  },
  currentPlanWideBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
    padding: 16
  },
  currentBibleReadingPlanBox: {
    borderColor: colors.line,
    borderWidth: 1
  },
  phoneCurrentPlanWideBox: {
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
    padding: 12
  },
  phonePlanHeader: {
    gap: 8
  },
  planProgressTrack: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    height: 9,
    overflow: "hidden"
  },
  planProgressFill: {
    backgroundColor: colors.coral,
    height: "100%"
  },
  completedPlanProgressFill: {
    backgroundColor: colors.oliveDark
  },
  planPageDay: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderRadius: 12,
    flexDirection: "row",
    gap: 9,
    padding: 10
  },
  compactPlanPageDay: {
    borderRadius: 10,
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  phonePlanPageDay: {
    borderRadius: 10,
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  phoneCompactPlanPageDay: {
    minHeight: 46,
    paddingHorizontal: 8,
    paddingVertical: 7
  },
  currentPlanDayList: {
    gap: 6
  },
  planDayPickerScroll: {
    gap: 8,
    paddingRight: 12
  },
  planDayTile: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    height: 74,
    justifyContent: "center",
    paddingHorizontal: 8,
    width: 72
  },
  planDayWindowButton: {
    borderStyle: "solid"
  },
  phonePlanDayTile: {
    height: 76,
    width: 74
  },
  planDayTileDark: {
    backgroundColor: "#211d18",
    borderColor: "#4b4035"
  },
  completedPlanDayTile: {
    backgroundColor: colors.sage,
    borderColor: colors.olive,
    borderStyle: "solid",
    borderWidth: 1
  },
  completedPlanDayTileDark: {
    backgroundColor: "#34422f",
    borderColor: "rgba(233, 183, 106, 0.45)"
  },
  completedPlanDayTileText: {
    color: "#f7eddc"
  },
  currentPlanDayTile: {
    borderColor: colors.coral,
    borderWidth: 2
  },
  selectedPlanDayTile: {
    backgroundColor: "#fff",
    borderColor: colors.coral,
    borderWidth: 2
  },
  selectedPlanDayTileDark: {
    backgroundColor: "#2b241d",
    borderColor: "#e9b76a"
  },
  missedPlanDayTile: {
    borderColor: colors.coral,
    borderStyle: "dashed"
  },
  selectedMissedPlanDayTile: {
    backgroundColor: "#fff",
    borderStyle: "solid",
    shadowColor: colors.coral,
    shadowOpacity: 0.16,
    shadowRadius: 6
  },
  selectedMissedPlanDayTileDark: {
    backgroundColor: "#2b241d",
    borderStyle: "solid",
    shadowColor: "#e9b76a",
    shadowOpacity: 0.18,
    shadowRadius: 6
  },
  planDayTileNumber: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  planDayTileDate: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
    textAlign: "center"
  },
  planDayTileFlag: {
    color: colors.coral,
    fontSize: 9,
    fontWeight: "900",
    marginTop: 2,
    textTransform: "uppercase"
  },
  selectedPlanDayDetail: {
    alignItems: "center",
    marginTop: 2
  },
  selectedPlanDayWithDevotional: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  planDayDetailTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    width: "100%"
  },
  planDayDevotionalBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    gap: 7,
    marginTop: 9,
    padding: 10,
    width: "100%"
  },
  planDayDevotionalBoxDark: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  planDayDevotionalHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    position: "relative",
    zIndex: 60
  },
  planDayDevotionalToolbar: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2,
    position: "relative",
    zIndex: 80
  },
  planDayDevotionalTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 6,
    minWidth: 0
  },
  planDayDevotionalTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: "900"
  },
  devotionalTextSizeControl: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.62)",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 2,
    padding: 2
  },
  devotionalTextSizeControlDark: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  devotionalTextSizeAnchor: {
    alignItems: "flex-end",
    elevation: 12,
    position: "relative",
    zIndex: 100
  },
  devotionalTextSizeSingleButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.62)",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 30,
    minWidth: 34,
    paddingHorizontal: 7
  },
  devotionalTextSizePopover: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1.5,
    elevation: 18,
    marginTop: 6,
    minWidth: 128,
    padding: 6,
    position: "absolute",
    right: 0,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    top: 34,
    zIndex: 999
  },
  devotionalTextSizePopoverDark: {
    backgroundColor: "rgb(33, 26, 18)",
    borderColor: "rgba(233, 183, 106, 0.2)",
    shadowColor: "#000"
  },
  devotionalTextSizePopoverTail: {
    backgroundColor: "rgb(255, 253, 250)",
    borderColor: colors.line,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    height: 10,
    position: "absolute",
    right: 13,
    top: -5,
    transform: [{ rotate: "45deg" }],
    width: 10
  },
  devotionalTextSizePopoverTailDark: {
    backgroundColor: "rgb(33, 26, 18)",
    borderColor: "rgba(233, 183, 106, 0.2)"
  },
  devotionalTextSizeDismissLayer: {
    backgroundColor: "rgba(0, 0, 0, 0)",
    bottom: -1600,
    left: -1600,
    position: "absolute",
    right: -1600,
    top: 78,
    zIndex: 900
  },
  devotionalTextSizePopoverButtons: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    flexDirection: "row",
    gap: 0,
    overflow: "hidden"
  },
  devotionalTextSizeButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    minHeight: 26,
    minWidth: 34,
    justifyContent: "center",
    paddingHorizontal: 7
  },
  devotionalTextSizeButtonDark: {
    backgroundColor: "rgba(255, 255, 255, 0.08)"
  },
  devotionalTextSizeButtonActive: {
    backgroundColor: colors.oliveDark
  },
  devotionalTextSizeButtonActiveDark: {
    backgroundColor: "#e9b76a"
  },
  devotionalTextSizeButtonText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  devotionalTextSizeButtonTextActive: {
    color: "white"
  },
  devotionalTextSizeButtonTextActiveDark: {
    color: "#211a12"
  },
  planDayDevotionalText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  planDayDevotionalSource: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  planDayPromptRow: {
    gap: 2
  },
  planDayPromptHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    position: "relative",
    zIndex: 80
  },
  planDayCareNoteBox: {
    backgroundColor: "#fff4ea",
    borderColor: "#ecd8c7",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    marginTop: 4,
    padding: 10
  },
  planDayCareNoteBoxDark: {
    backgroundColor: "rgba(233, 183, 106, 0.08)",
    borderColor: "rgba(233, 183, 106, 0.24)"
  },
  careNoteAcknowledgeButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  careNoteAcknowledgeText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  planDayPromptLabel: {
    color: colors.coral,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  planDayPromptText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  currentPlanNextBox: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 10
  },
  compactPlanDayBadge: {
    minWidth: 30,
    paddingHorizontal: 7,
    paddingVertical: 4,
    textAlign: "center"
  },
  planDayActions: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 5
  },
  planDayActionStack: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 6
  },
  planDayTextAction: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  planDayTextActionDark: {
    backgroundColor: "#181510",
    borderColor: "#4f4636"
  },
  planDayTextActionLabel: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  planDayIconAction: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  methodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  accountSection: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    maxWidth: "100%",
    minWidth: 0,
    padding: 14
  },
  accountSubsection: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
    maxWidth: "100%",
    minWidth: 0,
    padding: 12
  },
  accountCollapsibleHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 44
  },
  accountCollapsibleTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  accountCollapsibleSummary: {
    marginTop: 4
  },
  accountCollapsibleBody: {
    gap: 12,
    marginTop: 12
  },
  accountDarkLayout: {
    backgroundColor: "#181818"
  },
  accountDarkMainCard: {
    backgroundColor: "#242424",
    borderColor: "rgba(247, 237, 220, 0.08)",
    shadowColor: "#000000",
    shadowOpacity: 0
  },
  accountDarkSection: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  accountDarkInsetBox: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  accountDarkLegalDocBox: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  accountDarkOptionCard: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  accountDarkActiveOptionCard: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.48)"
  },
  accountDarkInput: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.2)",
    color: "#f7eddc"
  },
  accountDarkTitle: {
    color: "#f7eddc"
  },
  accountDarkText: {
    color: "#f7eddc"
  },
  accountDarkMutedText: {
    color: "#cbc5b9"
  },
  accountDarkBadge: {
    backgroundColor: "#343434",
    borderColor: "rgba(233, 183, 106, 0.45)"
  },
  accountDarkBadgeText: {
    color: "#f7eddc"
  },
  accountDarkSegmentedRow: {
    backgroundColor: "#181818"
  },
  accountDarkActiveSegment: {
    backgroundColor: "#8f6a35"
  },
  studyDarkGuidedHeader: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  studyDarkPillControl: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.22)"
  },
  studyDarkTogglePill: {
    backgroundColor: "#242424"
  },
  studyDarkAccentText: {
    color: "#e9b76a"
  },
  studyDarkMethodChip: {
    backgroundColor: "#343434"
  },
  studyDarkSmartPassageBox: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.34)"
  },
  studyDarkProgressPill: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.14)"
  },
  studyDarkCompletedProgressPill: {
    backgroundColor: "#343434",
    borderColor: "rgba(233, 183, 106, 0.2)"
  },
  studyDarkProgressNumber: {
    backgroundColor: "#343434",
    color: "#e9b76a"
  },
  studyDarkCompletedProgressNumber: {
    backgroundColor: "#e9b76a",
    color: "#171b1c"
  },
  studyDarkActiveProgressNumber: {
    backgroundColor: "#f7eddc",
    color: "#171b1c"
  },
  studyDarkScriptureBox: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  studyDarkVerseRow: {
    backgroundColor: "transparent"
  },
  studyDarkFloatingBar: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.22)"
  },
  bibleDarkDividerSection: {
    borderBottomColor: "rgba(233, 183, 106, 0.16)",
    borderTopColor: "rgba(233, 183, 106, 0.16)"
  },
  bibleDarkSearchSelect: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.18)",
    color: "#f7eddc"
  },
  bibleDarkVerseRow: {
    backgroundColor: "transparent"
  },
  bibleDarkMobileSelectionDock: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.26)",
    shadowColor: "#000",
    shadowOpacity: 0.22
  },
  bibleDarkMobileNoteEditor: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  plansDarkProgressTrack: {
    backgroundColor: "#343434"
  },
  plansDarkDraftPill: {
    backgroundColor: "#343434",
    color: "#f7eddc"
  },
  plansDarkDayRow: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.14)",
    borderWidth: 1
  },
  plansDarkCompletedDayRow: {
    backgroundColor: "#34422f",
    borderColor: "rgba(233, 183, 106, 0.45)"
  },
  completedPlanDayTextDark: {
    color: "#f7eddc"
  },
  completedPlanDayMutedTextDark: {
    color: "#d8ceb8"
  },
  plansDarkDayBadge: {
    backgroundColor: "#8f6a35"
  },
  methodsDarkBadge: {
    backgroundColor: "#343434",
    color: "#f7eddc"
  },
  methodsDarkPill: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.18)",
    color: "#f7eddc"
  },
  methodsDarkWatchBox: {
    backgroundColor: "rgba(201, 103, 80, 0.12)",
    borderColor: "rgba(201, 103, 80, 0.32)"
  },
  memoryDarkFocusBanner: {
    backgroundColor: "rgba(201, 103, 80, 0.12)",
    borderColor: "rgba(201, 103, 80, 0.32)"
  },
  memoryDarkCountPill: {
    backgroundColor: "#343434",
    color: "#f7eddc"
  },
  memoryDarkActiveCard: {
    backgroundColor: "#242424",
    borderColor: "rgba(201, 103, 80, 0.34)"
  },
  memoryDarkReviewPill: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.18)",
    borderWidth: 1,
    color: "#f7eddc"
  },
  memoryDarkDueReviewPill: {
    backgroundColor: "#242424",
    borderColor: "rgba(201, 103, 80, 0.7)",
    borderWidth: 1,
    color: "#f2a08c"
  },
  memoryDarkPracticeText: {
    backgroundColor: "#242424",
    color: "#f7eddc"
  },
  memoryDarkFillBox: {
    backgroundColor: "#242424"
  },
  journalDarkCalendarDayCell: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  journalDarkActiveCalendarDayCell: {
    backgroundColor: "rgba(233, 183, 106, 0.12)",
    borderColor: "rgba(233, 183, 106, 0.34)"
  },
  journalDarkScriptureActiveBookChip: {
    backgroundColor: "rgba(233, 183, 106, 0.12)",
    borderColor: "rgba(233, 183, 106, 0.34)"
  },
  studyDarkStepPanel: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.24)"
  },
  studyDarkFormatButton: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.2)"
  },
  signedInBadgeRow: {
    alignItems: "flex-start",
    marginBottom: 10
  },
  signedInBadge: {
    alignItems: "center",
    backgroundColor: "#eef3e5",
    borderColor: colors.olive,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  accountUsernameBadge: {
    alignSelf: "flex-start",
    marginBottom: 12
  },
  signedInBadgeText: {
    color: colors.oliveDark,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "900"
  },
  freeAccountBox: {
    backgroundColor: colors.panel,
    borderColor: "#edd8bd",
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    marginVertical: 12,
    padding: 12
  },
  freeAccountBenefitRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  freeAccountPrivacyLink: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    minHeight: 32
  },
  freeAccountPrivacyLinkText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "900",
    textDecorationLine: "underline"
  },
  freeAccountBenefitText: {
    color: colors.ink,
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    minWidth: 0
  },
  authDividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    marginBottom: 12
  },
  authDividerLine: {
    backgroundColor: colors.line,
    flex: 1,
    height: 1
  },
  authDividerText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  authFlowRow: {
    backgroundColor: colors.soft,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    minWidth: 0,
    padding: 4
  },
  authFlowButton: {
    alignItems: "center",
    borderRadius: 9,
    flex: 1,
    minHeight: 40,
    minWidth: 0,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  activeAuthFlowButton: {
    backgroundColor: colors.oliveDark
  },
  authFlowText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  activeAuthFlowText: {
    color: "white"
  },
  authFieldLabel: { color: colors.ink, fontSize: 14, fontWeight: "700", marginBottom: 8 },
  accountAccessSection: { width: "100%", maxWidth: 640, alignSelf: "center" },
  accountRecoveryOptions: { gap: 12, marginTop: 20 },
  authFeedback: { color: colors.muted, fontSize: 14, lineHeight: 21, marginVertical: 12 },
  authHelperText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
    marginTop: -6
  },
  accountOptionGrid: {
    minWidth: 0,
    gap: 10
  },
  accountOptionCard: {
    backgroundColor: colors.panel
  },
  legalDocBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 10,
    minWidth: 0,
    padding: 10
  },
  legalDocHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  legalDocBody: {
    gap: 10
  },
  legalUpdatedText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  legalDocSection: {
    gap: 3
  },
  legalDocSectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  legalDocText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  translationLockedBox: {
    backgroundColor: colors.panel,
    borderColor: "#ead8bc",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
    maxWidth: "100%",
    minWidth: 0,
    padding: 12
  },
  lockedTranslationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  lockedTranslationPill: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  lockedTranslationText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  accountStatusBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    maxWidth: "100%",
    minWidth: 0,
    padding: 14
  },
  accountHealthList: {
    gap: 10
  },
  accountHealthItem: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    minWidth: 0,
    padding: 10
  },
  accountAdminMetricGrid: {
    gap: 10
  },
  accountAdminMetricTile: {
    flexBasis: 112,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 78,
    minWidth: 112
  },
  accountAdminMetricLabel: {
    lineHeight: 15,
    marginTop: 2
  },
  memoryList: {
    gap: 12
  },
  phoneMemoryHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2
  },
  phoneMemoryHeaderAddButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 0,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  phoneMemoryHeaderAddPanel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 8,
    padding: 8
  },
  memoryReviewPromptBox: {
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 12
  },
  memoryReviewSuccessBox: {
    backgroundColor: "#edf5df",
    borderColor: "rgba(102, 114, 78, 0.28)"
  },
  memoryReviewEncourageBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.22)"
  },
  memoryReviewPromptText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  memoryListTools: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  phoneMemoryListToolButton: {
    alignSelf: "stretch",
    justifyContent: "center",
    width: "100%"
  },
  memoryViewToggle: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    padding: 4
  },
  memoryModeToolbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  phoneMemoryModeToolbar: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 8
  },
  memoryModeToggle: {
    flex: 1
  },
  memoryPrintCardsButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 13
  },
  memoryPrintCardsButtonText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  phoneMemoryPrintIconButton: {
    backgroundColor: "transparent",
    borderWidth: 0,
    flexShrink: 0,
    minHeight: 42,
    minWidth: 42,
    paddingHorizontal: 0,
    width: 42
  },
  memoryViewButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  activeMemoryViewButton: {
    backgroundColor: colors.oliveDark
  },
  memoryViewText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  activeMemoryViewText: {
    color: "white"
  },
  memoryDiscoverBlock: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12
  },
  memoryBrowseFiltersToggle: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  phoneMemoryBrowseFiltersPanel: {
    gap: 7,
    padding: 10
  },
  memoryBrowseFilterHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  memoryBrowseClearText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryCollectionSelect: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  memoryCollectionPickerPanel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 8
  },
  memoryCollectionPickerItem: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  memoryCollectionReviewButton: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 14
  },
  memoryDiscoverLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  memoryFilterByLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 12,
    marginBottom: -4,
    textTransform: "uppercase"
  },
  memoryHistoryStack: {
    gap: 12
  },
  memoryHistorySummaryBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  memoryHistorySummaryHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  memoryHistorySummaryTextBlock: {
    flex: 1,
    minWidth: 0
  },
  memoryHistoryEncouragementBox: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.22)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 10
  },
  memoryEncouragementHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7
  },
  memoryEncouragementGrid: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 10,
    minWidth: 0
  },
  memoryEncouragementBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  phoneMemoryEncouragementStack: {
    gap: 10,
    width: "100%"
  },
  phoneMemoryEncouragementItem: {
    gap: 4,
    width: "100%"
  },
  memoryHistoryEncouragementText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    minWidth: 0
  },
  memoryWeeklySummaryBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    padding: 10
  },
  memoryWeeklySummaryContent: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 10,
    minWidth: 0
  },
  phoneMemoryWeeklySummaryContent: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8,
    width: "100%"
  },
  memoryWeeklySummaryText: {
    flex: 1.4
  },
  memoryWeeklyScriptureBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.2)",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 0,
    padding: 9
  },
  memoryWeeklyScriptureText: {
    color: colors.ink,
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "800",
    lineHeight: 18
  },
  memoryWeeklyInlineScripture: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 4
  },
  memoryMilestoneList: {
    gap: 8
  },
  memoryMilestoneItem: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 9
  },
  memoryMilestonePicker: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 10
  },
  memoryMilestoneGoalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  memoryMilestoneGoalChip: {
    alignItems: "flex-start",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    minWidth: 190,
    padding: 9,
    width: "48%"
  },
  memoryMilestoneGoalTitle: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryMilestoneGoalDescription: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15
  },
  memoryHistoryHighlight: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    padding: 12
  },
  memoryHistoryList: {
    gap: 8
  },
  memoryHistoryItem: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10
  },
  memoryHistoryIcon: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  memoryHistoryTextBlock: {
    flex: 1,
    minWidth: 0
  },
  memoryHistoryDate: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2
  },
  memoryHistoryMoreButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  memoryHistoryMoreText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  neglectedMemoryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minWidth: 0
  },
  neglectedMemoryPracticeButton: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  neglectedMemoryPracticeText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryVerseHistoryBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 10
  },
  memoryVerseProgressBox: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.18)",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 9
  },
  phoneMemoryVerseHistoryBox: {
    gap: 8,
    padding: 9
  },
  memoryVerseHistoryStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  memoryVerseHistoryStat: {
    flexBasis: 120,
    flexGrow: 1,
    gap: 3,
    minWidth: 0
  },
  memoryVerseHistoryEvents: {
    gap: 6
  },
  memoryVerseHistoryEvent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  memoryVerseHistoryEventText: {
    flex: 1,
    fontSize: 12,
    minWidth: 0
  },
  memoryFocusBanner: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.25)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    padding: 10
  },
  memoryFocusBannerText: {
    color: colors.oliveDark,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  memoryReviewQueueStopButton: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: 11
  },
  memoryReviewQueueStopText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  reviewScheduleBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  reviewScheduleInline: {
    borderTopWidth: 1,
    gap: 10,
    marginTop: 4,
    paddingTop: 12
  },
  memoryBulkReviewBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 10
  },
  memoryMoreReviewOptionsButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 4
  },
  memorySectionSortRow: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  memorySortToggle: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    flexShrink: 0,
    gap: 4,
    padding: 4
  },
  memorySortButton: {
    alignItems: "center",
    borderRadius: 999,
    minHeight: 30,
    minWidth: 72,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  phoneMemorySortButton: {
    minHeight: 28,
    minWidth: 62,
    paddingHorizontal: 8
  },
  phoneMemorySortText: {
    fontSize: 11
  },
  reviewScheduleHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  reviewScheduleCloseButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  memorySection: {
    gap: 10
  },
  phoneMemorySection: {
    gap: 12,
    marginTop: 8,
    paddingTop: 4
  },
  memorySectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginTop: 4
  },
  memorySectionHeaderFeatured: {
    backgroundColor: "rgba(255, 250, 242, 0.9)",
    borderColor: "rgba(201, 103, 80, 0.22)",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  memoryDarkSectionHeaderFeatured: {
    backgroundColor: "#181511",
    borderColor: "#393027"
  },
  memorySectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800"
  },
  memorySectionTitleFeatured: {
    textTransform: "uppercase"
  },
  memorySectionCount: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 26,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: "center"
  },
  memorySectionCountFeatured: {
    backgroundColor: "rgba(201, 103, 80, 0.14)",
    color: colors.coral,
    fontSize: 13,
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  memorySectionCountReviewed: {
    backgroundColor: colors.sage,
    color: colors.oliveDark
  },
  memoryDarkSectionCountFeatured: {
    backgroundColor: "rgba(201, 103, 80, 0.22)",
    color: "#f2c7ba"
  },
  memoryDarkSectionCountReviewed: {
    backgroundColor: "rgba(118, 158, 123, 0.22)",
    color: "#cde0c8"
  },
  memoryCard: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  memoryCollectionPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  memoryCollectionPill: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  memoryDarkCollectionPill: {
    backgroundColor: "#343434",
    borderColor: "rgba(233, 183, 106, 0.16)",
    borderWidth: 1,
    color: "#f7eddc"
  },
  memoryCollectionManageBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    padding: 10
  },
  memoryCollectionEditablePill: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  memoryCollectionEditableText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  memoryCollectionInputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  memoryCollectionInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 42
  },
  memoryCollectionAddButton: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14
  },
  memoryCollectionSuggestionPill: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  collapsedMemoryCard: {
    gap: 5,
    paddingVertical: 10
  },
  phoneMemoryCard: {
    borderRadius: 12,
    gap: 9,
    padding: 11
  },
  activeMemoryCard: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.28)"
  },
  phoneMemoryCardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    width: "100%"
  },
  memoryCardHeaderButton: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between"
  },
  memoryReferenceRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minWidth: 0
  },
  memoryReferenceTitle: {
    flexShrink: 1,
    marginBottom: 0
  },
  memoryHeaderBadges: {
    alignItems: "flex-end",
    gap: 6
  },
  phoneMemoryHeaderBadges: {
    alignItems: "flex-end",
    flexDirection: "column",
    flexShrink: 0,
    gap: 4,
    justifyContent: "flex-start",
    maxWidth: 132
  },
  phoneMemoryHeaderPill: {
    fontSize: 10,
    lineHeight: 12,
    maxWidth: 132,
    paddingHorizontal: 7,
    paddingVertical: 4,
    textAlign: "right"
  },
  reviewDatePill: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 13,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    textAlign: "right"
  },
  dueReviewDatePill: {
    backgroundColor: colors.blush,
    color: colors.coral
  },
  memoryVerseText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24
  },
  phoneMemoryVerseText: {
    fontSize: 15,
    lineHeight: 22
  },
  memoryVersePreview: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18
  },
  memoryTranslationLabel: {
    fontSize: 12,
    lineHeight: 17
  },
  inlineMemoryPractice: {
    gap: 10
  },
  phoneInlineMemoryPractice: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10
  },
  memoryMeditationBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(102, 114, 78, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  phoneMemoryMeditationBox: {
    padding: 10
  },
  memoryMeditationScrim: {
    ...(Platform.OS === "web" ? ({ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" } as any) : {}),
    backgroundColor: "rgba(36, 29, 25, 0.56)"
  },
  memoryMeditationFocusCard: {
    alignSelf: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    marginTop: 46,
    maxHeight: "88%",
    maxWidth: 720,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    width: "88%"
  },
  phoneMemoryMeditationFocusCard: {
    borderRadius: 0,
    height: "100%",
    marginTop: 0,
    maxHeight: "100%",
    paddingHorizontal: 14,
    paddingTop: 16,
    width: "100%"
  },
  memoryMeditationFocusScroll: {
    maxHeight: 520
  },
  memoryMeditationFocusContent: {
    gap: 12,
    paddingBottom: 4
  },
  memoryMeditationHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  memoryMeditationVerse: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.14)",
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    fontStyle: "italic",
    fontWeight: "800",
    lineHeight: 24,
    padding: 12
  },
  memoryMeditationFocusVerse: {
    fontSize: 18,
    lineHeight: 28,
    padding: 14
  },
  memoryMeditationFocusSteps: {
    alignSelf: "stretch"
  },
  memoryMeditationStepButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    minHeight: 34,
    minWidth: 0,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  memoryMeditationPromptBox: {
    gap: 8
  },
  memoryMeditationInput: {
    minHeight: 46
  },
  memoryMeditationTextarea: {
    minHeight: 92,
    textAlignVertical: "top"
  },
  phoneMemoryMeditationInput: {
    fontSize: 16,
    lineHeight: 22,
    maxWidth: "100%",
    width: "100%"
  },
  memoryPracticeBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  memoryPracticeText: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 30,
    padding: 14
  },
  phoneMemoryPracticeText: {
    fontSize: 17,
    lineHeight: 26,
    padding: 12
  },
  memoryPracticeHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between"
  },
  phoneMemoryPracticeHeader: {
    alignItems: "center",
    flexWrap: "nowrap"
  },
  phoneMemoryPracticeTitle: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 0,
    minWidth: 0
  },
  memoryStepRow: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    flexShrink: 0,
    gap: 5,
    padding: 4
  },
  phoneMemoryStepRow: {
    alignSelf: "flex-start",
    borderRadius: 999,
    flexShrink: 0,
    gap: 3,
    padding: 3
  },
  memoryStepButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    minHeight: 34,
    minWidth: 74,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  phoneMemoryStepButton: {
    flex: 0,
    height: 28,
    minHeight: 28,
    minWidth: 28,
    paddingHorizontal: 0,
    width: 28
  },
  activeMemoryStepButton: {
    backgroundColor: colors.oliveDark
  },
  memoryStepText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 15
  },
  phoneMemoryStepText: {
    fontSize: 11
  },
  activeMemoryStepText: {
    color: "white"
  },
  memoryFillBox: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderRadius: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 5,
    rowGap: 4,
    padding: 14
  },
  phoneMemoryFillBox: {
    columnGap: 4,
    paddingHorizontal: 10,
    paddingVertical: 12,
    rowGap: 6
  },
  memoryPracticeWord: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 32
  },
  methodCard: {
    alignSelf: "stretch",
    gap: 10,
    maxWidth: "100%",
    width: Platform.OS === "web" ? 310 : "100%"
  },
  methodCardAction: {
    marginTop: "auto"
  },
  methodCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  methodIconButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  methodStepCountRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  methodStepCountText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  methodLabelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  methodLabelPill: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  methodLibraryToolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
    marginTop: 14
  },
  currentMethodStrip: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    marginTop: 14,
    padding: 12
  },
  currentMethodCopy: {
    flex: 1,
    minWidth: 190
  },
  currentMethodTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19
  },
  currentMethodActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  currentMethodButton: {
    minHeight: 36,
    paddingHorizontal: 12
  },
  currentMethodButtonLabel: {
    fontSize: 12
  },
  methodToolbarButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  methodToolbarButtonText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  methodToolbarBadge: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  methodFilterSection: {
    gap: 8,
    marginBottom: 14,
    marginTop: -4
  },
  methodFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  methodFilterChip: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  activeMethodFilterChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  methodFilterText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  activeMethodFilterText: {
    color: "white"
  },
  methodRecommendPanel: {
    gap: 12,
    marginBottom: 16
  },
  methodRecommendHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  methodRecommendTitleBlock: {
    flex: 1,
    gap: 4
  },
  methodRecommendTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  methodRecommendReason: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  methodRecommendChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  methodRecommendChoice: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  activeMethodRecommendChoice: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  methodRecommendChoiceText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  activeMethodRecommendChoiceText: {
    color: "white"
  },
  emptyMethodCard: {
    maxWidth: "100%",
    width: Platform.OS === "web" ? 310 : "100%"
  },
  methodInfoPanel: {
    gap: 14,
    marginBottom: 16
  },
  methodInfoHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  methodInfoTitleBlock: {
    flex: 1
  },
  methodInfoSection: {
    gap: 8
  },
  methodInfoLabel: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  methodFitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  methodFitPill: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  methodStepPreview: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10
  },
  methodStepNumber: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  methodStepCopy: {
    flex: 1,
    gap: 3
  },
  methodStepTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  methodStepText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  methodExamplePassage: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: "900"
  },
  methodExampleLine: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19
  },
  methodWatchBox: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.24)",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10
  },
  methodWatchText: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  },
  methodInfoActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  phoneMethodCard: {
    width: "100%"
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16
  },
  memoryTitleSupport: {
    marginBottom: 12
  },
  phoneMemoryMetricGrid: {
    flexWrap: "nowrap",
    gap: 6,
    marginBottom: 20,
    marginTop: 6
  },
  metric: {
    backgroundColor: colors.blush,
    borderRadius: 12,
    flex: 1,
    minWidth: 110,
    padding: 14
  },
  phoneMemoryMetric: {
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  metricValue: {
    color: colors.coral,
    fontSize: 24,
    fontWeight: "800"
  },
  phoneMemoryMetricValue: {
    fontSize: 20,
    textAlign: "center"
  },
  phoneMemoryMetricLabel: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center"
  },
  phoneMemoryPrimaryReviewButton: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 42,
    paddingHorizontal: 14
  },
  phoneMemoryPrimaryReviewText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900"
  },
  journalCard: {
    marginBottom: 14
  },
  collapsedJournalCard: {
    paddingVertical: 12
  },
  phoneJournalCard: {
    padding: 12
  },
  journalSearchBox: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    minHeight: 48,
    paddingHorizontal: 12
  },
  phoneJournalSearchBox: {
    borderRadius: 11,
    marginBottom: 10,
    minHeight: 44,
    paddingHorizontal: 10
  },
  journalSearchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    minHeight: 44,
    minWidth: 0,
    outlineStyle: "none" as any
  },
  phoneJournalSearchInput: {
    fontSize: 14,
    minHeight: 40
  },
  clearSearchButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  journalViewRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 12
  },
  phoneJournalViewRow: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8
  },
  journalViewToggle: {
    backgroundColor: colors.soft,
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    padding: 4
  },
  journalViewButton: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12
  },
  activeJournalViewButton: {
    backgroundColor: colors.oliveDark
  },
  journalViewText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  activeJournalViewText: {
    color: "white"
  },
  clearDateFilterButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 34,
    paddingHorizontal: 12,
    justifyContent: "center"
  },
  clearDateFilterText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900"
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14
  },
  phoneJournalFilterRow: {
    gap: 6,
    marginBottom: 10
  },
  filterChip: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  phoneJournalFilterChip: {
    paddingHorizontal: 9,
    paddingVertical: 7
  },
  activeFilterChip: {
    backgroundColor: colors.oliveDark
  },
  filterText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "700"
  },
  phoneJournalFilterText: {
    fontSize: 12
  },
  activeFilterText: {
    color: "white"
  },
  journalFilterPanel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 13,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
    padding: 10
  },
  journalFilterSummary: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 42
  },
  journalFilterSummaryCopy: {
    flex: 1,
    minWidth: 0
  },
  journalFilterSummaryText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20
  },
  journalFilterSummaryRight: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 8
  },
  journalFilterChipGrid: {
    marginBottom: 0
  },
  journalFilterChoiceChip: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  journalGuideBox: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderRadius: 12,
    flexDirection: "row",
    gap: 9,
    marginBottom: 14,
    padding: 12
  },
  phoneJournalGuideBox: {
    borderRadius: 11,
    marginBottom: 10,
    padding: 10
  },
  journalGuideText: {
    color: colors.oliveDark,
    flex: 1,
    fontSize: 13,
    lineHeight: 19
  },
  journalCalendarBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
    padding: 12
  },
  journalCalendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  calendarMonthButton: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  journalCalendarTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  calendarWeekdayRow: {
    flexDirection: "row"
  },
  calendarWeekday: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5
  },
  calendarDayCell: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexBasis: "13.4%",
    height: 58,
    justifyContent: "center",
    minHeight: 44
  },
  activeCalendarDayCell: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.34)"
  },
  selectedCalendarDayCell: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  inactiveCalendarDayCell: {
    opacity: 0.42
  },
  calendarDayNumber: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  inactiveCalendarDayNumber: {
    color: colors.muted
  },
  selectedCalendarDayNumber: {
    color: "white"
  },
  calendarEntryCount: {
    color: colors.coral,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 1
  },
  selectedCalendarEntryCount: {
    color: "white"
  },
  journalScriptureBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    marginBottom: 14,
    padding: 12
  },
  journalScriptureSection: {
    gap: 8
  },
  journalScriptureActiveBookChip: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.34)"
  },
  journalScriptureChapterSquare: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    width: 44
  },
  journalScriptureChapterCount: {
    color: colors.coral,
    fontSize: 9,
    fontWeight: "900",
    marginTop: 1
  },
  emptyJournalScriptureBox: {
    alignItems: "flex-start",
    gap: 8,
    padding: 4
  },
  dateFilterNotice: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.28)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  dateFilterText: {
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "800"
  },
  passageFilterNotice: {
    maxWidth: "100%",
    minWidth: 0
  },
  passageFilterText: {
    flexShrink: 1,
    minWidth: 0
  },
  clearPassageFilterInlineButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderColor: "rgba(201, 103, 80, 0.22)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    flexShrink: 0,
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  clearPassageFilterInlineText: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "900"
  },
  highlightLibraryPanel: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.28)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    padding: 14
  },
  phoneHighlightLibraryPanel: {
    alignItems: "flex-start",
    borderRadius: 12,
    gap: 10,
    padding: 11
  },
  highlightLibraryIcon: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  highlightLibraryCopy: {
    flex: 1,
    minWidth: 0
  },
  highlightLibraryTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 3
  },
  highlightLibraryText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  reflectionBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
    padding: 12
  },
  reflectionInput: {
    marginBottom: 0,
    minHeight: 66,
    paddingTop: 10,
    textAlignVertical: "top"
  },
  journalSection: {
    marginBottom: 16
  },
  emptyJournalBox: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 9,
    padding: 18
  },
  emptyMemoryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  addMemoryHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  phoneAddMemoryHeader: {
    minHeight: 30,
    width: "100%"
  },
  addMemoryBox: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.24)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 12
  },
  phoneAddMemoryBox: {
    alignItems: "stretch",
    borderRadius: 12,
    flexDirection: "column",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  addMemoryCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0
  },
  addMemoryText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  phoneAddMemoryTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  phoneAddMemoryTitle: {
    fontSize: 14,
    lineHeight: 17
  },
  phoneAddMemorySubtitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
    marginTop: 1
  },
  phoneAddMemoryActions: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 6,
    width: "100%"
  },
  phoneMemoryAddActionButton: {
    flex: 1,
    minHeight: 34,
    minWidth: 0
  },
  phoneMemoryAddButton: {
    width: "100%"
  },
  emptyJournalTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800"
  },
  emptyJournalText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  helpPage: {
    gap: 16
  },
  helpHeroCard: {
    gap: 12
  },
  helpShareCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between"
  },
  phoneHelpShareCard: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  helpShareCopy: {
    flex: 1,
    gap: 9,
    minWidth: 0
  },
  helpShareTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26
  },
  helpShareUrl: {
    alignSelf: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.oliveDark,
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  helpDarkShareUrl: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.24)",
    color: "#e9b76a"
  },
  helpShareActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2
  },
  phoneHelpShareButton: {
    flex: 1,
    justifyContent: "center",
    minWidth: 130
  },
  phoneHelpShareButtonText: {
    textAlign: "center"
  },
  helpQrFrame: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
    padding: 11
  },
  helpDarkQrFrame: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  helpQrImage: {
    height: 168,
    width: 168
  },
  helpQrCaption: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  helpActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  helpCategoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  helpCategoryChip: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  activeHelpCategoryChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  helpCategoryText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  activeHelpCategoryText: {
    color: "white"
  },
  helpQuickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  helpQuickCard: {
    flex: 1,
    gap: 8,
    minWidth: 210
  },
  phoneHelpGrid: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  phoneHelpCard: {
    minWidth: 0,
    width: "100%"
  },
  helpStepNumber: {
    alignItems: "center",
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  helpDarkStepNumber: {
    backgroundColor: "#8f6a35"
  },
  helpStepNumberText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900"
  },
  helpCardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  helpCardText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  helpWalkthroughGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  helpScreenshotCard: {
    flex: 1,
    gap: 10,
    minWidth: 280
  },
  helpScreenshotHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  helpWindowDots: {
    flexDirection: "row",
    gap: 4
  },
  helpWindowDot: {
    backgroundColor: colors.line,
    borderRadius: 999,
    height: 7,
    width: 7
  },
  helpDarkWindowDot: {
    backgroundColor: "rgba(233, 183, 106, 0.32)"
  },
  helpScreenshotFrame: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    minHeight: 170,
    overflow: "hidden",
    padding: 12
  },
  helpDarkScreenshotFrame: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  helpScreenshotTopBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  helpScreenshotLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  helpScreenshotPill: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  helpDarkScreenshotPill: {
    backgroundColor: "#343434",
    color: "#e9b76a"
  },
  helpVerseLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  helpSelectedLine: {
    backgroundColor: "#f4dfb6",
    borderRadius: 9,
    padding: 8
  },
  helpDarkSelectedLine: {
    backgroundColor: "rgba(233, 183, 106, 0.14)"
  },
  helpVerseNumber: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: "900"
  },
  helpLongLine: {
    backgroundColor: colors.line,
    borderRadius: 999,
    height: 10,
    width: "78%"
  },
  helpDarkLine: {
    backgroundColor: "rgba(247, 237, 220, 0.24)"
  },
  helpMediumLine: {
    backgroundColor: colors.line,
    borderRadius: 999,
    height: 10,
    width: "62%"
  },
  helpShortLine: {
    backgroundColor: colors.line,
    borderRadius: 999,
    height: 10,
    width: "42%"
  },
  helpDockPreview: {
    backgroundColor: colors.panel,
    borderColor: "#ead8bc",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    marginTop: "auto",
    padding: 7
  },
  helpDarkDockPreview: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  helpDockButton: {
    backgroundColor: colors.oliveDark,
    borderRadius: 999,
    color: "white",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  helpTextAreaPreview: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    gap: 9,
    padding: 12
  },
  helpDarkTextAreaPreview: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  helpToolbarPreview: {
    flexDirection: "row",
    gap: 6
  },
  helpToolButton: {
    backgroundColor: colors.sage,
    borderRadius: 8,
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  helpDarkToolButton: {
    backgroundColor: "#343434",
    color: "#e9b76a"
  },
  helpMemoryLine: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  helpBlankWord: {
    borderBottomColor: colors.coral,
    borderBottomWidth: 2,
    height: 18,
    width: 48
  },
  helpDarkBlankWord: {
    borderBottomColor: "#e9b76a"
  },
  helpMemoryWord: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  helpJournalRow: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: colors.line,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10
  },
  helpDarkJournalRow: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  helpJournalTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  helpFaqCard: {
    gap: 10
  },
  helpFaqItem: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: 4,
    paddingTop: 10
  },
  helpDarkFaqItem: {
    borderTopColor: "rgba(233, 183, 106, 0.16)"
  },
  helpFaqQuestion: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  helpFaqAnswer: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  helpSectionCard: {
    gap: 12
  },
  helpGuideGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  phoneHelpGuideGrid: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 10,
    width: "100%"
  },
  helpGuideItem: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minWidth: 280,
    padding: 12
  },
  helpDarkGuideItem: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  phoneHelpGuideItem: {
    alignSelf: "stretch",
    borderRadius: 10,
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 0,
    gap: 6,
    minWidth: 0,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 9,
    width: "100%"
  },
  phoneHelpGuideItemOpen: {
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  phoneHelpGridItem: {
    minWidth: 0,
    width: "100%"
  },
  phoneHelpGuideHeader: {
    alignItems: "center",
    marginBottom: 0,
    minHeight: 34,
    width: "100%"
  },
  helpGuideTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    minWidth: 0
  },
  helpGuideSummary: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  helpGuideStepList: {
    gap: 7
  },
  phoneHelpGuideStepList: {
    gap: 10,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%"
  },
  helpGuideStep: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0
  },
  phoneHelpGuideStep: {
    alignSelf: "stretch",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    gap: 8,
    maxWidth: "100%",
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: "auto"
  },
  helpDarkGuideStep: {
    backgroundColor: "transparent",
    borderColor: "transparent"
  },
  helpGuideStepNumber: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    color: colors.oliveDark,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: "900",
    minWidth: 22,
    overflow: "hidden",
    paddingVertical: 4,
    textAlign: "center"
  },
  helpDarkGuideStepNumber: {
    backgroundColor: "#343434",
    color: "#e9b76a"
  },
  helpGuideStepText: {
    color: colors.ink,
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19,
    minWidth: 0
  },
  phoneHelpGuideStepText: {
    flexBasis: 0,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: "100%"
  },
  phoneHelpGuideAction: {
    alignSelf: "stretch",
    justifyContent: "center",
    marginTop: 2
  },
  phoneHelpGuideActionText: {
    textAlign: "center"
  },
  helpTabGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  helpTabItem: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    minWidth: 250,
    padding: 11,
    width: "32%"
  },
  helpDarkTabItem: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  phoneHelpTabItem: {
    minWidth: 0,
    width: "100%"
  },
  helpTabCopy: {
    flex: 1,
    minWidth: 0
  },
  helpTroubleList: {
    gap: 9
  },
  helpTroubleItem: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.24)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    padding: 11
  },
  helpDarkTroubleItem: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  feedbackCategoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  feedbackCategoryChip: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  helpDarkCategoryChip: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  activeFeedbackCategoryChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  feedbackCategoryText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  activeFeedbackCategoryText: {
    color: "white"
  },
  dangerActionChip: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  dangerActionText: {
    color: "white"
  },
  deletionRequestBox: {
    backgroundColor: colors.panel,
    borderColor: "#edd8bd",
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    marginTop: 10,
    padding: 12
  },
  savedDataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginVertical: 10
  },
  phoneSavedDataGrid: {
    flexDirection: "column",
    flexWrap: "nowrap"
  },
  savedDataItem: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "31%",
    flexDirection: "row",
    gap: 9,
    minWidth: 150,
    padding: 10
  },
  phoneSavedDataItem: {
    flexBasis: "auto",
    minWidth: 0,
    width: "100%"
  },
  accountDarkSavedDataItem: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  savedDataIcon: {
    alignItems: "center",
    backgroundColor: "#eef3e5",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  accountDarkSavedDataIcon: {
    backgroundColor: "#343434"
  },
  savedDataCopy: {
    flex: 1,
    minWidth: 0
  },
  savedDataValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  savedDataLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  feedbackInput: {
    minHeight: 110,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  iconTextButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  iconTextButtonLabel: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  adminMapCard: {
    gap: 14,
    marginBottom: 14
  },
  adminMapHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  phoneAdminMapHeader: {
    flexDirection: "column"
  },
  adminMapTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  adminMapMetricPill: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderColor: "rgba(102, 114, 78, 0.28)",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  phoneAdminMapMetricPill: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 7,
    width: "100%"
  },
  adminMapMetricValue: {
    color: colors.oliveDark,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24
  },
  adminMapMetricLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  adminMapLayout: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 14
  },
  phoneAdminMapLayout: {
    flexDirection: "column"
  },
  adminMapCanvas: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 320,
    minWidth: 0,
    overflow: "hidden",
    position: "relative"
  },
  adminDarkMapCanvas: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.16)"
  },
  phoneAdminMapCanvas: {
    flex: 0,
    flexShrink: 0,
    height: 210,
    maxHeight: 210,
    minHeight: 210,
    width: "100%"
  },
  adminMapImage: {
    height: "100%",
    opacity: 0.82,
    width: "100%"
  },
  phoneAdminMapImage: {
    bottom: 0,
    height: "100%",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "100%"
  },
  adminMapHotspot: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderColor: "#fffdf8",
    borderRadius: 999,
    borderWidth: 3,
    justifyContent: "center",
    position: "absolute",
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    transform: [{ translateX: -16 }, { translateY: -16 }]
  },
  adminMapHotspotSmall: {
    height: 28,
    width: 28
  },
  adminMapHotspotMedium: {
    height: 34,
    width: 34
  },
  adminMapHotspotLarge: {
    height: 40,
    width: 40
  },
  phoneAdminMapHotspot: {
    borderWidth: 2,
    height: 26,
    transform: [{ translateX: -13 }, { translateY: -13 }],
    width: 26
  },
  activeAdminMapHotspot: {
    backgroundColor: colors.oliveDark
  },
  adminMapHotspotText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18
  },
  adminMapNote: {
    alignItems: "center",
    backgroundColor: "rgba(255, 250, 242, 0.94)",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    bottom: 12,
    flexDirection: "row",
    gap: 6,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    position: "absolute"
  },
  phoneAdminMapNote: {
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  adminMapNoteText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  adminMapDetailPanel: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    minWidth: 240,
    padding: 12,
    width: "30%"
  },
  phoneAdminMapDetailPanel: {
    gap: 4,
    minWidth: 0,
    padding: 10,
    width: "100%"
  },
  adminMapDetailList: {
    gap: 8
  },
  adminMapDetailRow: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3,
    padding: 9
  },
  adminMapDetailLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  adminMapDetailValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  adminDashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
    marginTop: 14
  },
  adminDashboardMetric: {
    flexBasis: 148,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 92,
    minWidth: 148
  },
  adminDashboardMetricLabel: {
    lineHeight: 17,
    marginTop: 2
  },
  phoneAdminDashboardGrid: {
    gap: 8,
    marginBottom: 10,
    marginTop: 10
  },
  adminDashboardCard: {
    flex: 1,
    gap: 10,
    marginBottom: 14,
    minWidth: 260
  },
  adminContainedAdminCard: {
    alignSelf: "stretch",
    flexBasis: "auto" as any,
    flexShrink: 1,
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    width: "100%"
  },
  phoneAdminDashboardCard: {
    alignSelf: "stretch",
    flexBasis: "auto" as any,
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: 8,
    maxWidth: "100%",
    minWidth: 0,
    overflow: "visible",
    width: "100%"
  },
  adminSectionGrid: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14
  },
  phoneAdminSectionGrid: {
    alignItems: "stretch",
    flexDirection: "column",
    flexWrap: "nowrap",
    gap: 8,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%"
  },
  adminMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  phoneAdminDetailMetricGrid: {
    gap: 8
  },
  adminCountList: {
    gap: 6
  },
  adminCountRow: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    minWidth: 0,
    padding: 8
  },
  phoneAdminCountRow: {
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  adminCountLabel: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: "800"
  },
  adminFeedbackItem: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minWidth: 0,
    padding: 10
  },
  phoneAdminFeedbackItem: {
    gap: 6,
    padding: 8
  },
  adminFeedbackList: {
    gap: 10
  },
  adminContainedList: {
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    width: "100%"
  },
  adminEmptyStateText: {
    flexShrink: 1,
    maxWidth: "100%",
    minWidth: 0
  },
  adminContainedText: {
    flexShrink: 1,
    maxWidth: "100%",
    minWidth: 0
  },
  securitySummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%"
  },
  phoneSecuritySummaryGrid: {
    gap: 6
  },
  securitySummaryTile: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 86,
    paddingHorizontal: 9,
    paddingVertical: 8
  },
  securitySummaryValue: {
    color: colors.oliveDark,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 21
  },
  securitySummaryLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  securityTypeBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    padding: 9
  },
  securityTypeChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  securityTypeChip: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  securityTypeChipText: {
    color: colors.oliveDark,
    fontSize: 11,
    fontWeight: "900"
  },
  securityTypeChipCount: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  suspensionReasonBox: {
    alignSelf: "stretch",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
    maxWidth: "100%",
    minWidth: 0,
    padding: 9
  },
  suspensionReasonChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "100%"
  },
  suspensionReasonChip: {
    borderColor: "rgba(201, 103, 80, 0.35)"
  },
  adminReviewBox: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 10
  },
  adminReviewForm: {
    gap: 8
  },
  adminReviewInput: {
    minHeight: 74,
    textAlignVertical: "top"
  },
  adminDirectoryTools: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    padding: 10
  },
  adminDirectorySearchBox: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  adminDirectorySearchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    minWidth: 0,
    outlineStyle: "none" as any,
    padding: 0
  },
  adminDirectoryFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  adminDirectorySummary: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  adminDirectoryShowMore: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  adminSuspendButton: {
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  adminUserRow: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minWidth: 0,
    padding: 10
  },
  phoneAdminUserRow: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8
  },
  activeAdminUserRow: {
    backgroundColor: "#eef3e5",
    borderColor: colors.olive
  },
  adminDarkActiveUserRow: {
    backgroundColor: "#343434",
    borderColor: "rgba(233, 183, 106, 0.35)"
  },
  adminUserMetaPills: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 5
  },
  phoneAdminUserMetaPills: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start"
  },
  adminUserDetailBox: {
    gap: 10,
    minWidth: 0
  },
  adminMiniActivityBox: {
    gap: 7
  },
  warningPill: {
    backgroundColor: "#f5cfc5",
    color: "#783423"
  },
  adminEventItem: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    padding: 10
  },
  adminAuditHeader: {
    maxWidth: "100%",
    minWidth: 0
  },
  adminAuditTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  adminAuditTitle: {
    flexShrink: 1,
    minWidth: 0
  },
  adminAuditDate: {
    flexShrink: 0
  },
  adminAuditDetails: {
    flexShrink: 1,
    maxWidth: "100%",
    minWidth: 0
  },
  phoneAdminEventItem: {
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 7
  },
  adminEventMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  printOptionsOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 520
  },
  editorDialogOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    position: "relative"
  },
  printOptionsScrim: {
    backgroundColor: "rgba(36, 29, 25, 0.28)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  printDarkOptionsScrim: {
    backgroundColor: "rgba(0, 0, 0, 0.56)"
  },
  printOptionsCard: {
    alignSelf: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    marginTop: 82,
    maxWidth: 520,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    width: "88%"
  },
  planCelebrationCard: {
    gap: 16,
    overflow: "hidden",
    paddingTop: 18
  },
  planCelebrationArt: {
    alignItems: "center",
    height: 96,
    justifyContent: "center",
    marginBottom: -2,
    overflow: "hidden"
  },
  planCelebrationIcon: {
    alignItems: "center",
    backgroundColor: "#eef3e5",
    borderColor: "#cbd8bd",
    borderRadius: 999,
    borderWidth: 1,
    height: 70,
    justifyContent: "center",
    width: 70,
    zIndex: 2
  },
  planCelebrationIconDark: {
    backgroundColor: "#2f3025",
    borderColor: "#5b6348"
  },
  planCelebrationParticle: {
    backgroundColor: colors.coral,
    borderRadius: 999,
    height: 7,
    position: "absolute",
    width: 7
  },
  planCelebrationParticleGold: {
    backgroundColor: "#d49a3a"
  },
  planCelebrationParticleGreen: {
    backgroundColor: colors.oliveDark
  },
  planCelebrationTitle: {
    fontSize: 24
  },
  memoryPrintOptionsCard: {
    overflow: "hidden"
  },
  memoryCollectionPromptCard: {
    maxWidth: 560
  },
  memoryBookCollectionCard: {
    maxHeight: "86%",
    maxWidth: 680,
    overflow: "hidden"
  },
  memoryBookCollectionScroll: {
    flexShrink: 1
  },
  memoryBookCollectionContent: {
    gap: 14,
    paddingBottom: 4
  },
  memoryBookDropdownStack: {
    gap: 8
  },
  memoryBookDropdown: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 9
  },
  memoryBookDropdownHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    minHeight: 42
  },
  memoryBookDropdownTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  memoryBookDropdownTitle: {
    color: colors.oliveDark,
    fontSize: 14,
    fontWeight: "900"
  },
  memoryBookDropdownSubtitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 15
  },
  memoryBookPickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  memoryBookPickerChip: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 7
  },
  memoryBookPickerChipText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryBookRangeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  memoryBookRangeInput: {
    flex: 1,
    minWidth: 72
  },
  memoryBookRangeDash: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryCollectionPromptSummary: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    padding: 10
  },
  memoryCollectionPromptText: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    minWidth: 0
  },
  editorSettingsCard: {
    marginTop: 0,
    maxHeight: "86%",
    maxWidth: 520,
    overflow: "hidden",
    width: "100%"
  },
  journalDeleteDialogCard: {
    marginTop: 0,
    maxWidth: 460,
    width: "100%"
  },
  phoneEditorSettingsCard: {
    maxHeight: "92%",
    padding: 14,
    width: "100%"
  },
  editorSettingsStatus: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    minWidth: 120
  },
  editorSettingsSaveButton: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 18
  },
  editorSettingsSaveText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900"
  },
  highlightColorPickerCard: {
    alignSelf: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    marginTop: 112,
    maxWidth: 420,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    width: "88%"
  },
  editorHighlightColorPickerCard: {
    marginTop: 0,
    maxHeight: "90%",
    width: "100%"
  },
  highlightColorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  highlightColorChoice: {
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  activeHighlightColorChoice: {
    borderColor: colors.coral,
    borderWidth: 2
  },
  highlightColorSwatch: {
    borderColor: "rgba(36, 29, 25, 0.16)",
    borderRadius: 999,
    borderWidth: 1,
    height: 20,
    width: 20
  },
  phonePrintOptionsCard: {
    marginTop: 68,
    width: "92%"
  },
  rhythmGraceCard: {
    gap: 13
  },
  phoneRhythmGraceCard: {
    marginTop: 62,
    padding: 14,
    width: "91%"
  },
  printOptionsHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  printOptionsTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  printOptionsTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  printOptionsSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 3
  },
  printOptionGroup: {
    gap: 8
  },
  printOptionsHintText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  printOptionLabel: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  printOptionChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  printOptionChip: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12
  },
  printDarkOptionChip: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  activePrintOptionChip: {
    backgroundColor: colors.oliveDark,
    borderColor: colors.oliveDark
  },
  printOptionChipText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  activePrintOptionChipText: {
    color: "white"
  },
  printOptionToggleList: {
    gap: 8
  },
  printOptionToggle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 32
  },
  printOptionToggleCopy: {
    flex: 1,
    minWidth: 0
  },
  printOptionToggleText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  memoryPrintPickerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  memoryPrintPickerActions: {
    flexDirection: "row",
    flexShrink: 0,
    gap: 12
  },
  memoryPrintPickerActionText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "900"
  },
  memoryPrintVersePicker: {
    backgroundColor: "#fffaf2",
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1
  },
  memoryPrintOptionsScroll: {
    flexShrink: 1,
    minHeight: 0
  },
  memoryPrintOptionsScrollContent: {
    gap: 14,
    paddingBottom: 2
  },
  memoryPrintVersePickerContent: {
    gap: 8,
    padding: 8
  },
  memoryPrintVerseRow: {
    alignItems: "flex-start",
    backgroundColor: "white",
    borderColor: "rgba(108, 91, 67, 0.14)",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    padding: 10
  },
  activeMemoryPrintVerseRow: {
    borderColor: colors.coral
  },
  memoryPrintVerseCopy: {
    flex: 1,
    minWidth: 0
  },
  memoryPrintVerseReference: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  memoryPrintVerseText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 2
  },
  memoryDarkSubPanel: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.18)"
  },
  memoryDarkSoftPanel: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.14)"
  },
  rhythmGraceInfoBox: {
    alignItems: "flex-start",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 11
  },
  rhythmGraceIconBubble: {
    alignItems: "center",
    backgroundColor: "#fff0df",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  rhythmGraceInfoCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  rhythmGraceInfoLabel: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  rhythmGraceInfoText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  rhythmGraceCountBox: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: "rgba(53, 74, 45, 0.16)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  rhythmGraceCountLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  rhythmGraceCountValue: {
    color: colors.oliveDark,
    fontSize: 20,
    fontWeight: "900"
  },
  rhythmGraceSuccessIconRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4
  },
  rhythmGraceSuccessIcon: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    height: 58,
    justifyContent: "center",
    width: 58
  },
  rhythmGraceBodyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20
  },
  printOptionsActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    flexShrink: 0,
    gap: 10,
    justifyContent: "flex-end"
  },
  rhythmGraceActions: {
    justifyContent: "space-between"
  },
  phoneRhythmGraceActions: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: 8
  },
  rhythmGracePrimaryButton: {
    minWidth: 190
  },
  rhythmGraceSecondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14
  },
  printOptionsCancelButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 12
  },
  printDarkCancelButton: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.32)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16
  },
  printOptionsCancelText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900"
  },
  phonePrintOpenButton: {
    justifyContent: "center",
    width: "100%"
  },
  phonePrintOpenButtonText: {
    textAlign: "center"
  },
  contextHelpButton: {
    alignItems: "center",
    backgroundColor: colors.oliveDark,
    borderColor: "rgba(255, 255, 255, 0.72)",
    borderRadius: 999,
    borderWidth: 2,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    width: 48,
    zIndex: 350
  },
  contextHelpOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 500
  },
  contextHelpScrim: {
    backgroundColor: "rgba(36, 29, 25, 0.22)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  contextHelpCard: {
    alignSelf: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginTop: 86,
    maxWidth: 520,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    width: "88%"
  },
  phoneContextHelpCard: {
    marginTop: 74,
    width: "92%"
  },
  contextHelpHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  contextHelpList: {
    gap: 8
  },
  contextHelpTip: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  contextHelpTipText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    lineHeight: 20
  },
  contextHelpActions: {
    alignItems: "flex-start",
    marginTop: 2
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10
  },
  sectionHelp: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10
  },
  journalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between"
  },
  journalCompactHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  journalCompactTitleButton: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
    minWidth: 0
  },
  journalTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  journalHeaderCopyRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 9,
    minWidth: 0
  },
  journalEntryTypeIcon: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderRadius: 999,
    flexShrink: 0,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  journalStatusCluster: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 7
  },
  journalHeaderIconStack: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 7
  },
  phoneJournalHeaderIconStack: {
    alignSelf: "flex-start",
    flexDirection: "column",
    gap: 3
  },
  reviewScheduledIndicator: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderRadius: 999,
    flexShrink: 0,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  journalDateGroup: {
    gap: 10,
    marginBottom: 8
  },
  journalDateGroupTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginTop: 2,
    textTransform: "uppercase"
  },
  pinButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.sage,
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 10
  },
  activePinButton: {
    backgroundColor: colors.oliveDark
  },
  pinButtonText: {
    color: colors.oliveDark,
    fontSize: 12,
    fontWeight: "800"
  },
  activePinButtonText: {
    color: "white"
  },
  pinIconButton: {
    alignItems: "center",
    backgroundColor: colors.sage,
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  activePinIconButton: {
    backgroundColor: colors.oliveDark
  },
  pinJournalIconButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 6,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  activePinJournalIconButton: {
    backgroundColor: "transparent"
  },
  draftPill: {
    backgroundColor: colors.blush,
    borderRadius: 999,
    color: colors.coral,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 13,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  readingPlanCountPill: {
    backgroundColor: "#f5eadb",
    color: "#7d6744"
  },
  pinnedJournalPill: {
    backgroundColor: colors.oliveDark,
    color: "white"
  },
  journalShareBox: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    marginBottom: 10,
    padding: 12
  },
  journalMeditationScriptureBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.18)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
    marginTop: 6,
    padding: 12
  },
  journalDarkMeditationScriptureBox: {
    backgroundColor: "#242424",
    borderColor: "rgba(233, 183, 106, 0.24)"
  },
  journalMeditationReference: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.2,
    lineHeight: 18
  },
  journalMeditationVerseText: {
    color: colors.ink,
    fontSize: 16,
    fontStyle: "italic",
    fontWeight: "700",
    lineHeight: 24
  },
  journalMeditationAnswer: {
    marginBottom: 8
  },
  journalMeditationAnswerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginBottom: 4
  },
  journalMeditationAnswerTitle: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
    lineHeight: 16,
    textTransform: "uppercase"
  },
  studyReviewBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.18)",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12
  },
  formattedNote: {
    gap: 4,
    marginBottom: 8
  },
  formattedBulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 7
  },
  formattedBullet: {
    color: colors.coral,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 0
  },
  formattedBulletText: {
    flex: 1,
    marginBottom: 0
  },
  formattedBold: {
    fontWeight: "900"
  },
  formattedItalic: {
    fontStyle: "italic"
  },
  formattedUnderline: {
    textDecorationLine: "underline"
  },
  formattedHighlight: {
    backgroundColor: "#f4dfb6",
    borderRadius: 4,
    overflow: "hidden",
    paddingHorizontal: 2
  },
  markupSummaryRow: {
    gap: 9
  },
  markupSummaryItem: {
    alignItems: "flex-start",
    gap: 5,
    maxWidth: "100%"
  },
  markupSummaryChip: {
    borderRadius: 999,
    maxWidth: "100%",
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  markupSummaryText: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16
  },
  markupSummaryNote: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19
  },
  reflectionSummaryBox: {
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.24)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 10,
    padding: 12
  },
  reflectionSummaryHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7
  },
  reflectionSummarySection: {
    gap: 3
  },
  reflectionSummaryLabel: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  journalActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  phoneJournalActions: {
    gap: 6
  },
  phoneJournalActionButton: {
    flex: 1,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 38,
    minWidth: 130,
    paddingHorizontal: 8
  },
  phoneJournalActionText: {
    fontSize: 12,
    textAlign: "center"
  },
  phoneMemoryActions: {
    gap: 6
  },
  phoneMemoryPrimaryActions: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "nowrap"
  },
  resumeButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.panel,
    borderColor: "rgba(201, 103, 80, 0.28)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    marginTop: 6,
    maxWidth: "100%",
    minHeight: 44,
    paddingHorizontal: 13
  },
  phoneMemoryActionButton: {
    flex: 1,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 44,
    minWidth: 112,
    paddingHorizontal: 8
  },
  phoneMemoryPracticeButton: {
    flex: 1.25,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 38,
    minWidth: 0,
    paddingHorizontal: 8
  },
  phoneMemoryMeditateButton: {
    flex: 1,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 38,
    minWidth: 0,
    paddingHorizontal: 8
  },
  phoneMemoryMoreButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "transparent",
    borderRadius: 999,
    borderWidth: 0,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 38,
    width: 42
  },
  phoneMemoryMoreMenu: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    padding: 8
  },
  phoneMemoryToolbarMoreMenu: {
    alignSelf: "stretch",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    marginTop: -4,
    padding: 8
  },
  phoneMemoryMoreMenuItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 34,
    paddingHorizontal: 4
  },
  phoneMemoryMoreMenuText: {
    color: colors.oliveDark,
    flex: 1,
    fontSize: 12,
    fontWeight: "900"
  },
  phoneMemoryActionText: {
    fontSize: 12,
    textAlign: "center"
  },
  primaryResumeButton: {
    backgroundColor: colors.coral,
    borderColor: colors.coral
  },
  resumeButtonPressed: {
    opacity: 0.72
  },
  disabledButton: {
    opacity: 0.56
  },
  resumeButtonText: {
    color: colors.coral,
    flexShrink: 1,
    fontWeight: "800"
  },
  primaryResumeButtonText: {
    color: "white"
  },
  bold: {
    fontWeight: "800"
  }
});

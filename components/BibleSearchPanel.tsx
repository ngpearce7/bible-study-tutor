import Ionicons from "@expo/vector-icons/Ionicons";
import { type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { bibleSearchModeLabel, type BibleSearchMode, type BibleSearchResult, type BibleSearchScope } from "@/data/bibleSearch";
import { AppButton, colors } from "@/components/ui";

type BibleSearchSection = {
  title: string;
  results: BibleSearchResult[];
};

type BibleSearchPanelProps = {
  styles: any;
  darkMode: boolean;
  phoneLayout: boolean;
  collapsed: boolean;
  query: string;
  scope: BibleSearchScope;
  mode: BibleSearchMode;
  book: string;
  bookOptions: string[];
  bookMenuOpen: boolean;
  criteriaOpen: boolean;
  translationLabel: string;
  translationId: string;
  status: string;
  duration: string;
  activeQuery: string;
  sections: BibleSearchSection[];
  onToggleCollapsed: () => void;
  onQueryChange: (value: string) => void;
  onRunSearch: () => void;
  onClearSearch: () => void;
  onToggleCriteria: () => void;
  onSelectScope: (scope: BibleSearchScope) => void;
  onSelectMode: (mode: BibleSearchMode) => void;
  onToggleBookMenu: () => void;
  onSelectBook: (book: string) => void;
  onSummaryLayout: (event: any) => void;
  renderResultActions: (result: BibleSearchResult) => ReactNode;
};

const SEARCH_SCOPES: [BibleSearchScope, string][] = [
  ["all", "All"],
  ["old", "Old Testament"],
  ["new", "New Testament"]
];

const SEARCH_MODES: [BibleSearchMode, string][] = [
  ["word", "Word"],
  ["phrase", "Phrase"],
  ["allWords", "All words"],
  ["anyWords", "Any words"],
  ["theme", "Theme"]
];

export function BibleSearchPanel({
  styles,
  darkMode,
  phoneLayout,
  collapsed,
  query,
  scope,
  mode,
  book,
  bookOptions,
  bookMenuOpen,
  criteriaOpen,
  translationLabel,
  translationId,
  status,
  duration,
  activeQuery,
  sections,
  onToggleCollapsed,
  onQueryChange,
  onRunSearch,
  onClearSearch,
  onToggleCriteria,
  onSelectScope,
  onSelectMode,
  onToggleBookMenu,
  onSelectBook,
  onSummaryLayout,
  renderResultActions
}: BibleSearchPanelProps) {
  const iconColor = darkMode ? "#e9b76a" : colors.coral;
  const mutedIconColor = darkMode ? "#c8bda9" : colors.muted;

  function renderBookPicker(compact = false) {
    if (Platform.OS === "web") {
      return (
        <select
          aria-label="Book filter"
          value={book}
          onChange={(event) => onSelectBook(event.currentTarget.value)}
          style={StyleSheet.flatten([
            styles.bibleSearchSelect,
            compact && styles.phoneBibleSearchSelect,
            darkMode && styles.bibleDarkSearchSelect
          ]) as any}
        >
          <option value="">Any book</option>
          {bookOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      );
    }

    return (
      <>
        <Pressable
          onPress={onToggleBookMenu}
          style={[styles.bibleSearchSelectButton, compact && styles.phoneBibleSearchSelectButton, darkMode && styles.printDarkOptionChip]}
        >
          <Text numberOfLines={1} style={[styles.bibleSearchSelectText, darkMode && styles.accountDarkText]}>{book || "Any book"}</Text>
          <Ionicons name={bookMenuOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={mutedIconColor} />
        </Pressable>
        {bookMenuOpen && (
          <View style={[styles.bibleSearchSelectMenu, darkMode && styles.accountDarkSection]}>
            <Pressable onPress={() => onSelectBook("")} style={styles.bibleSearchSelectOption}>
              <Text style={[styles.bibleSearchSelectOptionText, darkMode && styles.accountDarkText]}>Any book</Text>
            </Pressable>
            {bookOptions.map((item) => (
              <Pressable
                key={item}
                onPress={() => onSelectBook(item)}
                style={[styles.bibleSearchSelectOption, book === item && styles.activeBibleSearchSelectOption]}
              >
                <Text style={[styles.bibleSearchSelectOptionText, darkMode && styles.accountDarkText, book === item && styles.activeBibleSearchChipText]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </>
    );
  }

  return (
    <View style={[styles.bibleSearchPanel, darkMode && styles.accountDarkSection]}>
      <Pressable onPress={onToggleCollapsed} style={styles.bibleSearchHeader}>
        <View style={styles.feedbackHeader}>
          <Ionicons name="search-outline" size={18} color={iconColor} />
          <Text style={[styles.feedbackTitle, darkMode && styles.studyDarkAccentText]}>Search Scripture</Text>
        </View>
        <View style={styles.bibleSearchHeaderMeta}>
          <Text style={[styles.bibleSearchTranslationText, darkMode && styles.accountDarkMutedText]}>{translationLabel}</Text>
          <Ionicons name={collapsed ? "chevron-down-outline" : "chevron-up-outline"} size={16} color={mutedIconColor} />
        </View>
      </Pressable>

      {!collapsed && (
        <>
          <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>Choose how closely Scripture should match your search. Exact word is best when you remember a specific word.</Text>
          <View style={[styles.bibleSearchInputRow, phoneLayout && styles.phoneBibleSearchInputRow]}>
            <TextInput
              value={query}
              onChangeText={onQueryChange}
              onSubmitEditing={onRunSearch}
              placeholder="Try “draw near”, “anxiety”, or “what does Scripture teach?”"
              placeholderTextColor={darkMode ? "#8f8678" : undefined}
              style={[styles.input, styles.bibleSearchInput, phoneLayout && styles.phoneBibleSearchInput, darkMode && styles.accountDarkInput]}
            />
            <AppButton label="Search" onPress={onRunSearch} style={phoneLayout && styles.phoneBibleSearchButton} />
            <Pressable
              accessibilityRole="button"
              onPress={onClearSearch}
              style={[styles.bibleSearchClearButton, phoneLayout && styles.phoneBibleSearchButton, darkMode && styles.homeDarkResumeButton]}
            >
              <Ionicons name="close-circle-outline" size={16} color={darkMode ? "#e9b76a" : colors.oliveDark} />
              <Text style={[styles.bibleSearchClearText, darkMode && styles.homeDarkResumeButtonText]}>Clear</Text>
            </Pressable>
          </View>

          {phoneLayout ? (
            <View style={[styles.mobileBibleCriteriaDropdown, darkMode && styles.accountDarkInsetBox]}>
              <Pressable accessibilityRole="button" onPress={onToggleCriteria} style={styles.mobileBibleCriteriaHeader}>
                <View style={styles.mobileBibleCriteriaCopy}>
                  <Text style={[styles.mobileBibleCriteriaTitle, darkMode && styles.accountDarkTitle]}>Search criteria</Text>
                  <Text numberOfLines={1} style={[styles.mobileBibleCriteriaSummary, darkMode && styles.accountDarkMutedText]}>
                    {`${scope === "old" ? "Old Testament" : scope === "new" ? "New Testament" : "All"} · ${bibleSearchModeLabel(mode)} · ${book || "Any book"}`}
                  </Text>
                </View>
                <Ionicons name={criteriaOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={mutedIconColor} />
              </Pressable>

              {criteriaOpen && (
                <View style={styles.mobileBibleCriteriaPanel}>
                  <View style={styles.mobileBibleCriteriaGroup}>
                    <Text style={[styles.mobileBibleCriteriaLabel, darkMode && styles.accountDarkMutedText]}>Where to search</Text>
                    <View style={styles.mobileBibleCriteriaChipRow}>
                      {SEARCH_SCOPES.map(([itemScope, label]) => (
                        <Pressable
                          key={itemScope}
                          onPress={() => onSelectScope(itemScope)}
                          style={[styles.bibleSearchChip, styles.phoneBibleSearchChip, darkMode && styles.printDarkOptionChip, scope === itemScope && styles.activeBibleSearchChip]}
                        >
                          <Text style={[styles.bibleSearchChipText, darkMode && styles.accountDarkMutedText, scope === itemScope && styles.activeBibleSearchChipText]}>{label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.mobileBibleCriteriaGroup}>
                    <Text style={[styles.mobileBibleCriteriaLabel, darkMode && styles.accountDarkMutedText]}>Match type</Text>
                    <View style={styles.mobileBibleCriteriaChipRow}>
                      {SEARCH_MODES.map(([itemMode, label]) => (
                        <Pressable
                          key={itemMode}
                          onPress={() => onSelectMode(itemMode)}
                          style={[styles.bibleSearchChip, styles.phoneBibleSearchChip, darkMode && styles.printDarkOptionChip, mode === itemMode && styles.activeBibleSearchChip]}
                        >
                          <Text style={[styles.bibleSearchChipText, darkMode && styles.accountDarkMutedText, mode === itemMode && styles.activeBibleSearchChipText]}>{label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.mobileBibleCriteriaGroup}>
                    <Text style={[styles.mobileBibleCriteriaLabel, darkMode && styles.accountDarkMutedText]}>Book</Text>
                    {renderBookPicker(true)}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.bibleSearchControls}>
              {SEARCH_SCOPES.map(([itemScope, label]) => (
                <Pressable
                  key={itemScope}
                  onPress={() => onSelectScope(itemScope)}
                  style={[styles.bibleSearchChip, darkMode && styles.printDarkOptionChip, scope === itemScope && styles.activeBibleSearchChip]}
                >
                  <Text style={[styles.bibleSearchChipText, darkMode && styles.accountDarkMutedText, scope === itemScope && styles.activeBibleSearchChipText]}>{label}</Text>
                </Pressable>
              ))}
              <View style={styles.bibleSearchRefineRow}>
                <View style={styles.bibleSearchModeGroup}>
                  {SEARCH_MODES.map(([itemMode, label]) => (
                    <Pressable
                      key={itemMode}
                      onPress={() => onSelectMode(itemMode)}
                      style={[styles.bibleSearchChip, styles.bibleSearchExactChip, darkMode && styles.printDarkOptionChip, mode === itemMode && styles.activeBibleSearchChip]}
                    >
                      <Text style={[styles.bibleSearchChipText, darkMode && styles.accountDarkMutedText, mode === itemMode && styles.activeBibleSearchChipText]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.bibleSearchBookFilter}>{renderBookPicker(false)}</View>
              </View>
            </View>
          )}
        </>
      )}

      {!collapsed && (!!status || !!duration || !!activeQuery) && (
        <View onLayout={onSummaryLayout} style={[styles.bibleSearchSummaryBlock, darkMode && styles.accountDarkInsetBox]}>
          {!!status && <Text style={[styles.bibleSearchStatusText, darkMode && styles.studyDarkAccentText]}>{status}</Text>}
          {!!duration && <Text style={[styles.bibleSearchDurationText, darkMode && styles.accountDarkText]}>{duration}</Text>}
          {!!activeQuery && (
            <Text style={[styles.bibleSearchFootnote, darkMode && styles.accountDarkMutedText]}>
              {translationId === "bsb"
                ? "Search is using BSB text. Word mode only matches whole words."
                : "Word mode only matches whole words. Use Theme when you want broader ideas."}
            </Text>
          )}
        </View>
      )}

      {!collapsed && sections.map((section) => (
        <View key={section.title} style={styles.bibleSearchResultSection}>
          <View style={styles.bibleSearchSectionHeader}>
            <Text style={[styles.readerBookSectionTitle, darkMode && styles.studyDarkAccentText]}>{section.title}</Text>
            <Text style={[styles.bibleSearchSectionCount, darkMode && styles.homeDarkResumeButtonText]}>{section.results.length}</Text>
          </View>
          {section.results.map((result) => (
            <View key={result.id} style={[styles.bibleSearchResultCard, darkMode && styles.accountDarkInsetBox]}>
              <View style={styles.bibleSearchResultHeader}>
                <Text style={[styles.bibleSearchResultReference, darkMode && styles.accountDarkTitle]}>{`${result.book} ${result.chapter}:${result.verse}`}</Text>
                <Text style={[styles.bibleSearchSourceQuery, darkMode && styles.accountDarkMutedText]}>{result.sourceQuery}</Text>
              </View>
              <Text style={[styles.bibleSearchResultText, darkMode && styles.accountDarkText]}>{result.text}</Text>
              <View style={styles.bibleSearchResultActions}>{renderResultActions(result)}</View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import {
  MEMORY_MILESTONE_GOALS,
  formatMemoryHistoryDate,
  memoryHistoryEventIcon,
  memoryHistoryEventLabel,
  neglectedMemoryVerseLabel,
  type MemoryMilestoneGoalId
} from "@/data/memory";
import { colors } from "@/components/ui";

type MemoryHistoryPanelProps = {
  styles: any;
  darkMode: boolean;
  phoneLayout: boolean;
  historySummary: any;
  todayEncouragement: string;
  weeklySummary: string;
  weeklyScripture: { reference: string; text: string };
  neglectedVerses: any[];
  milestones: any[];
  milestoneGoalIds: MemoryMilestoneGoalId[];
  milestonePickerOpen: boolean;
  milestoneStatus: string;
  historyItems: any[];
  visibleHistoryItems: any[];
  historyExpanded: boolean;
  onPracticeVerse: (verse: any) => void;
  onToggleMilestonePicker: () => void;
  onToggleMilestoneGoal: (goalId: MemoryMilestoneGoalId) => void;
  onToggleHistoryExpanded: () => void;
};

export function MemoryHistoryPanel({
  styles,
  darkMode,
  phoneLayout,
  historySummary,
  todayEncouragement,
  weeklySummary,
  weeklyScripture,
  neglectedVerses,
  milestones,
  milestoneGoalIds,
  milestonePickerOpen,
  milestoneStatus,
  historyItems,
  visibleHistoryItems,
  historyExpanded,
  onPracticeVerse,
  onToggleMilestonePicker,
  onToggleMilestoneGoal,
  onToggleHistoryExpanded
}: MemoryHistoryPanelProps) {
  return (
    <View style={styles.memoryHistoryStack}>
      <View style={[styles.memoryHistorySummaryBox, darkMode && styles.accountDarkSection]}>
        <View style={styles.memoryHistorySummaryHeader}>
          <View style={styles.memoryHistorySummaryTextBlock}>
            <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>Memory engagement</Text>
          </View>
          <Ionicons name="time-outline" size={22} color={colors.coral} />
        </View>
        <View style={[styles.memoryHistoryEncouragementBox, darkMode && styles.accountDarkInsetBox]}>
          <View style={styles.memoryEncouragementHeader}>
            <Ionicons name="sparkles-outline" size={17} color={darkMode ? "#e9b76a" : colors.coral} />
            <Text style={[styles.memoryDiscoverLabel, darkMode && styles.studyDarkAccentText]}>Encouragement</Text>
          </View>
          {phoneLayout ? (
            <View style={styles.phoneMemoryEncouragementStack}>
              <View style={styles.phoneMemoryEncouragementItem}>
                <Text style={[styles.memoryDiscoverLabel, darkMode && styles.studyDarkAccentText]}>Today</Text>
                <Text style={[styles.memoryHistoryEncouragementText, darkMode && styles.accountDarkText]}>{todayEncouragement}</Text>
              </View>
              <View style={styles.phoneMemoryEncouragementItem}>
                <Text style={[styles.memoryDiscoverLabel, darkMode && styles.studyDarkAccentText]}>This week</Text>
                <Text style={[styles.memoryHistoryEncouragementText, darkMode && styles.accountDarkText]}>{weeklySummary}</Text>
                <Text style={[styles.memoryWeeklyInlineScripture, darkMode && styles.accountDarkMutedText]}>
                  "{weeklyScripture.text}" - {weeklyScripture.reference}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.memoryEncouragementGrid}>
              <View style={styles.memoryEncouragementBlock}>
                <Text style={[styles.memoryDiscoverLabel, darkMode && styles.studyDarkAccentText]}>Today</Text>
                <Text style={[styles.memoryHistoryEncouragementText, darkMode && styles.accountDarkText]}>{todayEncouragement}</Text>
              </View>
              <View style={styles.memoryEncouragementBlock}>
                <Text style={[styles.memoryDiscoverLabel, darkMode && styles.studyDarkAccentText]}>This week</Text>
                <Text style={[styles.memoryHistoryEncouragementText, darkMode && styles.accountDarkText]}>{weeklySummary}</Text>
              </View>
              <View style={[styles.memoryWeeklyScriptureBox, darkMode && styles.accountDarkSection]}>
                <Text style={[styles.memoryWeeklyScriptureText, darkMode && styles.accountDarkText]}>"{weeklyScripture.text}"</Text>
                <Text style={[styles.memoryHistoryDate, darkMode && styles.accountDarkMutedText]}>{weeklyScripture.reference}</Text>
              </View>
            </View>
          )}
        </View>
        <View style={[styles.metricGrid, phoneLayout && styles.phoneMemoryMetricGrid]}>
          <Metric styles={styles} value={historySummary.reviewedToday} label="reviewed today" compact={phoneLayout} labelLines={2} style={darkMode && styles.homeDarkMetric} valueStyle={darkMode && styles.homeDarkMetricValue} labelStyle={darkMode && styles.accountDarkMutedText} />
          <Metric styles={styles} value={historySummary.reviewedThisWeek} label="this week" compact={phoneLayout} style={darkMode && styles.homeDarkMetric} valueStyle={darkMode && styles.homeDarkMetricValue} labelStyle={darkMode && styles.accountDarkMutedText} />
          <Metric styles={styles} value={historySummary.addedCount} label="added" compact={phoneLayout} style={darkMode && styles.homeDarkMetric} valueStyle={darkMode && styles.homeDarkMetricValue} labelStyle={darkMode && styles.accountDarkMutedText} />
        </View>
        {historySummary.mostReviewed && (
          <View style={[styles.memoryHistoryHighlight, darkMode && styles.accountDarkInsetBox]}>
            <Text style={[styles.memoryDiscoverLabel, darkMode && styles.studyDarkAccentText]}>Most reviewed</Text>
            <Text style={[styles.body, darkMode && styles.accountDarkText]}>{historySummary.mostReviewed.reference}</Text>
            <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>{historySummary.mostReviewed.count} review{historySummary.mostReviewed.count === 1 ? "" : "s"} recorded</Text>
          </View>
        )}
        {neglectedVerses.length > 0 && (
          <View style={[styles.memoryHistoryHighlight, darkMode && styles.accountDarkInsetBox]}>
            <Text style={[styles.memoryDiscoverLabel, darkMode && styles.studyDarkAccentText]}>Worth revisiting</Text>
            <View style={styles.memoryHistoryList}>
              {neglectedVerses.map((verse: any) => (
                <View key={String(verse._id)} style={styles.neglectedMemoryRow}>
                  <View style={styles.memoryHistoryTextBlock}>
                    <Text style={[styles.bodyStrong, darkMode && styles.accountDarkText]}>{verse.reference}</Text>
                    <Text style={[styles.memoryHistoryDate, darkMode && styles.accountDarkMutedText]}>{neglectedMemoryVerseLabel(verse.daysSinceReview, verse.reviewCount)}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onPracticeVerse(verse)}
                    style={[styles.neglectedMemoryPracticeButton, darkMode && styles.homeDarkResumeButton]}
                  >
                    <Text style={[styles.neglectedMemoryPracticeText, darkMode && styles.homeDarkResumeButtonText]}>Practice</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={[styles.memoryHistorySummaryBox, darkMode && styles.accountDarkSection]}>
        <View style={styles.memoryHistorySummaryHeader}>
          <View style={styles.memoryHistorySummaryTextBlock}>
            <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>Memory milestones</Text>
            <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>
              Choose up to five goals to keep in view.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onToggleMilestonePicker}
            style={[styles.memoryHistoryMoreButton, darkMode && styles.homeDarkResumeButton]}
          >
            <Text style={[styles.memoryHistoryMoreText, darkMode && styles.homeDarkResumeButtonText]}>
              {milestonePickerOpen ? "Hide goals" : "Choose goals"}
            </Text>
            <Ionicons name={milestonePickerOpen ? "chevron-up-outline" : "options-outline"} size={16} color={darkMode ? "#e9b76a" : colors.oliveDark} />
          </Pressable>
        </View>
        {milestonePickerOpen && (
          <View style={[styles.memoryMilestonePicker, darkMode && styles.accountDarkInsetBox]}>
            <Text style={[styles.memoryDiscoverLabel, darkMode && styles.studyDarkAccentText]}>
              Tracking {milestoneGoalIds.length} of 5
            </Text>
            <View style={styles.memoryMilestoneGoalGrid}>
              {MEMORY_MILESTONE_GOALS.map((goal) => {
                const selected = milestoneGoalIds.includes(goal.id);
                return (
                  <Pressable
                    key={goal.id}
                    accessibilityRole="button"
                    onPress={() => onToggleMilestoneGoal(goal.id)}
                    style={[
                      styles.memoryMilestoneGoalChip,
                      darkMode && styles.printDarkOptionChip,
                      selected && styles.activeFilterChip
                    ]}
                  >
                    <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={15} color={selected ? "#ffffff" : darkMode ? "#e9b76a" : colors.oliveDark} />
                    <View style={styles.memoryHistoryTextBlock}>
                      <Text style={[styles.memoryMilestoneGoalTitle, darkMode && styles.accountDarkText, selected && styles.activeFilterText]}>{goal.label}</Text>
                      <Text style={[styles.memoryMilestoneGoalDescription, darkMode && styles.accountDarkMutedText, selected && styles.activeFilterText]}>{goal.description}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {!!milestoneStatus && <Text style={[styles.memoryHistoryDate, darkMode && styles.accountDarkMutedText]}>{milestoneStatus}</Text>}
          </View>
        )}
        <View style={styles.memoryMilestoneList}>
          {milestones.map((milestone) => (
            <View key={milestone.id || milestone.title} style={[styles.memoryMilestoneItem, darkMode && styles.accountDarkInsetBox]}>
              <Ionicons name={milestone.achieved ? "checkmark-circle-outline" : "ellipse-outline"} size={16} color={darkMode ? "#e9b76a" : colors.coral} />
              <View style={styles.memoryHistoryTextBlock}>
                <Text style={[styles.bodyStrong, darkMode && styles.accountDarkText]}>{milestone.title}</Text>
                <Text style={[styles.memoryVerseHistoryEventText, darkMode && styles.accountDarkMutedText]}>{milestone.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.memoryHistorySummaryBox, darkMode && styles.accountDarkSection]}>
        <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>Recent memory activity</Text>
        {historyItems.length === 0 ? (
          <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>Your history will appear here as you add, review, repeat, and schedule memory verses.</Text>
        ) : (
          <View style={styles.memoryHistoryList}>
            {visibleHistoryItems.map((item: any) => (
              <View key={item._id} style={[styles.memoryHistoryItem, darkMode && styles.accountDarkInsetBox]}>
                <View style={[styles.memoryHistoryIcon, darkMode && styles.homeDarkIconBubble]}>
                  <Ionicons name={memoryHistoryEventIcon(item.event) as any} size={17} color={darkMode ? "#e9b76a" : colors.coral} />
                </View>
                <View style={styles.memoryHistoryTextBlock}>
                  <Text style={[styles.bodyStrong, darkMode && styles.accountDarkText]}>{memoryHistoryEventLabel(item.event, item.practiceLevel)}</Text>
                  <Text style={[styles.muted, darkMode && styles.accountDarkMutedText]}>{item.reference}</Text>
                  <Text style={[styles.memoryHistoryDate, darkMode && styles.accountDarkMutedText]}>{formatMemoryHistoryDate(item.createdAt)}</Text>
                </View>
              </View>
            ))}
            {historyItems.length > 10 && (
              <Pressable
                accessibilityRole="button"
                onPress={onToggleHistoryExpanded}
                style={[styles.memoryHistoryMoreButton, darkMode && styles.homeDarkResumeButton]}
              >
                <Text style={[styles.memoryHistoryMoreText, darkMode && styles.homeDarkResumeButtonText]}>
                  {historyExpanded ? "Show less" : `Show more (${Math.min(historyItems.length, 30) - 10})`}
                </Text>
                <Ionicons name={historyExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={darkMode ? "#e9b76a" : colors.oliveDark} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function Metric({
  styles,
  value,
  label,
  compact = false,
  style,
  valueStyle,
  labelStyle,
  labelLines = 1
}: {
  styles: any;
  value: number;
  label: string;
  compact?: boolean;
  style?: any;
  valueStyle?: any;
  labelStyle?: any;
  labelLines?: number;
}) {
  return (
    <View style={[styles.metric, compact && styles.phoneMemoryMetric, style]}>
      <Text style={[styles.metricValue, compact && styles.phoneMemoryMetricValue, valueStyle]}>{value}</Text>
      <Text numberOfLines={labelLines} style={[styles.muted, compact && styles.phoneMemoryMetricLabel, labelStyle]}>{label}</Text>
    </View>
  );
}

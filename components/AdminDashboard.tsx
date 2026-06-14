import Ionicons from "@expo/vector-icons/Ionicons";
import { memo, useEffect, useMemo, useState, type ReactNode } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { AppButton, Card, Eyebrow, colors } from "@/components/ui";

export type AdminStats = {
  totals: {
    profiles: number;
    signedInProfiles: number;
    localProfiles: number;
    activeProfiles7d: number;
    profilesWithStudies: number;
    events: number;
    feedback: number;
    newFeedback: number;
    appShares: number;
    pendingDeletionRequests: number;
  };
  topBookmarked: { label: string; count: number }[];
  topMemory: { label: string; count: number }[];
  topMethods: { label: string; count: number }[];
  topSearches: { label: string; count: number }[];
  shareSources: { label: string; count: number }[];
  eventBreakdown: { label: string; count: number }[];
  feedbackByCategory: { label: string; count: number }[];
  feedbackByStatus: { label: string; count: number }[];
  recentEvents: {
    _id: string;
    eventType: string;
    reference?: string;
    methodName?: string;
    tab?: string;
    createdAt: number;
  }[];
  recentFeedback: any[];
  deletionRequests: any[];
};

type AdminRegionInsight = { name: string; description: string; count: number; x: number; y: number; size: "small" | "medium" | "large" };
type MetricComponent = (props: { value: number; label: string; compact?: boolean; style?: any; valueStyle?: any; labelStyle?: any; labelLines?: number }) => ReactNode;

const ADMIN_WORLD_MAP_URI = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/BlankMap-World.svg/1280px-BlankMap-World.svg.png";
const ADMIN_REGION_PREVIEW: AdminRegionInsight[] = [
  { name: "Australia", description: "Broad region only", count: 0, x: 79, y: 73, size: "large" },
  { name: "Europe", description: "Broad region only", count: 0, x: 52, y: 32, size: "medium" },
  { name: "North America", description: "Broad region only", count: 0, x: 23, y: 35, size: "medium" },
  { name: "Africa", description: "Broad region only", count: 0, x: 52, y: 55, size: "small" },
  { name: "Asia", description: "Broad region only", count: 0, x: 70, y: 38, size: "small" }
];

export const AdminDashboard = memo(function AdminDashboard({
  adminStats,
  adminUsers,
  adminUserDetail,
  adminAuditLog,
  adminMaintenanceStatus,
  pendingConfirmId,
  selectedProfileId,
  selectedRegion,
  compactLayout,
  phoneLayout,
  darkMode,
  styles,
  MetricComponent,
  onApproveDeletion,
  onCancelDeletion,
  onCleanupLocalProfiles,
  onMarkFeedbackStatus,
  onOpenAccount,
  onSelectProfile,
  onSelectRegion
}: {
  adminStats: AdminStats | null;
  adminUsers: any[];
  adminUserDetail: any;
  adminAuditLog: any[];
  adminMaintenanceStatus: string;
  pendingConfirmId: string;
  selectedProfileId: any;
  selectedRegion: string;
  compactLayout: boolean;
  phoneLayout: boolean;
  darkMode: boolean;
  styles: any;
  MetricComponent: MetricComponent;
  onApproveDeletion: (requestId: any) => void;
  onCancelDeletion: (requestId: any) => void;
  onCleanupLocalProfiles: () => void;
  onMarkFeedbackStatus: (args: { feedbackId: any; status: string }) => Promise<unknown>;
  onOpenAccount: () => void;
  onSelectProfile: (profileId: any) => void;
  onSelectRegion: (region: string) => void;
}) {
  if (!adminStats) {
    return (
      <View style={darkMode && styles.accountDarkLayout}>
        <Eyebrow>Administrator</Eyebrow>
        <Text style={[styles.title, darkMode && styles.accountDarkTitle]}>Admin insights</Text>
        <Text style={[styles.titleSupport, darkMode && styles.accountDarkMutedText]}>Sign in with an administrator account to view app insights.</Text>
        <AppButton label="Open account" onPress={onOpenAccount} />
      </View>
    );
  }

  return (
    <View style={darkMode && styles.accountDarkLayout}>
      <Eyebrow>Administrator</Eyebrow>
      <Text style={[styles.title, darkMode && styles.accountDarkTitle]}>Admin insights</Text>
      <Text style={[styles.titleSupport, darkMode && styles.accountDarkMutedText]}>A fuller view of genuine app activity, feedback, and the passages people are returning to.</Text>

      <View style={[styles.adminDashboardGrid, phoneLayout && styles.phoneAdminDashboardGrid]}>
        <MetricComponent value={adminStats.totals.activeProfiles7d} label="active 7d" labelLines={2} style={[styles.adminDashboardMetric, darkMode && styles.accountDarkSection]} valueStyle={darkMode && styles.accountDarkTitle} labelStyle={[styles.adminDashboardMetricLabel, darkMode && styles.accountDarkMutedText]} />
        <MetricComponent value={adminStats.totals.signedInProfiles} label="signed in" labelLines={2} style={[styles.adminDashboardMetric, darkMode && styles.accountDarkSection]} valueStyle={darkMode && styles.accountDarkTitle} labelStyle={[styles.adminDashboardMetricLabel, darkMode && styles.accountDarkMutedText]} />
        <MetricComponent value={adminStats.totals.profilesWithStudies} label="with studies" labelLines={2} style={[styles.adminDashboardMetric, darkMode && styles.accountDarkSection]} valueStyle={darkMode && styles.accountDarkTitle} labelStyle={[styles.adminDashboardMetricLabel, darkMode && styles.accountDarkMutedText]} />
        <MetricComponent value={adminStats.totals.newFeedback} label="new feedback" labelLines={2} style={[styles.adminDashboardMetric, darkMode && styles.accountDarkSection]} valueStyle={darkMode && styles.accountDarkTitle} labelStyle={[styles.adminDashboardMetricLabel, darkMode && styles.accountDarkMutedText]} />
        <MetricComponent value={adminStats.totals.appShares || 0} label="app shares" labelLines={2} style={[styles.adminDashboardMetric, darkMode && styles.accountDarkSection]} valueStyle={darkMode && styles.accountDarkTitle} labelStyle={[styles.adminDashboardMetricLabel, darkMode && styles.accountDarkMutedText]} />
        <MetricComponent value={adminStats.totals.pendingDeletionRequests} label="deletion requests" labelLines={2} style={[styles.adminDashboardMetric, darkMode && styles.accountDarkSection]} valueStyle={darkMode && styles.accountDarkTitle} labelStyle={[styles.adminDashboardMetricLabel, darkMode && styles.accountDarkMutedText]} />
        <MetricComponent value={adminStats.totals.events} label="events" labelLines={2} style={[styles.adminDashboardMetric, darkMode && styles.accountDarkSection]} valueStyle={darkMode && styles.accountDarkTitle} labelStyle={[styles.adminDashboardMetricLabel, darkMode && styles.accountDarkMutedText]} />
        <MetricComponent value={adminStats.totals.localProfiles} label="local/test" labelLines={2} style={[styles.adminDashboardMetric, darkMode && styles.accountDarkSection]} valueStyle={darkMode && styles.accountDarkTitle} labelStyle={[styles.adminDashboardMetricLabel, darkMode && styles.accountDarkMutedText]} />
      </View>

      <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
        <View style={styles.feedbackHeader}>
          <Ionicons name="trash-outline" size={18} color={colors.coral} />
          <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>Account deletion requests</Text>
        </View>
        <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>{phoneLayout ? "Review genuine requests before approving." : "Approve only after you are confident the request is genuine. Approval removes the user's app data and connected sign-in records."}</Text>
        <AdminDeletionRequestList styles={styles} requests={adminStats.deletionRequests} pendingConfirmId={pendingConfirmId} onApprove={onApproveDeletion} onCancel={onCancelDeletion} phoneLayout={phoneLayout} darkMode={darkMode} />
      </Card>

      <View style={[styles.adminSectionGrid, compactLayout && styles.stackedLayout, phoneLayout && styles.phoneAdminSectionGrid]}>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="people-outline" size={18} color={colors.coral} />
            <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>User directory</Text>
          </View>
          <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>A privacy-safe list of profiles, account status, and activity counts.</Text>
          <AdminUserDirectory styles={styles} users={adminUsers} selectedProfileId={selectedProfileId} maintenanceStatus={adminMaintenanceStatus} onSelect={onSelectProfile} onCleanupLocalProfiles={onCleanupLocalProfiles} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="person-circle-outline" size={18} color={colors.coral} />
            <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>User summary</Text>
          </View>
          <AdminUserDetail styles={styles} MetricComponent={MetricComponent} detail={adminUserDetail} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
      </View>

      <Card style={[styles.adminDashboardCard, styles.adminAuditCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
        <View style={styles.feedbackHeader}>
          <Ionicons name="receipt-outline" size={18} color={colors.coral} />
          <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>Admin audit log</Text>
        </View>
        <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>{phoneLayout ? "Recent sensitive admin actions." : "Tracks sensitive admin actions such as deletion approvals and feedback status changes."}</Text>
        <AdminAuditLog styles={styles} entries={adminAuditLog} phoneLayout={phoneLayout} darkMode={darkMode} />
      </Card>

      <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
        <View style={styles.feedbackHeader}>
          <Ionicons name="information-circle-outline" size={18} color={colors.coral} />
          <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>Profile context</Text>
        </View>
        <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>
          Total raw profiles: {adminStats.totals.profiles}. This can include local test profiles and older device-only profiles, so active users and signed-in profiles are the better health signals.
        </Text>
      </Card>

      <AdminReachMap styles={styles} activeUsers={adminStats.totals.activeProfiles7d} selectedRegion={selectedRegion} onSelectRegion={onSelectRegion} phoneLayout={phoneLayout} darkMode={darkMode} />

      <View style={[styles.adminSectionGrid, compactLayout && styles.stackedLayout, phoneLayout && styles.phoneAdminSectionGrid]}>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountList styles={styles} title="Top bookmarked verses" items={adminStats.topBookmarked} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountList styles={styles} title="Top memory verses" items={adminStats.topMemory} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountList styles={styles} title="Top study methods" items={adminStats.topMethods} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountList styles={styles} title="Bible searches" items={adminStats.topSearches} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountList styles={styles} title="App shares" items={adminStats.shareSources || []} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
      </View>

      <View style={[styles.adminSectionGrid, compactLayout && styles.stackedLayout, phoneLayout && styles.phoneAdminSectionGrid]}>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountList styles={styles} title="Activity breakdown" items={adminStats.eventBreakdown} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountList styles={styles} title="Feedback categories" items={adminStats.feedbackByCategory} phoneLayout={phoneLayout} darkMode={darkMode} />
          <AdminCountList styles={styles} title="Feedback status" items={adminStats.feedbackByStatus} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
      </View>

      <View style={[styles.adminSectionGrid, compactLayout && styles.stackedLayout, phoneLayout && styles.phoneAdminSectionGrid]}>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <Text style={[styles.lastCheckinLabel, darkMode && styles.studyDarkAccentText]}>Latest feedback</Text>
          <AdminFeedbackList styles={styles} feedback={adminStats.recentFeedback} onMarkStatus={onMarkFeedbackStatus} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <Text style={[styles.lastCheckinLabel, darkMode && styles.studyDarkAccentText]}>Recent activity</Text>
          <AdminEventList styles={styles} events={adminStats.recentEvents} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
      </View>
    </View>
  );
});

function AdminCountList({ styles, title, items, phoneLayout = false, darkMode = false }: { styles: any; title: string; items?: { label: string; count: number }[]; phoneLayout?: boolean; darkMode?: boolean }) {
  const safeItems = Array.isArray(items) ? items : [];
  const visibleItems = phoneLayout ? safeItems.slice(0, 4) : safeItems;

  return (
    <View style={styles.adminCountList}>
      <Text style={[styles.lastCheckinLabel, darkMode && styles.studyDarkAccentText]}>{title}</Text>
      {safeItems.length === 0 ? (
        <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>No data yet.</Text>
      ) : (
        visibleItems.map((item) => (
          <View key={item.label} style={[styles.adminCountRow, darkMode && styles.accountDarkInsetBox, phoneLayout && styles.phoneAdminCountRow]}>
            <Text numberOfLines={1} style={[styles.adminCountLabel, darkMode && styles.accountDarkText]}>{item.label}</Text>
            <Text style={[styles.readerBookmarkCount, darkMode && styles.memoryDarkCountPill]}>{item.count}</Text>
          </View>
        ))
      )}
      {phoneLayout && safeItems.length > visibleItems.length && <Text style={[styles.adminDirectorySummary, darkMode && styles.accountDarkMutedText]}>Showing top {visibleItems.length} of {safeItems.length}.</Text>}
    </View>
  );
}

function AdminReachMap({ styles, activeUsers, selectedRegion, onSelectRegion, phoneLayout, darkMode = false }: { styles: any; activeUsers: number; selectedRegion: string; onSelectRegion: (region: string) => void; phoneLayout: boolean; darkMode?: boolean }) {
  const selected = ADMIN_REGION_PREVIEW.find((region) => region.name === selectedRegion) || ADMIN_REGION_PREVIEW[0];
  const isRegionTrackingReady = ADMIN_REGION_PREVIEW.some((region) => region.count > 0);

  return (
    <Card style={[styles.adminMapCard, darkMode && styles.accountDarkMainCard, phoneLayout && styles.phoneAdminDashboardCard]}>
      <View style={[styles.adminMapHeader, phoneLayout && styles.phoneAdminMapHeader]}>
        <View style={styles.adminMapTitleBlock}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="earth-outline" size={18} color={colors.coral} />
            <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>User reach map</Text>
          </View>
          <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>{phoneLayout ? "Broad regional insights only." : "Privacy-friendly regional insights. Exact user locations are not tracked."}</Text>
        </View>
        <View style={[styles.adminMapMetricPill, darkMode && styles.accountDarkInsetBox, phoneLayout && styles.phoneAdminMapMetricPill]}>
          <Text style={[styles.adminMapMetricValue, darkMode && styles.accountDarkTitle]}>{activeUsers}</Text>
          <Text style={[styles.adminMapMetricLabel, darkMode && styles.accountDarkMutedText]}>active 7d</Text>
        </View>
      </View>

      <View style={[styles.adminMapLayout, phoneLayout && styles.phoneAdminMapLayout]}>
        <View style={[styles.adminMapCanvas, darkMode && styles.adminDarkMapCanvas, phoneLayout && styles.phoneAdminMapCanvas]}>
          <Image source={{ uri: ADMIN_WORLD_MAP_URI }} resizeMode="contain" style={[styles.adminMapImage, phoneLayout && styles.phoneAdminMapImage]} />
          {ADMIN_REGION_PREVIEW.map((region) => (
            <Pressable
              key={region.name}
              accessibilityRole="button"
              accessibilityLabel={`${region.name} region`}
              onPress={() => onSelectRegion(region.name)}
              style={[
                styles.adminMapHotspot,
                region.size === "large" ? styles.adminMapHotspotLarge : region.size === "medium" ? styles.adminMapHotspotMedium : styles.adminMapHotspotSmall,
                phoneLayout && styles.phoneAdminMapHotspot,
                { left: `${region.x}%`, top: `${region.y}%` },
                selected.name === region.name && styles.activeAdminMapHotspot
              ]}
            >
              <Text style={styles.adminMapHotspotText}>{region.count > 0 ? region.count : "•"}</Text>
            </Pressable>
          ))}
          <View style={[styles.adminMapNote, darkMode && styles.accountDarkInsetBox, phoneLayout && styles.phoneAdminMapNote]}>
            <Ionicons name="shield-checkmark-outline" size={14} color={darkMode ? "#e9b76a" : colors.oliveDark} />
            <Text style={[styles.adminMapNoteText, darkMode && styles.accountDarkMutedText]}>Broad regions only</Text>
          </View>
        </View>

        <View style={[styles.adminMapDetailPanel, darkMode && styles.accountDarkInsetBox, phoneLayout && styles.phoneAdminMapDetailPanel]}>
          <Text style={[styles.lastCheckinLabel, darkMode && styles.studyDarkAccentText]}>{selected.name}</Text>
          <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>
            {isRegionTrackingReady
              ? `${selected.count} active user${selected.count === 1 ? "" : "s"} in this broad region.`
              : "Regional counts are not enabled yet. This panel shows where broad, privacy-safe reach data will appear."}
          </Text>
          {!phoneLayout && <View style={styles.adminMapDetailList}>
            <View style={[styles.adminMapDetailRow, darkMode && styles.accountDarkSection]}>
              <Text style={[styles.adminMapDetailLabel, darkMode && styles.accountDarkMutedText]}>Location detail</Text>
              <Text style={[styles.adminMapDetailValue, darkMode && styles.accountDarkText]}>Country/region only</Text>
            </View>
            <View style={[styles.adminMapDetailRow, darkMode && styles.accountDarkSection]}>
              <Text style={[styles.adminMapDetailLabel, darkMode && styles.accountDarkMutedText]}>Exact addresses</Text>
              <Text style={[styles.adminMapDetailValue, darkMode && styles.accountDarkText]}>Not collected</Text>
            </View>
            <View style={[styles.adminMapDetailRow, darkMode && styles.accountDarkSection]}>
              <Text style={[styles.adminMapDetailLabel, darkMode && styles.accountDarkMutedText]}>Next step</Text>
              <Text style={[styles.adminMapDetailValue, darkMode && styles.accountDarkText]}>Optional region field</Text>
            </View>
          </View>}
        </View>
      </View>
    </Card>
  );
}

function AdminFeedbackList({ styles, feedback, onMarkStatus, phoneLayout = false, darkMode = false }: { styles: any; feedback: any[]; onMarkStatus: (args: { feedbackId: any; status: string }) => Promise<unknown>; phoneLayout?: boolean; darkMode?: boolean }) {
  if (feedback.length === 0) return <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>No feedback yet.</Text>;
  const visibleFeedback = phoneLayout ? feedback.slice(0, 3) : feedback;

  return (
    <View style={styles.adminFeedbackList}>
      {visibleFeedback.map((item: any) => (
        <View key={item._id} style={[styles.adminFeedbackItem, darkMode && styles.accountDarkInsetBox, phoneLayout && styles.phoneAdminFeedbackItem]}>
          <View style={styles.journalHeader}>
            <Text style={[styles.helpFaqQuestion, darkMode && styles.accountDarkTitle]}>{item.category}</Text>
            <Text style={[styles.draftPill, darkMode && styles.plansDarkDraftPill]}>{item.status}</Text>
          </View>
          <Text style={[styles.helpFaqAnswer, darkMode && styles.accountDarkText]}>{item.message}</Text>
          <Text style={[styles.adminEventMeta, darkMode && styles.accountDarkMutedText]}>{formatAdminDate(item.createdAt)}{item.tab ? ` · ${item.tab}` : ""}</Text>
          <View style={styles.feedbackCategoryRow}>
            {["reviewed", "actioned", "ignored"].map((status) => (
              <Pressable key={status} onPress={() => onMarkStatus({ feedbackId: item._id, status }).catch(() => undefined)} style={[styles.feedbackCategoryChip, darkMode && styles.helpDarkCategoryChip]}>
                <Text style={[styles.feedbackCategoryText, darkMode && styles.homeDarkResumeButtonText]}>{status}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      {phoneLayout && feedback.length > visibleFeedback.length && <Text style={[styles.adminDirectorySummary, darkMode && styles.accountDarkMutedText]}>Showing latest {visibleFeedback.length} of {feedback.length}.</Text>}
    </View>
  );
}

function AdminUserDirectory({
  styles,
  users,
  selectedProfileId,
  maintenanceStatus,
  onSelect,
  onCleanupLocalProfiles,
  phoneLayout = false,
  darkMode = false
}: {
  styles: any;
  users: any[];
  selectedProfileId: any;
  maintenanceStatus: string;
  onSelect: (profileId: any) => void;
  onCleanupLocalProfiles: () => void;
  phoneLayout?: boolean;
  darkMode?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "signedIn" | "local" | "active" | "deletion">("all");
  const [visibleCount, setVisibleCount] = useState(15);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const haystack = [
        user.displayName,
        user.email,
        user.signedIn ? "signed in account" : "local profile",
        user.deletionStatus,
        user.profileId
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesFilter =
        filter === "all" ||
        (filter === "signedIn" && user.signedIn) ||
        (filter === "local" && !user.signedIn) ||
        (filter === "active" && user.lastActiveAt >= sevenDaysAgo) ||
        (filter === "deletion" && !!user.deletionStatus);
      return matchesSearch && matchesFilter;
    });
  }, [filter, searchTerm, sevenDaysAgo, users]);
  const visibleUsers = filteredUsers.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(15);
  }, [filter, searchTerm, users.length]);

  if (users.length === 0) return <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>No users found yet.</Text>;

  return (
    <View style={styles.adminFeedbackList}>
      <View style={[styles.adminDirectoryTools, darkMode && styles.accountDarkInsetBox]}>
        <View style={[styles.adminDirectorySearchBox, darkMode && styles.accountDarkInput]}>
          <Ionicons name="search-outline" size={17} color={colors.coral} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search name or email"
            placeholderTextColor={darkMode ? "#8f8678" : undefined}
            style={[styles.adminDirectorySearchInput, darkMode && styles.accountDarkText]}
          />
          {!!searchTerm && (
            <Pressable onPress={() => setSearchTerm("")} style={styles.clearSearchButton}>
              <Ionicons name="close-outline" size={17} color={darkMode ? "#c8bda9" : colors.muted} />
            </Pressable>
          )}
        </View>
        <View style={styles.adminDirectoryFilterRow}>
          {[
            ["all", "All"],
            ["signedIn", "Signed in"],
            ["local", "Local/test"],
            ["active", "Active 7d"],
            ["deletion", "Deletion"]
          ].map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key as typeof filter)}
              style={[styles.feedbackCategoryChip, darkMode && styles.helpDarkCategoryChip, filter === key && styles.activeFeedbackCategoryChip]}
            >
              <Text style={[styles.feedbackCategoryText, darkMode && styles.homeDarkResumeButtonText, filter === key && styles.activeFeedbackCategoryText]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.adminDirectorySummary, darkMode && styles.accountDarkMutedText]}>
          Showing {visibleUsers.length} of {filteredUsers.length} matching users · {users.length} loaded
        </Text>
        <Pressable onPress={onCleanupLocalProfiles} style={[styles.adminDirectoryShowMore, darkMode && styles.homeDarkResumeButton]}>
          <Ionicons name="sparkles-outline" size={16} color={darkMode ? "#e9b76a" : colors.oliveDark} />
          <Text style={[styles.feedbackCategoryText, darkMode && styles.homeDarkResumeButtonText]}>Clean empty local/test profiles</Text>
        </Pressable>
        {!!maintenanceStatus && <Text style={[styles.adminDirectorySummary, darkMode && styles.accountDarkMutedText]}>{maintenanceStatus}</Text>}
      </View>

      {visibleUsers.length === 0 ? (
        <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>No users match this search or filter.</Text>
      ) : visibleUsers.map((user) => (
        <Pressable
          key={user.profileId}
          onPress={() => onSelect(user.profileId)}
          style={[styles.adminUserRow, darkMode && styles.accountDarkInsetBox, phoneLayout && styles.phoneAdminUserRow, selectedProfileId === user.profileId && styles.activeAdminUserRow, darkMode && selectedProfileId === user.profileId && styles.adminDarkActiveUserRow]}
        >
          <View style={styles.journalTitleBlock}>
            <Text style={[styles.helpFaqQuestion, darkMode && styles.accountDarkTitle]}>{user.displayName || "Bible student"}</Text>
            <Text style={[styles.adminEventMeta, darkMode && styles.accountDarkMutedText]}>
              {user.email || (user.signedIn ? "Signed in" : "Local profile")} · Last active {formatAdminDate(user.lastActiveAt)}
            </Text>
          </View>
          <View style={[styles.adminUserMetaPills, phoneLayout && styles.phoneAdminUserMetaPills]}>
            {!!user.deletionStatus && <Text style={[styles.draftPill, styles.warningPill]}>Deletion</Text>}
            <Text style={[styles.draftPill, darkMode && styles.plansDarkDraftPill]}>{user.signedIn ? "Account" : "Local"}</Text>
            <Text style={[styles.readerBookmarkCount, darkMode && styles.memoryDarkCountPill]}>{user.studies}</Text>
          </View>
        </Pressable>
      ))}

      {visibleCount < filteredUsers.length && (
        <Pressable onPress={() => setVisibleCount((count) => count + 15)} style={[styles.adminDirectoryShowMore, darkMode && styles.homeDarkResumeButton]}>
          <Text style={[styles.feedbackCategoryText, darkMode && styles.homeDarkResumeButtonText]}>Show 15 more</Text>
          <Ionicons name="chevron-down-outline" size={16} color={darkMode ? "#e9b76a" : colors.oliveDark} />
        </Pressable>
      )}
    </View>
  );
}

function AdminUserDetail({ styles, MetricComponent, detail, phoneLayout = false, darkMode = false }: { styles: any; MetricComponent: MetricComponent; detail: any; phoneLayout?: boolean; darkMode?: boolean }) {
  if (detail === undefined) return <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>Choose a user to see their summary.</Text>;
  if (!detail) return <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>Choose a user to see their summary.</Text>;

  return (
    <View style={styles.adminUserDetailBox}>
      <Text style={[styles.communityTitle, darkMode && styles.accountDarkTitle]}>{detail.displayName || "Bible student"}</Text>
      <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>{detail.email || (detail.signedIn ? "Signed-in account" : "Local profile")}</Text>
      <View style={[styles.adminMetricGrid, phoneLayout && styles.phoneAdminDetailMetricGrid]}>
        <MetricComponent value={detail.counts.studies} label="studies" compact={!phoneLayout} style={darkMode && styles.accountDarkInsetBox} valueStyle={darkMode && styles.accountDarkTitle} labelStyle={darkMode && styles.accountDarkMutedText} />
        <MetricComponent value={detail.counts.memoryVerses} label="memory" compact={!phoneLayout} style={darkMode && styles.accountDarkInsetBox} valueStyle={darkMode && styles.accountDarkTitle} labelStyle={darkMode && styles.accountDarkMutedText} />
        <MetricComponent value={detail.counts.checkins} label="encouragements" compact={!phoneLayout} style={darkMode && styles.accountDarkInsetBox} valueStyle={darkMode && styles.accountDarkTitle} labelStyle={darkMode && styles.accountDarkMutedText} />
        <MetricComponent value={detail.counts.feedback} label="feedback" compact={!phoneLayout} style={darkMode && styles.accountDarkInsetBox} valueStyle={darkMode && styles.accountDarkTitle} labelStyle={darkMode && styles.accountDarkMutedText} />
      </View>
      <View style={styles.adminMapDetailList}>
        <View style={[styles.adminMapDetailRow, darkMode && styles.accountDarkInsetBox]}>
          <Text style={[styles.adminMapDetailLabel, darkMode && styles.accountDarkMutedText]}>Created</Text>
          <Text style={[styles.adminMapDetailValue, darkMode && styles.accountDarkText]}>{formatAdminDate(detail.createdAt)}</Text>
        </View>
        <View style={[styles.adminMapDetailRow, darkMode && styles.accountDarkInsetBox]}>
          <Text style={[styles.adminMapDetailLabel, darkMode && styles.accountDarkMutedText]}>Last active</Text>
          <Text style={[styles.adminMapDetailValue, darkMode && styles.accountDarkText]}>{formatAdminDate(detail.lastActiveAt)}</Text>
        </View>
        <View style={[styles.adminMapDetailRow, darkMode && styles.accountDarkInsetBox]}>
          <Text style={[styles.adminMapDetailLabel, darkMode && styles.accountDarkMutedText]}>Active sessions</Text>
          <Text style={[styles.adminMapDetailValue, darkMode && styles.accountDarkText]}>{detail.activeSessions}</Text>
        </View>
        <View style={[styles.adminMapDetailRow, darkMode && styles.accountDarkInsetBox]}>
          <Text style={[styles.adminMapDetailLabel, darkMode && styles.accountDarkMutedText]}>Deletion</Text>
          <Text style={[styles.adminMapDetailValue, darkMode && styles.accountDarkText]}>{detail.deletionStatus || "None"}</Text>
        </View>
      </View>
      <AdminMiniActivity styles={styles} title="Recent activity" items={detail.recentActivity || []} darkMode={darkMode} />
      <AdminMiniActivity styles={styles} title="Feedback history" items={detail.latestFeedback || []} darkMode={darkMode} />
    </View>
  );
}

function AdminMiniActivity({ styles, title, items, darkMode = false }: { styles: any; title: string; items: any[]; darkMode?: boolean }) {
  return (
    <View style={styles.adminMiniActivityBox}>
      <Text style={[styles.lastCheckinLabel, darkMode && styles.studyDarkAccentText]}>{title}</Text>
      {items.length === 0 ? (
        <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>No recent items.</Text>
      ) : (
        items.map((item) => (
          <View key={item._id} style={[styles.adminEventItem, darkMode && styles.accountDarkInsetBox]}>
            <Text style={[styles.helpFaqQuestion, darkMode && styles.accountDarkTitle]}>{prettyAdminEvent(item.eventType || item.category || "Activity")}</Text>
            <Text style={[styles.adminEventMeta, darkMode && styles.accountDarkMutedText]}>{formatAdminDate(item.createdAt)}{item.status ? ` · ${item.status}` : ""}{item.tab ? ` · ${item.tab}` : ""}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function AdminAuditLog({ styles, entries, phoneLayout = false, darkMode = false }: { styles: any; entries: any[]; phoneLayout?: boolean; darkMode?: boolean }) {
  if (entries.length === 0) return <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>No admin actions logged yet.</Text>;
  const visibleEntries = phoneLayout ? entries.slice(0, 4) : entries;

  return (
    <View style={[styles.adminFeedbackList, styles.adminAuditList]}>
      {visibleEntries.map((entry) => (
        <View key={entry._id} style={[styles.adminEventItem, darkMode && styles.accountDarkInsetBox, phoneLayout && styles.phoneAdminEventItem]}>
          <View style={[styles.journalHeader, styles.adminAuditHeader]}>
            <View style={styles.adminAuditTitleBlock}>
              <Text style={[styles.helpFaqQuestion, styles.adminAuditTitle, darkMode && styles.accountDarkTitle]}>{prettyAdminEvent(entry.action)}</Text>
            </View>
            <Text style={[styles.adminEventMeta, styles.adminAuditDate, darkMode && styles.accountDarkMutedText]}>{formatAdminDate(entry.createdAt)}</Text>
          </View>
          <Text style={[styles.helpFaqAnswer, styles.adminAuditDetails, darkMode && styles.accountDarkText]}>{entry.details || "Admin action"}</Text>
          {!!entry.targetEmail && <Text style={[styles.adminEventMeta, styles.adminAuditDetails, darkMode && styles.accountDarkMutedText]}>{entry.targetEmail}</Text>}
        </View>
      ))}
      {phoneLayout && entries.length > visibleEntries.length && <Text style={[styles.adminDirectorySummary, darkMode && styles.accountDarkMutedText]}>Showing latest {visibleEntries.length} of {entries.length}.</Text>}
    </View>
  );
}

function AdminDeletionRequestList({ styles, requests, pendingConfirmId, onApprove, onCancel, phoneLayout = false, darkMode = false }: { styles: any; requests: any[]; pendingConfirmId: string; onApprove: (requestId: any) => void; onCancel: (requestId: any) => void; phoneLayout?: boolean; darkMode?: boolean }) {
  if (requests.length === 0) return <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>No pending deletion requests.</Text>;

  return (
    <View style={styles.adminFeedbackList}>
      {requests.map((item: any) => (
        <View key={item._id} style={[styles.adminFeedbackItem, darkMode && styles.accountDarkInsetBox, phoneLayout && styles.phoneAdminFeedbackItem]}>
          <View style={styles.journalHeader}>
            <View style={styles.journalTitleBlock}>
              <Text style={[styles.helpFaqQuestion, darkMode && styles.accountDarkTitle]}>{item.displayName || "Bible student"}</Text>
              <Text style={[styles.adminEventMeta, darkMode && styles.accountDarkMutedText]}>{item.email || "No account email"} · {formatAdminDate(item.requestedAt)}</Text>
            </View>
            <Text style={[styles.draftPill, darkMode && styles.plansDarkDraftPill]}>Pending</Text>
          </View>
          {!!item.note && <Text style={[styles.helpFaqAnswer, darkMode && styles.accountDarkText]}>{item.note}</Text>}
          <View style={styles.feedbackCategoryRow}>
            <Pressable onPress={() => onApprove(item._id)} style={[styles.feedbackCategoryChip, darkMode && styles.helpDarkCategoryChip, pendingConfirmId === item._id && styles.dangerActionChip]}>
              <Text style={[styles.feedbackCategoryText, darkMode && styles.homeDarkResumeButtonText, pendingConfirmId === item._id && styles.dangerActionText]}>
                {pendingConfirmId === item._id ? "Confirm delete" : "Approve deletion"}
              </Text>
            </Pressable>
            <Pressable onPress={() => onCancel(item._id)} style={[styles.feedbackCategoryChip, darkMode && styles.helpDarkCategoryChip]}>
              <Text style={[styles.feedbackCategoryText, darkMode && styles.homeDarkResumeButtonText]}>Cancel request</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function AdminEventList({ styles, events, phoneLayout = false, darkMode = false }: { styles: any; events: AdminStats["recentEvents"]; phoneLayout?: boolean; darkMode?: boolean }) {
  if (events.length === 0) return <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>No recent activity yet.</Text>;
  const visibleEvents = phoneLayout ? events.slice(0, 4) : events;

  return (
    <View style={styles.adminFeedbackList}>
      {visibleEvents.map((event) => (
        <View key={event._id} style={[styles.adminEventItem, darkMode && styles.accountDarkInsetBox, phoneLayout && styles.phoneAdminEventItem]}>
          <View style={styles.journalHeader}>
            <Text style={[styles.helpFaqQuestion, darkMode && styles.accountDarkTitle]}>{prettyAdminEvent(event.eventType)}</Text>
            <Text style={[styles.adminEventMeta, darkMode && styles.accountDarkMutedText]}>{formatAdminDate(event.createdAt)}</Text>
          </View>
          <Text style={[styles.helpFaqAnswer, darkMode && styles.accountDarkText]}>{event.reference || event.methodName || event.tab || "App activity"}</Text>
        </View>
      ))}
      {phoneLayout && events.length > visibleEvents.length && <Text style={[styles.adminDirectorySummary, darkMode && styles.accountDarkMutedText]}>Showing latest {visibleEvents.length} of {events.length}.</Text>}
    </View>
  );
}

function prettyAdminEvent(eventType: string) {
  return eventType
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAdminDate(value?: number) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

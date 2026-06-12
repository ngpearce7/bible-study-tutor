import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { Text, View } from "react-native";
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

type CountListComponent = (props: { title: string; items?: { label: string; count: number }[]; phoneLayout?: boolean; darkMode?: boolean }) => React.ReactNode;
type MetricComponent = (props: { value: number; label: string; compact?: boolean; style?: any; valueStyle?: any; labelStyle?: any; labelLines?: number }) => React.ReactNode;

export const AdminDashboard = memo(function AdminDashboard({
  adminStats,
  adminUsers,
  adminUserDetail,
  adminAuditLog,
  pendingConfirmId,
  selectedProfileId,
  selectedRegion,
  compactLayout,
  phoneLayout,
  darkMode,
  styles,
  AdminAuditLogComponent,
  AdminCountListComponent,
  AdminDeletionRequestListComponent,
  AdminEventListComponent,
  AdminFeedbackListComponent,
  AdminReachMapComponent,
  AdminUserDetailComponent,
  AdminUserDirectoryComponent,
  MetricComponent,
  onApproveDeletion,
  onCancelDeletion,
  onMarkFeedbackStatus,
  onOpenAccount,
  onSelectProfile,
  onSelectRegion
}: {
  adminStats: AdminStats | null;
  adminUsers: any[];
  adminUserDetail: any;
  adminAuditLog: any[];
  pendingConfirmId: string;
  selectedProfileId: any;
  selectedRegion: string;
  compactLayout: boolean;
  phoneLayout: boolean;
  darkMode: boolean;
  styles: any;
  AdminAuditLogComponent: (props: { entries: any[]; phoneLayout?: boolean; darkMode?: boolean }) => React.ReactNode;
  AdminCountListComponent: CountListComponent;
  AdminDeletionRequestListComponent: (props: { requests: any[]; pendingConfirmId: string; onApprove: (requestId: any) => void; onCancel: (requestId: any) => void; phoneLayout?: boolean; darkMode?: boolean }) => React.ReactNode;
  AdminEventListComponent: (props: { events: AdminStats["recentEvents"]; phoneLayout?: boolean; darkMode?: boolean }) => React.ReactNode;
  AdminFeedbackListComponent: (props: { feedback: any[]; onMarkStatus: (args: { feedbackId: any; status: string }) => Promise<unknown>; phoneLayout?: boolean; darkMode?: boolean }) => React.ReactNode;
  AdminReachMapComponent: (props: { activeUsers: number; selectedRegion: string; onSelectRegion: (region: string) => void; phoneLayout: boolean; darkMode?: boolean }) => React.ReactNode;
  AdminUserDetailComponent: (props: { detail: any; phoneLayout?: boolean; darkMode?: boolean }) => React.ReactNode;
  AdminUserDirectoryComponent: (props: { users: any[]; selectedProfileId: any; onSelect: (profileId: any) => void; phoneLayout?: boolean; darkMode?: boolean }) => React.ReactNode;
  MetricComponent: MetricComponent;
  onApproveDeletion: (requestId: any) => void;
  onCancelDeletion: (requestId: any) => void;
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
        <AdminDeletionRequestListComponent requests={adminStats.deletionRequests} pendingConfirmId={pendingConfirmId} onApprove={onApproveDeletion} onCancel={onCancelDeletion} phoneLayout={phoneLayout} darkMode={darkMode} />
      </Card>

      <View style={[styles.adminSectionGrid, compactLayout && styles.stackedLayout, phoneLayout && styles.phoneAdminSectionGrid]}>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="people-outline" size={18} color={colors.coral} />
            <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>User directory</Text>
          </View>
          <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>A privacy-safe list of profiles, account status, and activity counts.</Text>
          <AdminUserDirectoryComponent users={adminUsers} selectedProfileId={selectedProfileId} onSelect={onSelectProfile} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="person-circle-outline" size={18} color={colors.coral} />
            <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>User summary</Text>
          </View>
          <AdminUserDetailComponent detail={adminUserDetail} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
      </View>

      <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
        <View style={styles.feedbackHeader}>
          <Ionicons name="receipt-outline" size={18} color={colors.coral} />
          <Text style={[styles.feedbackTitle, darkMode && styles.accountDarkTitle]}>Admin audit log</Text>
        </View>
        <Text style={[styles.helpIntro, darkMode && styles.accountDarkMutedText]}>{phoneLayout ? "Recent sensitive admin actions." : "Tracks sensitive admin actions such as deletion approvals and feedback status changes."}</Text>
        <AdminAuditLogComponent entries={adminAuditLog} phoneLayout={phoneLayout} darkMode={darkMode} />
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

      <AdminReachMapComponent activeUsers={adminStats.totals.activeProfiles7d} selectedRegion={selectedRegion} onSelectRegion={onSelectRegion} phoneLayout={phoneLayout} darkMode={darkMode} />

      <View style={[styles.adminSectionGrid, compactLayout && styles.stackedLayout, phoneLayout && styles.phoneAdminSectionGrid]}>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountListComponent title="Top bookmarked verses" items={adminStats.topBookmarked} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountListComponent title="Top memory verses" items={adminStats.topMemory} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountListComponent title="Top study methods" items={adminStats.topMethods} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountListComponent title="Bible searches" items={adminStats.topSearches} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountListComponent title="App shares" items={adminStats.shareSources || []} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
      </View>

      <View style={[styles.adminSectionGrid, compactLayout && styles.stackedLayout, phoneLayout && styles.phoneAdminSectionGrid]}>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountListComponent title="Activity breakdown" items={adminStats.eventBreakdown} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <AdminCountListComponent title="Feedback categories" items={adminStats.feedbackByCategory} phoneLayout={phoneLayout} darkMode={darkMode} />
          <AdminCountListComponent title="Feedback status" items={adminStats.feedbackByStatus} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
      </View>

      <View style={[styles.adminSectionGrid, compactLayout && styles.stackedLayout, phoneLayout && styles.phoneAdminSectionGrid]}>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <Text style={[styles.lastCheckinLabel, darkMode && styles.studyDarkAccentText]}>Latest feedback</Text>
          <AdminFeedbackListComponent feedback={adminStats.recentFeedback} onMarkStatus={onMarkFeedbackStatus} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
        <Card style={[styles.adminDashboardCard, phoneLayout && styles.phoneAdminDashboardCard, darkMode && styles.accountDarkMainCard]}>
          <Text style={[styles.lastCheckinLabel, darkMode && styles.studyDarkAccentText]}>Recent activity</Text>
          <AdminEventListComponent events={adminStats.recentEvents} phoneLayout={phoneLayout} darkMode={darkMode} />
        </Card>
      </View>
    </View>
  );
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, TextInput, View } from "react-native";

import { AppButton, Card, Eyebrow, colors } from "@/components/ui";

export function CommunityTab(props: any) {
  const {
    styles,
    compactLayout,
    phoneLayout,
    communitySubView,
    setCommunitySubView,
    communityDarkMode,
    firstName,
    toggleRememberedPanel,
    setMobileFriendsPanelOpen,
    friendPanelSummary,
    mobileFriendsPanelOpen,
    showFriendsConnectionPanel,
    COMMUNITY_CIRCLES_ENABLED,
    isAuthenticated,
    myFriendCode,
    copyFriendCode,
    setFriendToolsOpen,
    friendToolsOpen,
    friendCodeInput,
    setFriendCodeInput,
    inviteFriendWithCode,
    friendEmail,
    setFriendEmail,
    inviteFriend,
    acceptedCommunityFriends,
    selectedFriendId,
    setSelectedFriendId,
    setPendingFriendRemoveId,
    pendingCommunityFriendInvites,
    acceptFriendInvite,
    removeFriend,
    pendingFriendRemoveId,
    managedCommunityFriend,
    friendStatus,
    setTab,
    setMobileCirclesPanelOpen,
    circlePanelSummary,
    mobileCirclesPanelOpen,
    showCirclesConnectionPanel,
    communityCircles,
    selectedCircleId,
    setSelectedCircleId,
    setPendingCircleDeleteId,
    copyCircleInviteCode,
    deleteCircle,
    pendingCircleDeleteId,
    pendingCircleLeaveId,
    setPendingCircleLeaveId,
    leaveCircle,
    circleStatus,
    setCircleManagerOpen,
    circleManagerOpen,
    circleName,
    setCircleName,
    createCircle,
    circleInviteCode,
    setCircleInviteCode,
    joinCircle,
    communityTargetPickerOpen,
    setCommunityTargetPickerOpen,
    activeCommunityTargetName,
    communityTargetType,
    targetFriendIds,
    setTargetFriendIds,
    setCommunityTargetType,
    setTargetCircleId,
    targetCircleId,
    hasAvailableCommunityTarget,
    friendlyName,
    checkinNote,
    setCheckinNote,
    communityMessage,
    isSavingCheckin,
    persistCheckin,
    communityStatus,
    communityHistoryFilter,
    setCommunityHistoryFilter,
    communityHistoryCircleId,
    setCommunityHistoryCircleId,
    communityHistoryCircleOptions,
    communityHistoryGroups,
    visibleCheckins,
    checkins,
    recentCheckinsExpanded,
    setRecentCheckinsExpanded,
    communityReactionOverrides,
    pendingCheckinDeleteId,
    editingCommunityPostId,
    editingRecentCheckinId,
    editCommunityPostNote,
    editRecentCheckinNote,
    isSavingCommunityPostEdit,
    isSavingRecentCheckinEdit,
    focusedCommunityItemId,
    setFocusedCommunityItemId,
    setEditCommunityPostNote,
    setEditRecentCheckinNote,
    toggleCommunityReaction,
    saveCommunityPostEdit,
    saveRecentCheckinEdit,
    cancelEditCommunityPost,
    cancelEditRecentCheckin,
    copyPastCheckinMessage,
    startEditCommunityPost,
    startEditRecentCheckin,
    deleteCommunityPost,
    deleteRecentCheckin
  } = props;

  function renderCommunityHistoryItem(item: any) {
    const sharedTo = Array.isArray(item.sharedTo) ? item.sharedTo : [];
    const itemIsPost = item.itemType === "communityPost";
    const canEditItem = !itemIsPost || item.canEdit !== false;
    const reactionPostId = item.sharedPostId || sharedTo.find((destination: any) => destination.postId)?.postId || (itemIsPost ? item._id : undefined);
    const reactionOverride = reactionPostId ? communityReactionOverrides[String(reactionPostId)] : undefined;
    const reactionCounts = reactionOverride?.reactions || item.reactions || {};
    const myReactions = reactionOverride?.myReactions || (Array.isArray(item.myReactions) ? item.myReactions : []);
    const reactionOptions = [
      { key: "amen", label: "Amen", symbol: "🙌", count: reactionCounts.amen || 0 },
      { key: "praying", label: "Praying", symbol: "🙏", count: reactionCounts.praying || 0 }
    ] as const;
    const destinationText = sharedTo.length > 0
      ? `Shared to ${sharedTo.map((destination: any) => destination.circleName || destination.friendName).filter(Boolean).join(", ")}`
      : itemIsPost ? "Shared post" : "Private encouragement";
    const deletePending = !itemIsPost && pendingCheckinDeleteId === item._id;
    const itemIsEditing = itemIsPost ? editingCommunityPostId === item._id : editingRecentCheckinId === item._id;
    const editValue = itemIsPost ? editCommunityPostNote : editRecentCheckinNote;
    const saveBusy = itemIsPost ? isSavingCommunityPostEdit : isSavingRecentCheckinEdit;
    const itemLabel = itemIsPost ? item.mood || "study insight" : item.mood === "check-in" ? "encouragement" : item.mood || "encouragement";
    const focusedItem = String(focusedCommunityItemId) === String(item._id);
    const showActionRow = focusedItem || itemIsEditing || deletePending;
    const authorText = item.authorLabel || "";
    const itemMeta = [
      new Date(item.createdAt).toLocaleDateString(),
      authorText,
      destinationText,
      item.passageReference
    ].filter(Boolean).join(" · ");

    return (
      <Pressable
        key={item._id}
        onPress={() => {
          if (!itemIsEditing) setFocusedCommunityItemId((current: string) => String(current) === String(item._id) ? "" : String(item._id));
        }}
        style={[styles.checkinHistoryItem, communityDarkMode && styles.accountDarkInsetBox, focusedItem && styles.focusedCheckinHistoryItem, communityDarkMode && focusedItem && styles.accountDarkSection, phoneLayout && styles.phoneCheckinHistoryItem]}
        accessibilityRole="button"
        accessibilityLabel={showActionRow ? "Hide post actions" : "Show post actions"}
      >
        <View style={styles.checkinHistoryHeader}>
          <View style={styles.checkinHistoryMeta}>
            <View style={styles.checkinTitleRow}>
              <Text style={[styles.checkinMood, communityDarkMode && styles.accountDarkTitle]}>{itemLabel}</Text>
            </View>
            <Text style={[styles.checkinDestinationText, communityDarkMode && styles.accountDarkMutedText]}>{itemMeta}</Text>
          </View>
        </View>
        {itemIsEditing ? (
          <TextInput
            value={editValue}
            onChangeText={itemIsPost ? setEditCommunityPostNote : setEditRecentCheckinNote}
            multiline
            placeholderTextColor={communityDarkMode ? "#8f8678" : undefined}
            style={[styles.input, styles.checkinEditInput, communityDarkMode && styles.accountDarkInput]}
          />
        ) : (
          <Text style={[styles.lastCheckinText, communityDarkMode && styles.accountDarkText]}>{item.note || "No note added."}</Text>
        )}
        {(reactionPostId && !itemIsEditing) || showActionRow ? (
          <View style={[styles.communityPostFooterRow, phoneLayout && styles.phoneCommunityPostFooterRow]}>
            {reactionPostId && !itemIsEditing ? (
              <View style={styles.circleReactionRow}>
                {reactionOptions.map((reaction) => {
                  const active = myReactions.includes(reaction.key);
                  return (
                    <Pressable
                      key={reaction.key}
                      onPress={(event) => {
                        event.stopPropagation?.();
                        toggleCommunityReaction(reactionPostId, reaction.key, reactionCounts, myReactions);
                      }}
                      style={[styles.circleReactionChip, communityDarkMode && styles.accountDarkSection, active && styles.activeCircleReactionChip]}
                      accessibilityLabel={`${reaction.label} reaction`}
                    >
                      <Text style={styles.circleReactionSymbol}>{reaction.symbol}</Text>
                      {reaction.count > 0 && (
                        <Text style={[styles.circleReactionText, communityDarkMode && styles.accountDarkMutedText, active && styles.activeCircleReactionText]}>{reaction.count}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ) : <View />}
            {showActionRow && <View style={[styles.checkinActionRow, phoneLayout && styles.phoneCheckinActionRow]}>
              {itemIsEditing && canEditItem ? (
                <>
                  <Pressable
                    onPress={() => itemIsPost ? saveCommunityPostEdit(item) : saveRecentCheckinEdit(item)}
                    style={[styles.checkinIconButton, styles.checkinSaveIconButton]}
                    accessibilityLabel={itemIsPost ? "Save shared post changes" : "Save encouragement changes"}
                  >
                    <Ionicons name={saveBusy ? "hourglass-outline" : "checkmark-outline"} size={16} color="white" />
                  </Pressable>
                  <Pressable onPress={itemIsPost ? cancelEditCommunityPost : cancelEditRecentCheckin} style={[styles.checkinIconButton, communityDarkMode && styles.homeDarkIconBubble]} accessibilityLabel="Cancel edit">
                    <Ionicons name="close-outline" size={16} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable onPress={() => copyPastCheckinMessage(item)} style={[styles.checkinIconButton, communityDarkMode && styles.homeDarkIconBubble]} accessibilityLabel={itemIsPost ? "Copy shared post" : "Copy encouragement"}>
                    <Ionicons name="copy-outline" size={16} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                  </Pressable>
                  {canEditItem && (
                    <>
                      <Pressable onPress={() => itemIsPost ? startEditCommunityPost(item) : startEditRecentCheckin(item)} style={[styles.checkinIconButton, communityDarkMode && styles.homeDarkIconBubble]} accessibilityLabel={itemIsPost ? "Edit shared post" : "Edit encouragement"}>
                        <Ionicons name="create-outline" size={16} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                      </Pressable>
                      <Pressable
                        onPress={() => itemIsPost ? deleteCommunityPost(item._id) : deleteRecentCheckin(item)}
                        style={[styles.checkinIconButton, styles.checkinDeleteIconButton, deletePending && styles.pendingDeleteButton]}
                        accessibilityLabel={deletePending ? "Confirm delete encouragement" : itemIsPost ? "Remove shared post" : "Remove encouragement"}
                      >
                        <Ionicons name={deletePending ? "alert-circle-outline" : "trash-outline"} size={16} color={colors.coral} />
                      </Pressable>
                    </>
                  )}
                </>
              )}
            </View>}
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <View style={[styles.layout, compactLayout && styles.stackedLayout, communitySubView === "history" && styles.focusLayout, communityDarkMode && styles.accountDarkLayout]}>
      <Card style={[styles.mainCard, compactLayout && styles.fluidCard, communitySubView === "history" && styles.focusMainCard, communityDarkMode && styles.accountDarkMainCard]}>
        <Eyebrow>Community</Eyebrow>
        <Text style={[styles.title, communityDarkMode && styles.accountDarkTitle]}>{firstName ? `${firstName}, share encouragement` : "Share encouragement"}</Text>
        <Text style={[styles.titleSupport, communityDarkMode && styles.accountDarkMutedText]}>Community only opens through registered friends or private circles. No public feed, no open posting.</Text>
        <View style={[styles.communitySubViewTabs, communityDarkMode && styles.accountDarkSegmentedRow]}>
          {[
            ["encourage", "Encourage"],
            ["history", "History"]
          ].map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setCommunitySubView(key as "encourage" | "history")}
              style={[styles.communitySubViewTab, communitySubView === key && styles.activeCommunitySubViewTab]}
            >
              <Text style={[styles.communitySubViewTabText, communityDarkMode && styles.accountDarkMutedText, communitySubView === key && styles.activeCommunitySubViewTabText]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {communitySubView === "encourage" ? (
          <>
        <View style={[styles.communityConnectionGrid, phoneLayout && styles.phoneCommunityConnectionGrid]}>
        <View style={[styles.communityCircleBox, styles.communityConnectionPanel, communityDarkMode && styles.accountDarkSection, phoneLayout && styles.phoneCommunityConnectionPanel]}>
          <Pressable
            disabled={!phoneLayout}
            onPress={() => toggleRememberedPanel(setMobileFriendsPanelOpen, "communityFriendsPanelOpen")}
            style={[styles.feedbackHeader, phoneLayout && styles.mobileCommunityPanelHeader]}
          >
            <View style={styles.mobileCommunityPanelTitleRow}>
              <Ionicons name="person-add-outline" size={18} color={colors.coral} />
              <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Friends</Text>
            </View>
            {phoneLayout && (
              <View style={styles.mobileCommunityPanelSummaryRow}>
                <Text numberOfLines={1} style={[styles.mobileCommunityPanelSummary, communityDarkMode && styles.accountDarkMutedText]}>{friendPanelSummary}</Text>
                <Ionicons name={mobileFriendsPanelOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
              </View>
            )}
          </Pressable>
          {showFriendsConnectionPanel && (
            <>
              <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>
                Friends are registered Bible Study Tutor users you personally add by code or email. Share your code privately with someone you trust, then encourage one another without a public feed.
              </Text>
              {COMMUNITY_CIRCLES_ENABLED && isAuthenticated ? (
                <>
              <View style={[styles.circleManagementBox, communityDarkMode && styles.accountDarkInsetBox, phoneLayout && styles.phoneCircleManagementBox]}>
                <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Your friend code</Text>
                <View style={[styles.circleChip, communityDarkMode && styles.accountDarkSection]}>
                  <View style={[styles.circleInviteLine, phoneLayout && styles.phoneCircleInviteLine]}>
                    <Text style={[styles.circleInviteCodeText, communityDarkMode && styles.accountDarkTitle]}>{myFriendCode || "Loading..."}</Text>
                    <Pressable onPress={copyFriendCode} style={[styles.circleCopyButton, communityDarkMode && styles.homeDarkResumeButton]}>
                      <Ionicons name="copy-outline" size={13} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                      <Text style={[styles.circleCopyText, communityDarkMode && styles.homeDarkResumeButtonText]}>Copy</Text>
                    </Pressable>
                  </View>
                  <Text style={[styles.circleChipMeta, communityDarkMode && styles.accountDarkMutedText]}>Share this code privately so another registered user can add you as a friend.</Text>
                </View>
                <Pressable onPress={() => toggleRememberedPanel(setFriendToolsOpen, "communityFriendToolsOpen")} style={[styles.circleManagerToggle, communityDarkMode && styles.homeDarkResumeButton]}>
                  <Ionicons name="person-add-outline" size={14} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                  <Text style={[styles.circleManageText, communityDarkMode && styles.homeDarkResumeButtonText]}>{friendToolsOpen ? "Hide friend tools" : "Add or invite"}</Text>
                  <Ionicons name={friendToolsOpen ? "chevron-up-outline" : "chevron-down-outline"} size={15} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                </Pressable>
                {friendToolsOpen && (
                  <View style={styles.circleManagementContent}>
                    <View style={[styles.circleActionGrid, phoneLayout && styles.phoneCircleActionGrid]}>
                      <View style={[styles.circleActionBox, communityDarkMode && styles.accountDarkSection, phoneLayout && styles.phoneCircleActionBox]}>
                        <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Add by friend code</Text>
                        <TextInput
                          value={friendCodeInput}
                          onChangeText={(value) => setFriendCodeInput(value.toUpperCase())}
                          placeholder="Friend code"
                          autoCapitalize="characters"
                          placeholderTextColor={communityDarkMode ? "#8f8678" : undefined}
                          style={[styles.input, communityDarkMode && styles.accountDarkInput, phoneLayout && styles.phoneCommunityInput]}
                        />
                        <AppButton label="Add by code" variant="secondary" onPress={inviteFriendWithCode} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                      </View>
                      <View style={[styles.circleActionBox, communityDarkMode && styles.accountDarkSection, phoneLayout && styles.phoneCircleActionBox]}>
                        <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Add by email</Text>
                        <TextInput
                          value={friendEmail}
                          onChangeText={setFriendEmail}
                          placeholder="Friend's account email"
                          autoCapitalize="none"
                          keyboardType="email-address"
                          placeholderTextColor={communityDarkMode ? "#8f8678" : undefined}
                          style={[styles.input, communityDarkMode && styles.accountDarkInput, phoneLayout && styles.phoneCommunityInput]}
                        />
                        <AppButton label="Send invite" variant="secondary" onPress={inviteFriend} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                      </View>
                    </View>
                  </View>
                )}
              </View>
              {acceptedCommunityFriends.length > 0 ? (
                <View style={[styles.circleSelectorPanel, communityDarkMode && styles.accountDarkInsetBox]}>
                  <View style={styles.circleSelectorHeader}>
                    <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Your friends</Text>
                    <Text style={[styles.circleCountText, communityDarkMode && styles.accountDarkMutedText]}>{acceptedCommunityFriends.length} accepted</Text>
                  </View>
                  <View style={styles.circleList}>
                    {acceptedCommunityFriends.map((friend: any) => {
                      const friendIsSelected = String(selectedFriendId) === String(friend._id);
                      return (
                        <Pressable
                          key={friend._id}
                          onPress={() => {
                            setSelectedFriendId(friend._id);
                            setPendingFriendRemoveId(null);
                          }}
                          style={[styles.circleChip, communityDarkMode && styles.accountDarkSection, friendIsSelected && styles.activeCircleChip]}
                        >
                          <Text style={[styles.circleChipTitle, communityDarkMode && styles.accountDarkTitle, friendIsSelected && styles.activeCircleChipText]}>{friend.name}</Text>
                          <Text style={[styles.circleChipMeta, communityDarkMode && styles.accountDarkMutedText, friendIsSelected && styles.activeCircleChipText]}>
                            {friendIsSelected ? "Selected for management" : "Tap to manage"}{friend.email ? ` · ${friend.email}` : ""}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={[styles.emptyCommunityBox, communityDarkMode && styles.accountDarkInsetBox]}>
                  <Text style={[styles.communityTitle, communityDarkMode && styles.accountDarkTitle]}>No accepted friends yet</Text>
                  <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>Invite a registered user by email, or accept an invite below.</Text>
                </View>
              )}
              {pendingCommunityFriendInvites.length > 0 && (
                <View style={[styles.circleSelectorPanel, communityDarkMode && styles.accountDarkInsetBox]}>
                  <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Pending friend invites</Text>
                  <View style={styles.circleList}>
                    {pendingCommunityFriendInvites.map((friend: any) => (
                      <View key={friend._id} style={[styles.circleChip, communityDarkMode && styles.accountDarkSection]}>
                        <Text style={[styles.circleChipTitle, communityDarkMode && styles.accountDarkTitle]}>{friend.name}</Text>
                        <Text style={[styles.circleChipMeta, communityDarkMode && styles.accountDarkMutedText]}>
                          {friend.direction === "received" ? "Waiting for you to accept" : "Invite sent"}{friend.email ? ` · ${friend.email}` : ""}
                        </Text>
                        <View style={styles.circleManagementRow}>
                          {friend.direction === "received" && (
                            <Pressable onPress={() => acceptFriendInvite(friend)} style={[styles.circleManageButton, communityDarkMode && styles.homeDarkResumeButton]}>
                              <Text style={[styles.circleManageText, communityDarkMode && styles.homeDarkResumeButtonText]}>Accept</Text>
                            </Pressable>
                          )}
                          <Pressable
                            onPress={() => removeFriend(friend)}
                            style={[styles.circleManageButton, styles.circleDangerManageButton, pendingFriendRemoveId === friend._id && styles.activeCircleDangerManageButton]}
                          >
                            <Text style={[styles.circleManageText, styles.circleDangerManageText, pendingFriendRemoveId === friend._id && styles.activeCircleDangerManageText]}>
                              {pendingFriendRemoveId === friend._id ? "Confirm remove" : friend.direction === "received" ? "Decline" : "Cancel"}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {!!managedCommunityFriend && (
                <Pressable
                  onPress={() => removeFriend(managedCommunityFriend)}
                  style={[styles.circleManageButton, styles.circleDangerManageButton, pendingFriendRemoveId === managedCommunityFriend._id && styles.activeCircleDangerManageButton]}
                >
                  <Text style={[styles.circleManageText, styles.circleDangerManageText, pendingFriendRemoveId === managedCommunityFriend._id && styles.activeCircleDangerManageText]}>
                    {pendingFriendRemoveId === managedCommunityFriend._id ? "Confirm remove friend" : `Remove ${managedCommunityFriend.name}`}
                  </Text>
                </Pressable>
              )}
              {!!friendStatus && <Text style={[styles.saveStatus, communityDarkMode && styles.accountDarkMutedText]}>{friendStatus}</Text>}
                </>
              ) : COMMUNITY_CIRCLES_ENABLED ? (
                <AppButton label="Open account" variant="secondary" onPress={() => setTab("account")} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
              ) : (
                <Text style={[styles.saveStatus, communityDarkMode && styles.accountDarkMutedText]}>Friends will be enabled after the backend is ready.</Text>
              )}
            </>
          )}
        </View>
        <View style={[styles.communityCircleBox, styles.communityConnectionPanel, communityDarkMode && styles.accountDarkSection, phoneLayout && styles.phoneCommunityConnectionPanel]}>
          <Pressable
            disabled={!phoneLayout}
            onPress={() => toggleRememberedPanel(setMobileCirclesPanelOpen, "communityCirclesPanelOpen")}
            style={[styles.feedbackHeader, phoneLayout && styles.mobileCommunityPanelHeader]}
          >
            <View style={styles.mobileCommunityPanelTitleRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.coral} />
              <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Private circle</Text>
            </View>
            {phoneLayout && (
              <View style={styles.mobileCommunityPanelSummaryRow}>
                <Text numberOfLines={1} style={[styles.mobileCommunityPanelSummary, communityDarkMode && styles.accountDarkMutedText]}>{circlePanelSummary}</Text>
                <Ionicons name={mobileCirclesPanelOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
              </View>
            )}
          </Pressable>
          {showCirclesConnectionPanel && (
            <>
              <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>
              {COMMUNITY_CIRCLES_ENABLED
                ? isAuthenticated
                  ? "A circle is a small, invite-only group for people you trust. Share a study thought, prayer point, or simple encouragement so you can encourage one another to keep drawing near to God."
                  : "Sign in to create or join a small private circle where trusted people can share study thoughts, prayer points, and encouragement."
                : "Private circles are being prepared and will be enabled after the backend is ready."}
              </Text>
              {COMMUNITY_CIRCLES_ENABLED && isAuthenticated ? (
                <>
              {(communityCircles || []).length > 0 && (
                <View style={[styles.circleSelectorPanel, communityDarkMode && styles.accountDarkInsetBox]}>
                  <View style={styles.circleSelectorHeader}>
                    <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Your circles</Text>
                    <Text style={[styles.circleCountText, communityDarkMode && styles.accountDarkMutedText]}>{(communityCircles || []).length} saved</Text>
                  </View>
                  <View style={styles.circleList}>
                    {(communityCircles || []).map((circle: any) => {
                      const circleIsSelected = String(selectedCircleId) === String(circle._id);
                      return (
                        <View key={circle._id} style={[styles.circleChip, communityDarkMode && styles.accountDarkSection, circleIsSelected && styles.activeCircleChip]}>
                          <Pressable
                            onPress={() => {
                              setSelectedCircleId(circleIsSelected ? null : circle._id);
                              setPendingCircleDeleteId(null);
                              setPendingCircleLeaveId(null);
                            }}
                            style={styles.circleChipHeader}
                          >
                            <View style={styles.journalTitleBlock}>
                              <Text style={[styles.circleChipTitle, communityDarkMode && styles.accountDarkTitle, circleIsSelected && styles.activeCircleChipText]}>{circle.name}</Text>
                              <Text style={[styles.circleChipMeta, communityDarkMode && styles.accountDarkMutedText, circleIsSelected && styles.activeCircleChipText]}>
                                {circleIsSelected ? "Managing this circle" : "Tap to manage"} · {circle.memberCount} member{circle.memberCount === 1 ? "" : "s"} · {circle.canDelete ? "Owner" : "Member"}
                              </Text>
                            </View>
                            <Ionicons name={circleIsSelected ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={communityDarkMode && !circleIsSelected ? "#e9b76a" : colors.oliveDark} />
                          </Pressable>
                          {circleIsSelected && (
                            <View style={styles.circleInlineManagement}>
                              <View style={[styles.circleInviteLine, phoneLayout && styles.phoneCircleInviteLine]}>
                                <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Invite code</Text>
                                <Text style={[styles.circleInviteCodeText, communityDarkMode && styles.accountDarkTitle]}>{circle.inviteCode}</Text>
                              </View>
                              <View style={styles.circleManagementRow}>
                                <Pressable onPress={() => copyCircleInviteCode(circle.inviteCode)} style={[styles.circleCopyButton, communityDarkMode && styles.homeDarkResumeButton]}>
                                  <Ionicons name="copy-outline" size={14} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                                  <Text style={[styles.circleCopyText, communityDarkMode && styles.homeDarkResumeButtonText]}>Copy invite</Text>
                                </Pressable>
                                {circle.canDelete ? (
                                  <Pressable
                                    onPress={() => deleteCircle(circle)}
                                    style={[styles.circleManageButton, styles.circleDangerManageButton, pendingCircleDeleteId === circle._id && styles.activeCircleDangerManageButton]}
                                  >
                                    <Text style={[styles.circleManageText, styles.circleDangerManageText, pendingCircleDeleteId === circle._id && styles.activeCircleDangerManageText]}>
                                      {pendingCircleDeleteId === circle._id ? "Confirm delete" : "Delete circle"}
                                    </Text>
                                  </Pressable>
                                ) : (
                                  <Pressable
                                    onPress={() => leaveCircle(circle)}
                                    style={[styles.circleManageButton, pendingCircleLeaveId === circle._id && styles.activeCircleManageButton]}
                                  >
                                    <Text style={[styles.circleManageText, pendingCircleLeaveId === circle._id && styles.activeCircleManageText]}>
                                      {pendingCircleLeaveId === circle._id ? "Confirm leave" : "Leave circle"}
                                    </Text>
                                  </Pressable>
                                )}
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
              {(communityCircles || []).length === 0 && (
                <View style={[styles.emptyCommunityBox, communityDarkMode && styles.accountDarkInsetBox]}>
                  <Text style={[styles.communityTitle, communityDarkMode && styles.accountDarkTitle]}>No private circles yet</Text>
                  <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>Create one or join with an invite code when you are ready.</Text>
                </View>
              )}
              <View style={[styles.circleManagementBox, communityDarkMode && styles.accountDarkInsetBox, phoneLayout && styles.phoneCircleManagementBox]}>
                <Pressable onPress={() => toggleRememberedPanel(setCircleManagerOpen, "communityCircleToolsOpen")} style={[styles.circleManagerToggle, communityDarkMode && styles.homeDarkResumeButton]}>
                  <Ionicons name="settings-outline" size={14} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                  <Text style={[styles.circleManageText, communityDarkMode && styles.homeDarkResumeButtonText]}>{circleManagerOpen || (communityCircles || []).length === 0 ? "Hide circle tools" : "Create or join"}</Text>
                  <Ionicons name={circleManagerOpen || (communityCircles || []).length === 0 ? "chevron-up-outline" : "chevron-down-outline"} size={15} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
                </Pressable>
                {(circleManagerOpen || (communityCircles || []).length === 0) && (
                  <View style={styles.circleManagementContent}>
                    <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Create or join a circle</Text>
                    <View style={[styles.circleActionGrid, phoneLayout && styles.phoneCircleActionGrid]}>
                      <View style={[styles.circleActionBox, communityDarkMode && styles.accountDarkSection, phoneLayout && styles.phoneCircleActionBox]}>
                        <Text style={[styles.lastCheckinLabel, communityDarkMode && styles.studyDarkAccentText]}>Create</Text>
                        <TextInput value={circleName} onChangeText={setCircleName} placeholder="Circle name" placeholderTextColor={communityDarkMode ? "#8f8678" : undefined} style={[styles.input, communityDarkMode && styles.accountDarkInput, phoneLayout && styles.phoneCommunityInput]} />
                        <AppButton label="Create circle" variant="secondary" onPress={createCircle} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                      </View>
                      <View style={[styles.circleActionBox, communityDarkMode && styles.accountDarkSection, phoneLayout && styles.phoneCircleActionBox]}>
                        <Text style={[styles.lastCheckinLabel, communityDarkMode && styles.studyDarkAccentText]}>Join</Text>
                        <TextInput value={circleInviteCode} onChangeText={(value) => setCircleInviteCode(value.toUpperCase())} placeholder="Invite code" placeholderTextColor={communityDarkMode ? "#8f8678" : undefined} autoCapitalize="characters" style={[styles.input, communityDarkMode && styles.accountDarkInput, phoneLayout && styles.phoneCommunityInput]} />
                        <AppButton label="Join circle" variant="secondary" onPress={joinCircle} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
                      </View>
                    </View>
                  </View>
                )}
                {!!circleStatus && <Text style={[styles.saveStatus, communityDarkMode && styles.accountDarkMutedText]}>{circleStatus}</Text>}
                </View>
                </>
              ) : COMMUNITY_CIRCLES_ENABLED ? (
                <AppButton label="Open account" variant="secondary" onPress={() => setTab("account")} style={phoneLayout && styles.phoneFullWidthButton} labelStyle={phoneLayout && styles.phoneCommunityButtonLabel} />
              ) : (
                <Text style={[styles.saveStatus, communityDarkMode && styles.accountDarkMutedText]}>Encouragements still save privately and can be copied or sent as before.</Text>
              )}
            </>
          )}
        </View>
        </View>
        <View style={[styles.communityStepBlock, phoneLayout && styles.phoneCommunityStepBlock]}>
          <View style={styles.communityStepHeader}>
            <View style={styles.communityStepBadge}>
              <Text style={styles.communityStepBadgeText}>1</Text>
            </View>
            <View style={styles.journalTitleBlock}>
              <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Choose a friend or circle</Text>
            </View>
          </View>
          {hasAvailableCommunityTarget ? (
            <>
              <Pressable onPress={() => setCommunityTargetPickerOpen((open: boolean) => !open)} style={[styles.communityTargetSelect, communityDarkMode && styles.accountDarkInsetBox]}>
                <View style={styles.communityTargetSelectTextBlock}>
                  <Text style={[styles.communityRecipientText, communityDarkMode && styles.accountDarkTitle]}>{activeCommunityTargetName || "Choose a connection"}</Text>
                </View>
                <Ionicons name={communityTargetPickerOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
              </Pressable>
              {communityTargetPickerOpen && (
                <View style={[styles.communityTargetPickerPanel, communityDarkMode && styles.accountDarkInsetBox]}>
                  {acceptedCommunityFriends.length > 0 && (
                    <View style={styles.communityTargetPickerGroup}>
                      <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Friends - select one or more</Text>
                      {acceptedCommunityFriends.map((friend: any) => {
                        const isTarget = communityTargetType === "friend" && targetFriendIds.some((id: any) => String(id) === String(friend._id));
                        return (
                          <Pressable
                            key={friend._id}
                            onPress={() => {
                              setCommunityTargetType("friend");
                              setTargetFriendIds((current: any[]) => {
                                const alreadySelected = current.some((id: any) => String(id) === String(friend._id));
                                return alreadySelected ? current.filter((id: any) => String(id) !== String(friend._id)) : [...current, friend._id];
                              });
                            }}
                            style={[styles.communityTargetOption, communityDarkMode && styles.accountDarkSection, isTarget && styles.activeCommunityTargetOption]}
                          >
                            <Ionicons name={isTarget ? "checkmark-circle-outline" : "ellipse-outline"} size={16} color={communityDarkMode && !isTarget ? "#e9b76a" : colors.oliveDark} />
                            <View style={styles.journalTitleBlock}>
                              <Text style={[styles.communityTargetOptionTitle, communityDarkMode && styles.accountDarkTitle]}>{friend.name}</Text>
                              {!!friend.email && <Text style={[styles.circleChipMeta, communityDarkMode && styles.accountDarkMutedText]}>{friend.email}</Text>}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                  {(communityCircles || []).length > 0 && (
                    <View style={styles.communityTargetPickerGroup}>
                      <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>Circles</Text>
                      {(communityCircles || []).map((circle: any) => {
                        const isTarget = communityTargetType === "circle" && String(targetCircleId) === String(circle._id);
                        return (
                          <Pressable
                            key={circle._id}
                            onPress={() => {
                              setCommunityTargetType("circle");
                              setTargetCircleId(circle._id);
                              setCommunityTargetPickerOpen(false);
                            }}
                            style={[styles.communityTargetOption, communityDarkMode && styles.accountDarkSection, isTarget && styles.activeCommunityTargetOption]}
                          >
                            <Ionicons name={isTarget ? "checkmark-circle-outline" : "people-outline"} size={16} color={communityDarkMode && !isTarget ? "#e9b76a" : colors.oliveDark} />
                            <View style={styles.journalTitleBlock}>
                              <Text style={[styles.communityTargetOptionTitle, communityDarkMode && styles.accountDarkTitle]}>{circle.name}</Text>
                              <Text style={[styles.circleChipMeta, communityDarkMode && styles.accountDarkMutedText]}>
                                {circle.memberCount} member{circle.memberCount === 1 ? "" : "s"}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
              <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>
                {communityTargetType === "circle"
                  ? "Saving can post this encouragement to the selected circle."
                  : "Saving can post this encouragement to your selected friend or friends."}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.communityRecipientText, communityDarkMode && styles.accountDarkTitle]}>No friend or circle selected</Text>
              <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>{`${friendlyName}, add a registered friend or join a private circle above.`}</Text>
            </>
          )}
        </View>
        <View style={styles.communityStepHeader}>
          <View style={styles.communityStepBadge}>
            <Text style={styles.communityStepBadgeText}>2</Text>
          </View>
          <View style={styles.journalTitleBlock}>
            <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Write one honest update</Text>
          </View>
        </View>
        <TextInput
          multiline
          value={checkinNote}
          onChangeText={setCheckinNote}
          placeholder="Example: I studied Psalm 23 and was reminded that God leads me one step at a time."
          placeholderTextColor={communityDarkMode ? "#8f8678" : undefined}
          style={[styles.input, styles.textarea, communityDarkMode && styles.accountDarkInput, phoneLayout && styles.phoneCheckinTextarea]}
        />
        <View style={[styles.communityStepBlock, phoneLayout && styles.phoneCommunityStepBlock]}>
          <View style={styles.communityStepHeader}>
            <View style={styles.communityStepBadge}>
              <Text style={styles.communityStepBadgeText}>3</Text>
            </View>
            <View style={styles.journalTitleBlock}>
              <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Post encouragement</Text>
            </View>
          </View>
          <Text style={[styles.shareMessageText, communityDarkMode && styles.accountDarkText, phoneLayout && styles.phoneShareMessageText]}>{communityMessage}</Text>
          <AppButton
            label={isSavingCheckin ? "Posting..." : "Post"}
            onPress={persistCheckin}
            style={phoneLayout && styles.phoneFullWidthButton}
            labelStyle={phoneLayout && styles.phoneCommunityButtonLabel}
          />
          {!!communityStatus && <Text style={[styles.saveStatus, communityDarkMode && styles.accountDarkMutedText]}>{communityStatus}</Text>}
        </View>
          </>
        ) : (
          <View style={[styles.communityHistoryPanel, communityDarkMode && styles.accountDarkSection]}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="albums-outline" size={18} color={colors.coral} />
              <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Encouragement history</Text>
            </View>
            <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>Review, edit, copy, or remove your saved encouragements. Circle posts stay grouped by where they were shared.</Text>
            <View style={styles.communityHistoryFilterRow}>
              {[
                ["all", "All"],
                ["private", "Private"],
                ["circles", "Circles"]
              ].map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => {
                    setCommunityHistoryFilter(key as "all" | "private" | "circles");
                    if (key !== "circles") setCommunityHistoryCircleId("all");
                  }}
                  style={[styles.filterChip, communityDarkMode && styles.printDarkOptionChip, communityHistoryFilter === key && styles.activeFilterChip]}
                >
                  <Text style={[styles.filterText, communityDarkMode && styles.accountDarkMutedText, communityHistoryFilter === key && styles.activeFilterText]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            {communityHistoryFilter === "circles" && communityHistoryCircleOptions.length > 1 && (
              <View style={styles.communityHistoryFilterRow}>
                <Pressable
                  onPress={() => setCommunityHistoryCircleId("all")}
                  style={[styles.filterChip, communityDarkMode && styles.printDarkOptionChip, communityHistoryCircleId === "all" && styles.activeFilterChip]}
                >
                  <Text style={[styles.filterText, communityDarkMode && styles.accountDarkMutedText, communityHistoryCircleId === "all" && styles.activeFilterText]}>All circles</Text>
                </Pressable>
                    {communityHistoryCircleOptions.map((circle: any) => (
                  <Pressable
                    key={circle.circleId}
                    onPress={() => setCommunityHistoryCircleId(circle.circleId)}
                    style={[styles.filterChip, communityDarkMode && styles.printDarkOptionChip, communityHistoryCircleId === circle.circleId && styles.activeFilterChip]}
                  >
                    <Text style={[styles.filterText, communityDarkMode && styles.accountDarkMutedText, communityHistoryCircleId === circle.circleId && styles.activeFilterText]}>{circle.circleName}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {communityHistoryGroups.length === 0 ? (
              <View style={[styles.emptyCommunityBox, communityDarkMode && styles.accountDarkInsetBox]}>
                <Text style={[styles.communityTitle, communityDarkMode && styles.accountDarkTitle]}>No posts found</Text>
                <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>Try another filter, or post a new encouragement or study insight.</Text>
              </View>
            ) : (
              <View style={styles.communityHistoryGroupList}>
                    {communityHistoryGroups.map((group: any) => (
                  <View key={group.title} style={[styles.communityHistoryGroup, communityDarkMode && styles.accountDarkInsetBox]}>
                    <View style={styles.circleSelectorHeader}>
                      <Text style={[styles.circleManagementLabel, communityDarkMode && styles.studyDarkAccentText]}>{group.title}</Text>
                      <Text style={[styles.circleCountText, communityDarkMode && styles.accountDarkMutedText]}>{group.items.length}</Text>
                    </View>
                    <View style={styles.circleList}>
                      {group.items.map((item: any) => renderCommunityHistoryItem(item))}
                    </View>
                  </View>
                ))}
              </View>
            )}
            {!!communityStatus && <Text style={[styles.saveStatus, communityDarkMode && styles.accountDarkMutedText]}>{communityStatus}</Text>}
          </View>
        )}
      </Card>

      {communitySubView !== "history" && <Card style={[styles.coachCard, compactLayout && styles.fluidCard, communityDarkMode && styles.accountDarkMainCard]}>
        <View style={[styles.communityGoalBox, communityDarkMode && styles.accountDarkSection]}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.coral} />
            <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Community boundary</Text>
          </View>
          <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>Community is intentionally limited to accepted friends and invite-only circles. It is not a public timeline or open messaging system.</Text>
        </View>
        <View style={styles.communityDivider} />
        <View style={styles.feedbackHeader}>
          <Ionicons name="time-outline" size={18} color={colors.coral} />
            <Text style={[styles.feedbackTitle, communityDarkMode && styles.accountDarkTitle]}>Recent encouragements</Text>
        </View>
        {(checkins || []).length === 0 ? (
          <View style={[styles.emptyCommunityBox, communityDarkMode && styles.accountDarkInsetBox]}>
            <Text style={[styles.communityTitle, communityDarkMode && styles.accountDarkTitle]}>No encouragements yet</Text>
            <Text style={[styles.helpIntro, communityDarkMode && styles.accountDarkMutedText]}>{`After your next study, ${friendlyName}, save one sentence here and keep the rhythm visible.`}</Text>
          </View>
        ) : (
          <>
            {visibleCheckins.map((item: any) => renderCommunityHistoryItem(item))}
            {(checkins || []).length > 3 && (
              <Pressable onPress={() => toggleRememberedPanel(setRecentCheckinsExpanded, "communityRecentExpanded")} style={[styles.communityShowMoreButton, communityDarkMode && styles.homeDarkResumeButton]}>
                <Text style={[styles.communityShowMoreText, communityDarkMode && styles.homeDarkResumeButtonText]}>{recentCheckinsExpanded ? "Show latest 3" : `Show more (${(checkins || []).length - 3})`}</Text>
                <Ionicons name={recentCheckinsExpanded ? "chevron-up-outline" : "chevron-down-outline"} size={14} color={communityDarkMode ? "#e9b76a" : colors.oliveDark} />
              </Pressable>
            )}
          </>
        )}
      </Card>}
    </View>

  );
}

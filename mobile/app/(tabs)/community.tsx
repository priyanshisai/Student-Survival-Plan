import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { AppCard } from "@/components/AppCard";
import { AppScreen } from "@/components/AppScreen";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TabSwitch } from "@/components/TabSwitch";
import { colors } from "@/theme/colors";
import {
  getCampusLocations,
  getMyGroups,
  getStudyGroups,
  joinStudyGroup,
  leaveStudyGroup,
  updateLocationStatus,
} from "@/features/community/services/community";
import { getTodayLeaderboard } from "@/features/leaderboard/services/leaderboard";

type CommunityGroup = {
  id: string;
  name: string;
  description: string | null;
  createdBy: string | null;
  memberCount: number;
  createdAt: string;
};

type MyGroup = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  joinedAt: string;
};

type LeaderboardEntry = {
  rank: number;
  name: string;
  points: number;
  userId: string;
};

type CampusLocation = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  isOpen: boolean;
  avgRating: number;
  reviewCount: number;
};

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState("groups");
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [myGroups, setMyGroups] = useState<MyGroup[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadCommunity() {
    try {
      setError(null);
      const [groupList, mine, board, spots] = await Promise.all([
        getStudyGroups(search || undefined),
        getMyGroups(),
        getTodayLeaderboard(10),
        getCampusLocations(),
      ]);

      setGroups(groupList);
      setMyGroups(mine);
      setLeaderboard(board);
      setLocations(spots);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load community");
    }
  }

  useEffect(() => {
    void loadCommunity();
  }, [search]);

  async function handleJoin(groupId: string) {
    try {
      await joinStudyGroup(groupId);
      await loadCommunity();
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Failed to join group");
    }
  }

  async function handleLeave(groupId: string) {
    try {
      await leaveStudyGroup(groupId);
      await loadCommunity();
    } catch (leaveError) {
      setError(leaveError instanceof Error ? leaveError.message : "Failed to leave group");
    }
  }

  async function handleSpotToggle(locationId: string, isOpen: boolean) {
    try {
      await updateLocationStatus(locationId, !isOpen);
      await loadCommunity();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Failed to update location");
    }
  }

  const myGroupIds = new Set(myGroups.map((group) => group.id));
  const stickyIndex = error ? 2 : 1;

  return (
    <AppScreen
      title="Community"
      subtitle="The tab rail stays pinned while the community feed scrolls below."
      rightSlot={<PrimaryButton label="Create" onPress={() => router.push("/community/create-group")} />}
      stickyHeaderIndices={[stickyIndex]}
    >
      {error ? (
        <AppCard>
          <Text style={styles.errorText}>{error}</Text>
        </AppCard>
      ) : null}

      <View style={styles.stickyShell}>
        <TabSwitch
          activeKey={activeTab}
          items={[
            { key: "groups", label: "General" },
            { key: "leaderboard", label: "Fest Updates" },
            { key: "spots", label: "Academic" },
          ]}
          onChange={setActiveTab}
        />
      </View>

      {activeTab === "groups" ? (
        <>
          <AppCard>
            <Text style={styles.cardTitle}>Search groups</Text>
            <TextInput
              onChangeText={setSearch}
              placeholder="Search by name"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              value={search}
            />
          </AppCard>

          {groups.map((group) => {
            const isMember = myGroupIds.has(group.id);
            return (
              <AppCard key={group.id}>
                <View style={styles.rowBetween}>
                  <Text style={styles.groupTitle}>{group.name}</Text>
                  <Text style={styles.groupMeta}>{group.memberCount} members</Text>
                </View>
                <Text style={styles.groupMeta}>by {group.createdBy ?? "Unknown"}</Text>
                <Text style={styles.groupDescription}>{group.description || "No description yet."}</Text>
                <PrimaryButton
                  label={isMember ? "Leave group" : "Join group"}
                  onPress={() => (isMember ? handleLeave(group.id) : handleJoin(group.id))}
                  variant={isMember ? "soft" : "solid"}
                />
              </AppCard>
            );
          })}
        </>
      ) : null}

      {activeTab === "leaderboard" ? (
        <AppCard>
          <Text style={styles.cardTitle}>Community champions</Text>
          {leaderboard.map((entry) => (
            <View key={entry.userId} style={styles.rankRow}>
              <Text style={styles.rank}>{entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}</Text>
              <View style={styles.rowMeta}>
                <Text style={styles.groupTitle}>{entry.name}</Text>
                <Text style={styles.groupMeta}>{entry.points} points</Text>
              </View>
            </View>
          ))}
        </AppCard>
      ) : null}

      {activeTab === "spots" ? (
        <>
          {locations.map((location) => (
            <AppCard key={location.id}>
              <View style={styles.rowBetween}>
                <Text style={styles.groupTitle}>{location.name}</Text>
                <View style={[styles.openPill, location.isOpen ? styles.openPillOn : styles.openPillOff]}>
                  <Text style={styles.openPillText}>{location.isOpen ? "Open" : "Closed"}</Text>
                </View>
              </View>
              <Text style={styles.groupMeta}>
                {location.type} • {location.reviewCount} reviews
              </Text>
              <Text style={styles.groupDescription}>{location.description || "No description yet."}</Text>
              <PrimaryButton
                label={location.isOpen ? "Mark closed" : "Mark open"}
                onPress={() => handleSpotToggle(location.id, location.isOpen)}
                variant="soft"
              />
            </AppCard>
          ))}
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: colors.danger,
    fontWeight: "600",
  },
  stickyShell: {
    backgroundColor: colors.background,
    paddingBottom: 8,
    zIndex: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: "#020617",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardTitle: {
    color: colors.textDark,
    fontSize: 20,
    fontWeight: "800",
  },
  searchInput: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    color: colors.text,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    backgroundColor: colors.cardMuted,
    padding: 12,
  },
  rank: {
    width: 48,
    color: colors.text,
    fontWeight: "800",
    textAlign: "center",
  },
  rowMeta: {
    flex: 1,
    gap: 4,
  },
  groupTitle: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: "700",
  },
  groupMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  groupDescription: {
    color: colors.textDark,
    lineHeight: 20,
  },
  openPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  openPillOn: {
    backgroundColor: "rgba(34, 197, 94, 0.16)",
  },
  openPillOff: {
    backgroundColor: "rgba(251, 113, 133, 0.16)",
  },
  openPillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
});

import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";

import { AppCard } from "@/components/AppCard";
import { AppScreen } from "@/components/AppScreen";
import { Field } from "@/components/Field";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors } from "@/theme/colors";
import { moods } from "@/constants/moods";
import { helpOptions } from "@/constants/help-options";
import { createMoodCheckIn, getTodaysMood } from "@/features/mood/services/mood";
import { getTodayLeaderboard, getUserStats } from "@/features/leaderboard/services/leaderboard";
import { getProfile } from "@/features/profile/services/profile";
import { getTodoStats } from "@/features/todos/services/todos";

type LeaderboardEntry = {
  rank: number;
  name: string;
  points: number;
  userId: string;
};

type UserStats = {
  totalPoints: number;
  todayPoints: number;
  tasksCompleted: number;
  streak: number;
};

const moodDetails: Record<string, string> = {
  Stressed: "Heavy day. Pick one small win and keep it simple.",
  Tired: "Low battery mode is allowed. Protect your energy.",
  Great: "Ride the momentum and lock in your best work.",
  Good: "Steady and clear. This is a good day to make progress.",
  Okay: "Nothing dramatic. Keep the day light and structured.",
  Low: "Take the pace down and ask for help if needed.",
  Sad: "Be gentle with yourself today. Tiny steps still count.",
  IDK: "Fair. Start with the easiest task and let the day unfold.",
};

const helpEmojis: Record<(typeof helpOptions)[number]["id"], string> = {
  item: "🎒",
  wtf: "🌀",
  prof: "🧑‍🏫",
  advice: "☕",
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodNote, setMoodNote] = useState("");
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [todoStats, setTodoStats] = useState({ completed: 0, total: 0 });
  const [userName, setUserName] = useState("Student");

  const cardWidth = Math.min(116, width * 0.26);
  const gap = 12;
  const snapInterval = cardWidth + gap;
  const sidePadding = Math.max(16, (width - cardWidth) / 2);

  async function loadData() {
    try {
      setError(null);
      const [todaysMood, board, stats, todos, profile] = await Promise.all([
        getTodaysMood(),
        getTodayLeaderboard(5),
        getUserStats(),
        getTodoStats(),
        getProfile(),
      ]);

      setAlreadyCheckedIn(Boolean(todaysMood));
      setSelectedMood(todaysMood?.label ?? null);
      setLeaderboard(board);
      setUserStats(stats);
      setTodoStats(todos);
      setUserName(profile?.name?.split(" ")[0] || "Student");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load home data");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleMoodSubmit() {
    if (!selectedMood || alreadyCheckedIn || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createMoodCheckIn(selectedMood, moodNote || undefined);
      setMoodNote("");
      await loadData();
    } catch (submitError) {
      console.error("Mood submit error:", submitError);
      setError(submitError instanceof Error ? submitError.message : "Failed to check in");
    }finally {
      setSubmitting(false);
    }
  }

  return (
    <AppScreen title={`Hi, ${userName}`} subtitle="A softer student dashboard with daily momentum, help, and people.">
      {error ? (
        <AppCard>
          <Text style={styles.errorText}>{error}</Text>
        </AppCard>
      ) : null}

      <AppCard>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.eyebrow}>Mood check-in</Text>
            <Text style={styles.cardTitle}>How are you feeling today?</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{alreadyCheckedIn ? "Saved" : "Open"}</Text>
          </View>
        </View>

        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.moodRail, { paddingHorizontal: sidePadding }]}
          snapToInterval={snapInterval}
          snapToAlignment="center"
          decelerationRate="fast"
          disableIntervalMomentum
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
        >
          {moods.map((mood, index) => {
            const inputRange = [(index - 1) * snapInterval, index * snapInterval, (index + 1) * snapInterval];
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: "clamp",
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.55, 1, 0.55],
              extrapolate: "clamp",
            });
            const translateY = scrollX.interpolate({
              inputRange,
              outputRange: [10, -6, 10],
              extrapolate: "clamp",
            });
            const active = selectedMood === mood.label;

            return (
              <Pressable key={mood.label} onPress={() => setSelectedMood(mood.label)}>
                <Animated.View
                  style={[
                    styles.moodButton,
                    active && styles.moodButtonActive,
                    { width: cardWidth, opacity, transform: [{ scale }, { translateY }] },
                  ]}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>{mood.label}</Text>
                </Animated.View>
              </Pressable>
            );
          })}
        </Animated.ScrollView>

        <View style={styles.moodNoteCard}>
          <Text style={styles.moodNoteTitle}>{selectedMood ?? "Pick a mood"}</Text>
          <Text style={styles.moodNoteBody}>
            {selectedMood ? moodDetails[selectedMood] : "Scroll the emoji rail and keep the center card selected."}
          </Text>
        </View>

        <Field
          label="Add a note"
          multiline
          onChangeText={setMoodNote}
          placeholder="What is driving today’s mood?"
          value={moodNote}
        />
        <PrimaryButton
          disabled={!selectedMood || alreadyCheckedIn || submitting}
          label={alreadyCheckedIn ? "Already checked in" : submitting ? "Checking in..." : "Check in"}
          onPress={handleMoodSubmit}
        />
      </AppCard>

      <View style={styles.glanceRow}>
        <AppCard style={styles.glanceCard}>
          <Text style={styles.statValue}>{userStats?.todayPoints ?? 0}</Text>
          <Text style={styles.statLabel}>Points today</Text>
        </AppCard>
        <AppCard style={styles.glanceCard}>
          <Text style={styles.statValue}>
            {todoStats.completed}/{todoStats.total}
          </Text>
          <Text style={styles.statLabel}>Tasks done</Text>
        </AppCard>
        <AppCard style={styles.glanceCard}>
          <Text style={styles.statValue}>{userStats?.streak ?? 0}</Text>
          <Text style={styles.statLabel}>Day streak</Text>
        </AppCard>
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Need help?</Text>
        <View style={styles.helpGrid}>
          {helpOptions.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => router.push({ pathname: "/help/request", params: { type: option.id } })}
              style={styles.helpCard}
            >
              <Text style={styles.helpEmoji}>{helpEmojis[option.id]}</Text>
              <Text style={styles.helpTitle}>{option.title}</Text>
              <Text style={styles.helpDescription}>{option.description}</Text>
            </Pressable>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Most productive today</Text>
        {leaderboard.length === 0 ? (
          <Text style={styles.emptyText}>No activity yet today.</Text>
        ) : (
          leaderboard.map((entry) => (
            <View key={entry.userId} style={styles.leaderboardRow}>
              <Text style={styles.rankText}>{entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}</Text>
              <View style={styles.leaderboardMeta}>
                <Text style={styles.leaderboardName}>{entry.name}</Text>
                <Text style={styles.leaderboardPoints}>{entry.points} points</Text>
              </View>
            </View>
          ))
        )}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: colors.danger,
    fontWeight: "600",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: colors.textDark,
    fontSize: 20,
    fontWeight: "800",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  moodRail: {
    gap: 12,
    alignItems: "center",
  },
  moodButton: {
    minHeight: 126,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 10,
  },
  moodButtonActive: {
    backgroundColor: "rgba(56, 189, 248, 0.18)",
    borderColor: "rgba(95, 219, 255, 0.38)",
  },
  moodEmoji: {
    fontSize: 34,
  },
  moodLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  moodLabelActive: {
    color: colors.text,
  },
  moodNoteCard: {
    borderRadius: 18,
    backgroundColor: colors.cardMuted,
    padding: 14,
    gap: 4,
  },
  moodNoteTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  moodNoteBody: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  glanceRow: {
    flexDirection: "row",
    gap: 10,
  },
  glanceCard: {
    flex: 1,
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  helpGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  helpCard: {
    width: "48%",
    borderRadius: 20,
    padding: 14,
    backgroundColor: colors.cardMuted,
    gap: 8,
  },
  helpEmoji: {
    fontSize: 24,
  },
  helpTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  helpDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    color: colors.textMuted,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    backgroundColor: colors.cardMuted,
    padding: 12,
  },
  rankText: {
    width: 48,
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  leaderboardMeta: {
    flex: 1,
    gap: 4,
  },
  leaderboardName: {
    color: colors.text,
    fontWeight: "700",
  },
  leaderboardPoints: {
    color: colors.textMuted,
    fontSize: 13,
  },
});

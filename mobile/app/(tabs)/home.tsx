import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View, } from "react-native";
import { router } from "expo-router";

import { AnimatedEmoji } from '@/components/AnimatedEmoji';
import { AppCard } from "@/components/AppCard";
import { AppScreen } from "@/components/AppScreen";
import { Field } from "@/components/Field";
import { PrimaryButton } from "@/components/PrimaryButton";
import { moods } from "@/constants/moods";
import { helpOptions } from "@/constants/help-options";
import { createMoodCheckIn, getTodaysMood } from "@/features/mood/services/mood";
import { getTodayLeaderboard, getUserStats } from "@/features/leaderboard/services/leaderboard";
import { getProfile } from "@/features/profile/services/profile";
import { getTodoStats } from "@/features/todos/services/todos";
import GrainBackground from '@/components/GrainBackground';
import BlinkingCursor from '@/components/BlinkingCursor';
import { useTypewriter } from '@/hooks/useTypewriter';

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

const helpEmojis: Record<string, string> = {
  item: "🎒",
  wtf: "🌀",
  prof: "🧑‍🏫",
  advice: "☕",
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

function useTypewriter(text: string, speed = 70) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);

  return displayed;
}

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

  const cardWidth = Math.min(100, width * 0.22);
  const gap = 10;
  const snapInterval = cardWidth + gap;
  const sidePadding = Math.max(16, (width - cardWidth) / 2);

  const fullGreeting = `${getGreeting()}, ${userName}! Have a good day!!`;

  const hour = new Date().getHours();
  const timeGreeting =
      hour < 12 ? 'Good Morning' :
          hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const texts = [
    `${timeGreeting}, ${userName}! Have a good day!!`,
    'Welcome back! Ready to learn?',
    'Let\'s build something amazing!',
  ];

  const displayed = useTypewriter(texts, 80, 40, 2000, true);

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
    if (!selectedMood || alreadyCheckedIn || submitting) return;
    try {
      setSubmitting(true);
      setError(null);
      await createMoodCheckIn(selectedMood, moodNote || undefined);
      setMoodNote("");
      await loadData();
    } catch (submitError) {
      console.error("Mood submit error:", submitError);
      setError(submitError instanceof Error ? submitError.message : "Failed to check in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
      <AppScreen title={`Good morning, ${userName} 👋`} subtitle="Here's your daily snapshot.">
        {error ? (
            <AppCard>
              <Text style={styles.errorText}>{error}</Text>
            </AppCard>
        ) : null}

        <View style={styles.greetingCard}>
          <GrainBackground />
          <View style={styles.greetingRow}>
            <Text style={styles.greetingText}>{displayed}</Text>
            <BlinkingCursor color="#fff" />
          </View>
        </View>

        {/* Your Progress */}
        <View style={styles.glanceRow}>
          <AppCard style={styles.glanceCard}>
            <Text style={styles.statValue}>{userStats?.todayPoints ?? 0}</Text>
            <Text style={styles.statLabel}>Points today</Text>
          </AppCard>
          <AppCard style={styles.glanceCard}>
            <Text style={styles.statValue}>{todoStats.completed}/{todoStats.total}</Text>
            <Text style={styles.statLabel}>Tasks done</Text>
          </AppCard>
          <AppCard style={styles.glanceCard}>
            <Text style={styles.statValue}>{userStats?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </AppCard>
        </View>

        {/* Mood check-in */}
        <AppCard>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.eyebrow}>Daily check-in</Text>
              <Text style={styles.cardTitle}>How are you feeling?</Text>
            </View>
            <View style={[styles.statusPill, alreadyCheckedIn && styles.statusPillDone]}>
              <Text style={[styles.statusText, alreadyCheckedIn && styles.statusTextDone]}>
                {alreadyCheckedIn ? "✓ Done" : "Open"}
              </Text>
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
              onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
          >
            {moods.map((mood, index) => {
              const inputRange = [
                (index - 1) * snapInterval,
                index * snapInterval,
                (index + 1) * snapInterval,
              ];
              const scale = scrollX.interpolate({ inputRange, outputRange: [0.82, 1.15, 0.82], extrapolate: "clamp" });
              const opacity = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: "clamp" });
              const translateY = scrollX.interpolate({ inputRange, outputRange: [8, -4, 8], extrapolate: "clamp" });
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
                      <AnimatedEmoji
                          uri={mood.lottie}
                          size={40}
                          loop={true}
                          autoPlay={active}
                          fallback={mood.emoji}
                      />
                      <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>
                        {mood.label}
                      </Text>
                    </Animated.View>
                  </Pressable>
              );
            })}
          </Animated.ScrollView>

          {selectedMood ? (
              <View style={styles.moodNoteCard}>
                <Text style={styles.moodNoteTitle}>{selectedMood}</Text>
                <Text style={styles.moodNoteBody}>{moodDetails[selectedMood]}</Text>
              </View>
          ) : null}

          <Field
              label="Add a note"
              multiline
              onChangeText={setMoodNote}
              placeholder="What's driving today's mood?"
              value={moodNote}
          />
          <PrimaryButton
              disabled={!selectedMood || alreadyCheckedIn || submitting}
              label={alreadyCheckedIn ? "Already checked in" : submitting ? "Checking in..." : "Check In"}
              onPress={handleMoodSubmit}
          />
        </AppCard>

        {/* ✅ Need Help */}
        <AppCard style={{ gap: 0 }} >
          <Text style={styles.cardTitle}>Need Help?</Text>
          <View style={styles.helpGrid}>
            {helpOptions.map((option) => (
                <Pressable
                    key={option.id}
                    onPress={() => router.push({ pathname: "/help/request", params: { type: option.id } })}
                    style={styles.helpCard}
                >
                  <View style={styles.helpIconCircle}>
                    <Text style={styles.helpEmoji}>{option.emoji}</Text>
                  </View>
                  <Text style={styles.helpTitle}>{option.title}</Text>
                  <Text style={styles.helpDescription}>{option.description}</Text>
                </Pressable>
            ))}
          </View>
        </AppCard>

        {/* Leaderboard */}
        <AppCard>
          <Text style={styles.cardTitle}>Most Productive Today</Text>
          {leaderboard.length === 0 ? (
              <Text style={styles.emptyText}>No activity yet today. Be the first!</Text>
          ) : (
              leaderboard.map((entry) => (
                  <View key={entry.userId} style={styles.leaderboardRow}>
                    <Text style={styles.rankText}>
                      {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                    </Text>
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

  greetingCard: {
    margin: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(156,163,175,0.4)',
    borderRadius: 24,
    backgroundColor: 'rgba(55,65,81,0.3)',
    overflow: 'hidden',
    minHeight: 80,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  greetingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
    minHeight: 60,
  },

  errorText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 13,
  },

  // Glance row
  glanceRow: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: 'rgba(55, 65, 81, 0.7)'
  },
  glanceCard: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#7c3aed",
    fontSize: 26,
    fontWeight: "800",
  },
  statLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

  // Card header
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    color: "#7c3aed",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  cardTitle: {
    color: "#1e1b4b",
    fontSize: 18,
    fontWeight: "800",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statusPillDone: {
    backgroundColor: "#ede9fe",
    borderColor: "#c4b5fd",
  },
  statusText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  statusTextDone: {
    color: "#7c3aed",
  },

  // Mood rail
  moodRail: {
    gap: 10,
    alignItems: "center",
    paddingVertical: 8,
  },
  moodButton: {
    minHeight: 110,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    gap: 8,
  },
  moodButtonActive: {
    backgroundColor: "#ede9fe",
    borderColor: "#7c3aed",
  },
  moodEmoji: {
    fontSize: 30,
  },
  moodLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  moodLabelActive: {
    color: "#7c3aed",
  },

  // Mood note
  moodNoteCard: {
    borderRadius: 14,
    backgroundColor: "#f5f3ff",
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: "#ede9fe",
  },
  moodNoteTitle: {
    color: "#4c1d95",
    fontSize: 15,
    fontWeight: "700",
  },
  moodNoteBody: {
    color: "#6d28d9",
    lineHeight: 20,
    fontSize: 13,
  },

  // Help
  helpGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  helpCard: {
    width: "48%",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  helpIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  helpEmoji: {
    fontSize: 22,
  },
  helpTitle: {
    color: "#1e1b4b",
    fontWeight: "700",
    fontSize: 13,
  },
  helpDescription: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 17,
  },

  // Leaderboard
  emptyText: {
    color: "#94a3b8",
    fontSize: 13,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  rankText: {
    width: 40,
    color: "#1e1b4b",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  leaderboardMeta: {
    flex: 1,
    gap: 2,
  },
  leaderboardName: {
    color: "#1e1b4b",
    fontWeight: "700",
    fontSize: 14,
  },
  leaderboardPoints: {
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: "600",
  },
});


import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AppScreen } from "@/components/AppScreen";
import { getMoodHistory } from "@/features/mood/services/mood";
import {
  getDailyRecap,
  getMyBlogs,
  getProfile,
  getProfileStats,
  updateUserBio,
} from "@/features/profile/services/profile";
import { getUserStats } from "@/features/leaderboard/services/leaderboard";

type ProfileData = { name?: string | null; email?: string | null; bio?: string | null; interests?: string[] };
type MoodEntry = { id: string; label: string; note?: string; created_at: string };
type DailyRecap = { tasksCompleted: number; totalTasks: number; pointsEarned: number; mood: string | null; activities: { title: string; category: string; time?: string; completed?: boolean }[] };
type BlogPost = { id: string; title: string; content: string; created_at: string };

const moodEmojis: Record<string, string> = {
  Stressed: "😤", Tired: "😴", Great: "😁", Good: "😊",
  Okay: "😐", Low: "😕", Sad: "😢", IDK: "🦉",
};

const TABS = [
  { key: "about",  emoji: "👤", label: "About" },
  { key: "mood",   emoji: "📊", label: "Mood" },
  { key: "recap",  emoji: "📅", label: "Your Day" },
  { key: "blogs",  emoji: "📝", label: "Blogs" },
];

const INTERESTS = ["Web Development", "Machine Learning", "Photography", "Gaming", "Music"];

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState("about");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [recap, setRecap] = useState<DailyRecap | null>(null);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [bio, setBio] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setError(null);
      const [profileData, statsData, moodData, recapData, blogData] = await Promise.all([
        getProfile(),
        getUserStats(),
        getMoodHistory(),
        getDailyRecap(),
        getMyBlogs(),
      ]);
      setProfile(profileData);
      setStats(statsData);
      setHistory(moodData as MoodEntry[]);
      setRecap(recapData as DailyRecap);
      setBlogs(blogData as BlogPost[]);
      setBio(profileData?.bio ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    }
  }

  useEffect(() => { void loadData(); }, []);

  async function handleSaveBio() {
    try {
      setSaving(true);
      await updateUserBio(bio);
      setEditing(false);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save bio");
    } finally {
      setSaving(false);
    }
  }

  const initials = (profile?.name ?? "S").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
      <AppScreen title="" subtitle="">
        {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
        ) : null}

        {/* Profile Header Card */}
        <View style={styles.headerCard}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <LinearGradient colors={["#818cf8", "#a855f7"]} style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <View style={styles.cameraBtn}>
              <Text style={{ fontSize: 12 }}>📷</Text>
            </View>
          </View>

          {/* Name */}
          <Text style={styles.name}>{profile?.name ?? "Student"}</Text>

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🔥 {stats?.streak ?? 0} day streak</Text>
            </View>
            <View style={[styles.badge, styles.badgePurple]}>
              <Text style={[styles.badgeText, styles.badgePurpleText]}>🏆 Top 10%</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{stats?.totalPoints ?? 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{stats?.tasksCompleted ?? 0}</Text>
              <Text style={styles.statLabel}>Tasks done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>

          {/* Interests */}
          <View style={styles.interestsBox}>
            <View style={styles.interestsHeader}>
              <Text style={styles.interestsTitle}>Interests</Text>
              <Pressable><Text style={styles.addLink}>+ Add</Text></Pressable>
            </View>
            <View style={styles.chipsRow}>
              {(profile?.interests ?? INTERESTS).map((interest) => (
                  <View key={interest} style={styles.interestChip}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
              ))}
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
              <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
              >
                <Text style={styles.tabEmoji}>{tab.emoji}</Text>
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
          ))}
        </View>

        {/* About Tab */}
        {activeTab === "about" && (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>About Me</Text>
                <Pressable onPress={() => editing ? handleSaveBio() : setEditing(true)}>
                  <Text style={styles.editLink}>{saving ? "Saving..." : editing ? "Save" : "Edit"}</Text>
                </Pressable>
              </View>
              {editing ? (
                  <TextInput
                      style={styles.bioInput}
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      numberOfLines={4}
                      placeholder="Write something about yourself..."
                      placeholderTextColor="#94a3b8"
                  />
              ) : (
                  <Text style={styles.bioText}>{bio || "No bio added yet."}</Text>
              )}
            </View>
        )}

        {/* Mood Tab */}
        {activeTab === "mood" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Daily Emoji Check-ins</Text>

              {/* 7-day strip */}
              {history.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.weekStrip}>
                      {history.slice(0, 7).reverse().map((entry, i) => (
                          <View key={i} style={styles.weekCell}>
                            <Text style={styles.weekDay}>
                              {new Date(entry.created_at).toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase()}
                            </Text>
                            <Text style={styles.weekEmoji}>{moodEmojis[entry.label] ?? "😐"}</Text>
                          </View>
                      ))}
                    </View>
                  </ScrollView>
              )}

              <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
              {history.map((entry, i) => (
                  <View key={i} style={styles.moodRow}>
                    <Text style={styles.moodEmoji}>{moodEmojis[entry.label] ?? "😐"}</Text>
                    <View style={styles.moodMeta}>
                      <Text style={styles.moodDate}>
                        {new Date(entry.created_at).toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}
                      </Text>
                      {entry.note ? <Text style={styles.moodNote} numberOfLines={1}>{entry.note}</Text> : null}
                    </View>
                    <View style={styles.moodBadge}>
                      <Text style={styles.moodBadgeText}>{entry.label}</Text>
                    </View>
                  </View>
              ))}
            </View>
        )}

        {/* Recap Tab */}
        {activeTab === "recap" && (
            <View style={{ gap: 14 }}>
              <LinearGradient colors={["#6366f1", "#a855f7"]} style={styles.recapCard}>
                <View style={styles.recapHeader}>
                  <Text style={styles.recapTitle}>Today's Recap</Text>
                  <Text style={styles.recapDate}>
                    {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </Text>
                </View>
                <View style={styles.recapGrid}>
                  {[
                    { label: "Tasks Done", value: `${recap?.tasksCompleted ?? 0}/${recap?.totalTasks ?? 0}` },
                    { label: "Points",     value: `+${recap?.pointsEarned ?? 0}` },
                    { label: "Study Time", value: "0 hr 0 min" },
                    { label: "Streak",     value: `🔥${stats?.streak ?? 0} Day` },
                  ].map((item) => (
                      <View key={item.label} style={styles.recapCell}>
                        <Text style={styles.recapCellValue}>{item.value}</Text>
                        <Text style={styles.recapCellLabel}>{item.label}</Text>
                      </View>
                  ))}
                </View>
              </LinearGradient>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Activity Timeline</Text>
                {(recap?.activities ?? []).length === 0 ? (
                    <Text style={styles.emptyText}>No activity recorded yet for today.</Text>
                ) : (
                    recap?.activities.map((a, i) => (
                        <View key={i} style={styles.activityRow}>
                          <Text style={styles.activityTime}>{a.time ?? ""}</Text>
                          <Text style={styles.activityEmoji}>{a.completed ? "✅" : "📝"}</Text>
                          <Text style={styles.activityTitle}>{a.title}</Text>
                        </View>
                    ))
                )}
              </View>
            </View>
        )}

        {/* Blogs Tab */}
        {activeTab === "blogs" && (
            <View style={{ gap: 12 }}>
              <View style={styles.blogsHeader}>
                <Text style={styles.cardTitle}>Personal Blogs</Text>
                <Pressable style={styles.newPostBtn}>
                  <Text style={styles.newPostText}>+ New Post</Text>
                </Pressable>
              </View>
              {blogs.length === 0 ? (
                  <View style={styles.emptyBlogsCard}>
                    <Text style={{ fontSize: 40 }}>📝</Text>
                    <Text style={styles.emptyText}>You haven't written any blogs yet.</Text>
                  </View>
              ) : (
                  blogs.map((blog) => (
                      <View key={blog.id} style={styles.blogRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.blogTitle}>{blog.title}</Text>
                          <Text style={styles.blogMeta}>{new Date(blog.created_at).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.blogActions}>
                          <Pressable><Text style={styles.editLink}>Edit</Text></Pressable>
                          <Pressable><Text style={styles.deleteLink}>Delete</Text></Pressable>
                        </View>
                      </View>
                  ))
              )}
            </View>
        )}
      </AppScreen>
  );
}

const styles = StyleSheet.create({
  errorCard: { backgroundColor: "#fee2e2", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#fecaca" },
  errorText: { color: "#b91c1c", fontWeight: "600", fontSize: 13 },

  // Header card
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarWrapper: { position: "relative" },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  cameraBtn: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#1e293b", alignItems: "center", justifyContent: "center",
  },
  name: { color: "#1e1b4b", fontSize: 22, fontWeight: "800" },
  badgeRow: { flexDirection: "row", gap: 8 },
  badge: { backgroundColor: "#fef3c7", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  badgeText: { color: "#92400e", fontSize: 12, fontWeight: "600" },
  badgePurple: { backgroundColor: "#ede9fe" },
  badgePurpleText: { color: "#6d28d9" },
  statsRow: { flexDirection: "row", alignItems: "center", width: "100%", justifyContent: "space-around" },
  statBlock: { alignItems: "center", gap: 2 },
  statValue: { color: "#6366f1", fontSize: 20, fontWeight: "800" },
  statLabel: { color: "#64748b", fontSize: 12 },
  statDivider: { width: 1, height: 32, backgroundColor: "#e2e8f0" },
  interestsBox: { width: "100%", backgroundColor: "#f8fafc", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e2e8f0", gap: 10 },
  interestsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  interestsTitle: { color: "#1e293b", fontWeight: "700", fontSize: 14 },
  addLink: { color: "#6366f1", fontWeight: "600", fontSize: 13 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  interestChip: { backgroundColor: "#ede9fe", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  interestText: { color: "#6d28d9", fontSize: 12, fontWeight: "600" },

  // Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
    gap: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 12, gap: 2 },
  tabItemActive: { backgroundColor: "#6366f1" },
  tabEmoji: { fontSize: 16 },
  tabLabel: { color: "#64748b", fontSize: 10, fontWeight: "600" },
  tabLabelActive: { color: "#fff" },

  // Generic card
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: "#1e1b4b", fontSize: 17, fontWeight: "800" },
  editLink: { color: "#6366f1", fontWeight: "600", fontSize: 14 },
  deleteLink: { color: "#ef4444", fontWeight: "600", fontSize: 14 },
  bioInput: {
    borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12,
    padding: 12, fontSize: 14, color: "#1e293b", backgroundColor: "#f8fafc",
    minHeight: 80, textAlignVertical: "top",
  },
  bioText: { color: "#475569", lineHeight: 22, fontSize: 14 },

  // Mood
  weekStrip: { flexDirection: "row", gap: 8 },
  weekCell: {
    alignItems: "center", gap: 4, padding: 8,
    backgroundColor: "#f8fafc", borderRadius: 12,
    borderWidth: 1, borderColor: "#e2e8f0", minWidth: 44,
  },
  weekDay: { color: "#94a3b8", fontSize: 9, fontWeight: "700" },
  weekEmoji: { fontSize: 20 },
  sectionLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  moodRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#f8fafc", borderRadius: 14, padding: 12 },
  moodEmoji: { fontSize: 28, width: 36, textAlign: "center" },
  moodMeta: { flex: 1, gap: 2 },
  moodDate: { color: "#1e293b", fontWeight: "600", fontSize: 13 },
  moodNote: { color: "#94a3b8", fontSize: 12 },
  moodBadge: { backgroundColor: "#ede9fe", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  moodBadgeText: { color: "#6d28d9", fontSize: 11, fontWeight: "600" },

  // Recap
  recapCard: { borderRadius: 20, padding: 18, gap: 14 },
  recapHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  recapTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  recapDate: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  recapGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  recapCell: {
    width: "47%", backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14, padding: 12, alignItems: "center", gap: 4,
  },
  recapCellValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  recapCellLabel: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  activityTime: { color: "#94a3b8", fontSize: 12, width: 50 },
  activityEmoji: { fontSize: 18 },
  activityTitle: { color: "#1e293b", fontSize: 14, flex: 1 },
  emptyText: { color: "#94a3b8", fontSize: 14, fontStyle: "italic" },

  // Blogs
  blogsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  newPostBtn: { backgroundColor: "#6366f1", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  newPostText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  emptyBlogsCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 32,
    alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#e2e8f0",
  },
  blogRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  blogTitle: { color: "#1e293b", fontWeight: "700", fontSize: 14 },
  blogMeta: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  blogActions: { flexDirection: "row", gap: 12 },
});
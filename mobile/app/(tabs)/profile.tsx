import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { AppCard } from "@/components/AppCard";
import { AppScreen } from "@/components/AppScreen";
import { Field } from "@/components/Field";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TabSwitch } from "@/components/TabSwitch";
import { colors } from "@/theme/colors";
import { getMoodHistory } from "@/features/mood/services/mood";
import {
  getDailyRecap,
  getMyBlogs,
  getProfile,
  getProfileStats,
  updateUserBio,
} from "@/features/profile/services/profile";

type ProfileData = {
  name?: string | null;
  email?: string | null;
  bio?: string | null;
  interests?: string[];
};

type ProfileStats = {
  totalPoints: number;
  tasksCompleted: number;
  badges: string[];
};

type MoodHistoryItem = {
  id: string;
  label: string;
  created_at: string;
};

type DailyRecap = {
  tasksCompleted: number;
  totalTasks: number;
  pointsEarned: number;
  mood: string | null;
  activities: { title: string; category: string }[];
};

type BlogPost = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState("about");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [history, setHistory] = useState<MoodHistoryItem[]>([]);
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
        getProfileStats(),
        getMoodHistory(),
        getDailyRecap(),
        getMyBlogs(),
      ]);

      setProfile(profileData);
      setStats(statsData);
      setHistory(moodData);
      setRecap(recapData);
      setBlogs(blogData);
      setBio(profileData?.bio ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load profile");
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSaveBio() {
    try {
      setSaving(true);
      await updateUserBio(bio);
      setEditing(false);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save bio");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen title="Profile" subtitle="Photo left, key stats right, then interests directly below.">
      {error ? (
        <AppCard>
          <Text style={styles.errorText}>{error}</Text>
        </AppCard>
      ) : null}

      <AppCard>
        <View style={styles.profileTopRow}>
          <Image
            source={{ uri: `https://ui-avatars.com/api/?background=0891b2&color=ffffff&name=${encodeURIComponent(profile?.name ?? "Student")}` }}
            style={styles.avatarImage}
          />
          <View style={styles.profileSide}>
            <Text style={styles.name}>{profile?.name ?? "Student"}</Text>
            <Text style={styles.email}>{profile?.email ?? "No email available"}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{stats?.totalPoints ?? 0}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{stats?.tasksCompleted ?? 0}</Text>
                <Text style={styles.statLabel}>Tasks</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{stats?.badges?.length ?? 0}</Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.interestsBlock}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsWrap}>
            {(profile?.interests ?? []).map((interest: string) => (
              <View key={interest} style={styles.interestChip}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      </AppCard>

      <TabSwitch
        activeKey={activeTab}
        items={[
          { key: "about", label: "About" },
          { key: "mood", label: "Mood History" },
          { key: "recap", label: "Your Day" },
          { key: "blogs", label: "My Blogs" },
        ]}
        onChange={setActiveTab}
      />

      {activeTab === "about" ? (
        <AppCard>
          <Text style={styles.sectionTitle}>About me</Text>
          {editing ? (
            <Field label="Bio" multiline onChangeText={setBio} value={bio} />
          ) : (
            <Text style={styles.bodyText}>{bio || "No bio added yet."}</Text>
          )}
          <PrimaryButton
            label={editing ? (saving ? "Saving..." : "Save bio") : "Edit bio"}
            onPress={() => (editing ? handleSaveBio() : setEditing(true))}
          />
        </AppCard>
      ) : null}

      {activeTab === "mood" ? (
        <AppCard>
          <Text style={styles.sectionTitle}>Recent mood check-ins</Text>
          {history.map((entry) => (
            <View key={entry.id} style={styles.listRow}>
              <Text style={styles.bodyText}>{entry.label}</Text>
              <Text style={styles.metaText}>{new Date(entry.created_at).toLocaleDateString()}</Text>
            </View>
          ))}
        </AppCard>
      ) : null}

      {activeTab === "recap" ? (
        <AppCard>
          <Text style={styles.sectionTitle}>Daily recap</Text>
          <Text style={styles.bodyText}>
            {recap?.tasksCompleted ?? 0}/{recap?.totalTasks ?? 0} tasks complete
          </Text>
          <Text style={styles.bodyText}>Points earned: {recap?.pointsEarned ?? 0}</Text>
          <Text style={styles.bodyText}>Mood: {recap?.mood ?? "Not checked in"}</Text>
          {(recap?.activities ?? []).map((activity, index: number) => (
            <View key={`${activity.title}-${index}`} style={styles.listRow}>
              <Text style={styles.bodyText}>{activity.title}</Text>
              <Text style={styles.metaText}>{activity.category}</Text>
            </View>
          ))}
        </AppCard>
      ) : null}

      {activeTab === "blogs" ? (
        <>
          {blogs.map((blog) => (
            <AppCard key={blog.id}>
              <Text style={styles.sectionTitle}>{blog.title}</Text>
              <Text style={styles.bodyText} numberOfLines={4}>
                {blog.content}
              </Text>
              <Text style={styles.metaText}>{new Date(blog.created_at).toLocaleDateString()}</Text>
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
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  profileSide: {
    flex: 1,
    gap: 8,
  },
  name: {
    color: colors.textDark,
    fontSize: 24,
    fontWeight: "800",
  },
  email: {
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "stretch",
    borderRadius: 16,
    backgroundColor: colors.cardMuted,
    paddingVertical: 10,
  },
  statBlock: {
    minWidth: 72,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  interestsBlock: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.textDark,
    fontSize: 19,
    fontWeight: "800",
  },
  bodyText: {
    color: colors.textDark,
    lineHeight: 20,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  interestsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  interestText: {
    color: colors.text,
    fontWeight: "700",
  },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
});

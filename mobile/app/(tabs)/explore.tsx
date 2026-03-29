import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppCard } from "@/components/AppCard";
import { AppScreen } from "@/components/AppScreen";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TabSwitch } from "@/components/TabSwitch";
import { colors } from "@/theme/colors";
import { getCampusLocations } from "@/features/community/services/community";
import { getPublicBlogs } from "@/features/profile/services/profile";

type ExploreLocation = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  avgRating: number;
  reviewCount: number;
};

type PublicBlog = {
  id: string;
  title: string;
  content: string;
  users?: {
    name?: string | null;
  }[] | null;
};

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState("map");
  const [selectedType, setSelectedType] = useState("all");
  const [locations, setLocations] = useState<ExploreLocation[]>([]);
  const [blogs, setBlogs] = useState<PublicBlog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const [spotData, blogData] = await Promise.all([getCampusLocations(), getPublicBlogs()]);

        if (!active) {
          return;
        }

        setError(null);
        setLocations(spotData);
        setBlogs(blogData);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load explore data");
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, []);

  const types = useMemo(() => ["all", ...new Set(locations.map((location) => location.type))], [locations]);
  const filteredLocations = selectedType === "all" ? locations : locations.filter((item) => item.type === selectedType);
  const stickyIndex = error ? 2 : 1;

  return (
    <AppScreen
      title="Explore"
      subtitle="Tabs stay pinned while places and blogs scroll through the dashboard body."
      rightSlot={<PrimaryButton label="Write" onPress={() => router.push("/explore/write-blog")} />}
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
            { key: "map", label: "General" },
            { key: "best", label: "Fest Updates" },
            { key: "blog", label: "Academic" },
          ]}
          onChange={setActiveTab}
        />
      </View>

      {activeTab === "map" ? (
        <AppCard>
          <Text style={styles.mapEmoji}>🏫</Text>
          <Text style={styles.cardTitle}>Interactive campus map</Text>
          <Text style={styles.cardBody}>
            This keeps the placement from the web reference while leaving the map slot ready for the real Expo map.
          </Text>
        </AppCard>
      ) : null}

      {activeTab === "best" ? (
        <>
          <View style={styles.filterRow}>
            {types.map((type) => (
              <Pressable
                key={type}
                onPress={() => setSelectedType(type)}
                style={[styles.filterChip, selectedType === type && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, selectedType === type && styles.filterTextActive]}>{type}</Text>
              </Pressable>
            ))}
          </View>
          {filteredLocations.map((location, index) => (
            <AppCard key={location.id}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text style={styles.cardTitle}>{location.name}</Text>
              <Text style={styles.cardBody}>{location.description || "No description yet."}</Text>
              <Text style={styles.ratingText}>
                {location.avgRating.toFixed(1)} rating • {location.reviewCount} reviews
              </Text>
            </AppCard>
          ))}
        </>
      ) : null}

      {activeTab === "blog" ? (
        <>
          {blogs.map((blog) => (
            <AppCard key={blog.id}>
              <Text style={styles.cardTitle}>{blog.title}</Text>
              <Text style={styles.cardBody} numberOfLines={3}>
                {blog.content}
              </Text>
              <Text style={styles.ratingText}>by {blog.users?.[0]?.name ?? "Anonymous"}</Text>
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
  mapEmoji: {
    fontSize: 60,
    textAlign: "center",
  },
  cardTitle: {
    color: colors.textDark,
    fontSize: 20,
    fontWeight: "800",
  },
  cardBody: {
    color: colors.textDark,
    lineHeight: 20,
  },
  ratingText: {
    color: colors.textMuted,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.accentSoft,
  },
  filterText: {
    color: colors.textMuted,
    textTransform: "capitalize",
    fontWeight: "700",
  },
  filterTextActive: {
    color: colors.text,
  },
  rank: {
    color: colors.accent,
    fontWeight: "800",
  },
});

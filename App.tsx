import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "./mobile/src/theme/colors";
import { moods } from "./mobile/src/constants/moods";
import { helpOptions } from "./mobile/src/constants/help-options";
import { todoCategories } from "./mobile/src/constants/todos";
import { initSupabase, getSupabase } from "./mobile/src/lib/supabase/client";
import { createMoodCheckIn, getMoodHistory, getTodaysMood } from "./mobile/src/features/mood/services/mood";
import { createTodo, deleteTodo, getActiveTodos, getTodoStats, toggleTodo, type TodoCategory } from "./mobile/src/features/todos/services/todos";
import { createStudyGroup, getCampusLocations, getMyGroups, getStudyGroups, joinStudyGroup, leaveStudyGroup, updateLocationStatus } from "./mobile/src/features/community/services/community";
import { createHelpRequest, getHelpRequests, type HelpType } from "./mobile/src/features/help/services/help";
import { createBlog, ensureProfile, getDailyRecap, getMyBlogs, getProfileStats, getPublicBlogs, updateUserBio } from "./mobile/src/features/profile/services/profile";
import { getTodayLeaderboard, getUserStats } from "./mobile/src/features/leaderboard/services/leaderboard";

type ScreenKey = "home" | "checklist" | "community" | "explore" | "profile";

type SessionUser = {
  id: string;
  email?: string | null;
};

type HelpOptionId = (typeof helpOptions)[number]["id"];

const screenTabs: ScreenKey[] = ["home", "checklist", "community", "explore", "profile"];

function getFailureMessage(failure: unknown, fallback: string) {
  if (failure instanceof Error && failure.message) {
    return failure.message;
  }

  if (typeof failure === "object" && failure !== null) {
    const maybeFailure = failure as {
      message?: unknown;
      error?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [maybeFailure.message, maybeFailure.error, maybeFailure.details, maybeFailure.hint, maybeFailure.code].filter(
      (part): part is string => typeof part === "string" && part.trim().length > 0
    );

    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return fallback;
}

function AppField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputDisabled]}
        value={value}
      />
    </View>
  );
}

function AppButton({
  label,
  onPress,
  disabled = false,
  variant = "solid",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "solid" | "soft";
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, variant === "soft" ? styles.buttonSoft : styles.buttonSolid, disabled && styles.buttonDisabled]}
    >
      <Text style={[styles.buttonText, variant === "soft" ? styles.buttonSoftText : styles.buttonSolidText]}>{label}</Text>
    </Pressable>
  );
}

function AppCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export default function App() {
  const [bootError, setBootError] = useState<string | null>(null);
  const [screen, setScreen] = useState<ScreenKey>("home");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodNote, setMoodNote] = useState("");
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Array<{ rank: number; name: string; points: number; userId: string }>>([]);
  const [userStats, setUserStats] = useState<{ todayPoints: number; streak: number } | null>(null);
  const [todoStats, setTodoStats] = useState({ completed: 0, total: 0 });
  const [todos, setTodos] = useState<Array<{ id: string; title: string; category: string; completed: boolean }>>([]);
  const [todoText, setTodoText] = useState("");
  const [todoCategory, setTodoCategory] = useState<TodoCategory>("study");
  const [todoFilter, setTodoFilter] = useState<TodoCategory | "all">("all");
  const [groups, setGroups] = useState<Array<{ id: string; name: string; description: string | null; memberCount: number; createdBy: string | null }>>([]);
  const [myGroups, setMyGroups] = useState<Array<{ id: string }>>([]);
  const [locations, setLocations] = useState<Array<{ id: string; name: string; type: string; isOpen: boolean; avgRating: number; reviewCount: number; description: string | null }>>([]);
  const [helpRequests, setHelpRequests] = useState<Array<{ id: string; title: string; type: string }>>([]);
  const [publicBlogs, setPublicBlogs] = useState<Array<{ id: string; title: string; content: string; users?: Array<{ name?: string | null }> }>>([]);
  const [profile, setProfile] = useState<{ name?: string | null; email?: string | null; bio?: string | null } | null>(null);
  const [profileStats, setProfileStats] = useState<{ totalPoints: number; tasksCompleted: number } | null>(null);
  const [moodHistory, setMoodHistory] = useState<Array<{ id: string; label: string; created_at: string }>>([]);
  const [dailyRecap, setDailyRecap] = useState<{ tasksCompleted: number; totalTasks: number; pointsEarned: number; mood: string | null } | null>(null);
  const [myBlogs, setMyBlogs] = useState<Array<{ id: string; title: string; created_at: string }>>([]);
  const [bio, setBio] = useState("");

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [helpType, setHelpType] = useState<HelpType>("item");
  const [helpTitle, setHelpTitle] = useState("");
  const [helpDescription, setHelpDescription] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [blogTitle, setBlogTitle] = useState("");
  const [blogContent, setBlogContent] = useState("");

  useEffect(() => {
    try {
      initSupabase();
      const supabase = getSupabase();

      void supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email });
        }
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email });
        } else {
          setUser(null);
        }
      });

      return () => {
        data.subscription.unsubscribe();
      };
    } catch (failure) {
      setBootError(failure instanceof Error ? failure.message : "Failed to initialize Supabase");
      return undefined;
    }
  }, []);

  async function refreshData() {
    if (!user) {
      return;
    }

    setError(null);

    const profileResult = await ensureProfile()
      .then((data) => ({ ok: true as const, data }))
      .catch((failure) => ({ ok: false as const, failure }));

    const [
      todaysMoodResult,
      boardResult,
      statsResult,
      todosSummaryResult,
      activeTodosResult,
      communityGroupsResult,
      membershipsResult,
      campusLocationsResult,
      requestsResult,
      visibleBlogsResult,
      statsProfileResult,
      historyResult,
      recapResult,
      ownBlogsResult,
    ] = await Promise.allSettled([
      getTodaysMood(),
      getTodayLeaderboard(5),
      getUserStats(),
      getTodoStats(),
      getActiveTodos(),
      getStudyGroups(),
      getMyGroups(),
      getCampusLocations(),
      getHelpRequests(),
      getPublicBlogs(),
      getProfileStats(),
      getMoodHistory(),
      getDailyRecap(),
      getMyBlogs(),
    ]);

    const loadErrors: string[] = [];
    const take = <T,>(result: PromiseSettledResult<T>, fallback: T, label: string) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      loadErrors.push(`${label}: ${getFailureMessage(result.reason, "Request failed")}`);
      return fallback;
    };

    const profileData = profileResult.ok ? profileResult.data : null;
    if (!profileResult.ok) {
      loadErrors.push(`profile: ${getFailureMessage(profileResult.failure, "Failed to load profile")}`);
    }

    const todaysMood = take(todaysMoodResult, null, "mood");
    const board = take(boardResult, [], "leaderboard");
    const stats = take(statsResult, null, "user stats");
    const todosSummary = take(todosSummaryResult, { completed: 0, total: 0 }, "todo stats");
    const activeTodos = take(activeTodosResult, [], "todos");
    const communityGroups = take(communityGroupsResult, [], "community groups");
    const memberships = take(membershipsResult, [], "memberships");
    const campusLocations = take(campusLocationsResult, [], "campus locations");
    const requests = take(requestsResult, [], "help requests");
    const visibleBlogs = take(visibleBlogsResult, [], "public blogs");
    const statsProfile = take(statsProfileResult, null, "profile stats");
    const history = take(historyResult, [], "mood history");
    const recap = take(recapResult, null, "daily recap");
    const ownBlogs = take(ownBlogsResult, [], "my blogs");

    setAlreadyCheckedIn(Boolean(todaysMood));
    setSelectedMood(todaysMood?.label ?? null);
    setLeaderboard(board);
    setUserStats(stats ? { todayPoints: stats.todayPoints, streak: stats.streak } : null);
    setTodoStats(todosSummary);
    setTodos(activeTodos);
    setGroups(communityGroups);
    setMyGroups(memberships);
    setLocations(campusLocations);
    setHelpRequests(requests.map((request) => ({ id: request.id, title: request.title, type: request.type })));
    setPublicBlogs(
      visibleBlogs.map((blog) => ({
        id: blog.id,
        title: blog.title,
        content: blog.content,
        users: Array.isArray(blog.users) ? blog.users : [],
      }))
    );
    setProfile(profileData);
    setProfileStats(statsProfile ? { totalPoints: statsProfile.totalPoints, tasksCompleted: statsProfile.tasksCompleted } : null);
    setMoodHistory(history);
    setDailyRecap(recap);
    setMyBlogs(ownBlogs.map((blog) => ({ id: blog.id, title: blog.title, created_at: blog.created_at })));
    setBio(profileData?.bio ?? "");

    if (loadErrors.length > 0) {
      setError(`Some data could not load. ${loadErrors[0]}`);
    }
  }

  useEffect(() => {
    void refreshData();
  }, [user]);

  async function handleAuth() {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const supabase = getSupabase();

      if (authMode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });

        if (signUpError) {
          throw signUpError;
        }

        setMessage("Account created. If email confirmation is enabled, confirm it first.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          throw signInError;
        }
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      await getSupabase().auth.signOut();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Failed to sign out");
    }
  }

  const filteredTodos = useMemo(() => {
    if (todoFilter === "all") {
      return todos;
    }

    return todos.filter((todo) => todo.category === todoFilter);
  }, [todoFilter, todos]);

  const myGroupIds = new Set(myGroups.map((group) => group.id));

  if (bootError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Student Survival Plan</Text>
          <Text style={styles.errorText}>{bootError}</Text>
          <Text style={styles.helperText}>Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.screenContent}>
          <Text style={styles.title}>Student Survival Plan</Text>
          <Text style={styles.subtitle}>React Native + Expo + Supabase.</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {message ? <Text style={styles.successText}>{message}</Text> : null}
          <AppCard>
            <Text style={styles.sectionTitle}>{authMode === "login" ? "Sign in" : "Sign up"}</Text>
            {authMode === "signup" ? <AppField label="Name" value={name} onChangeText={setName} placeholder="Your name" /> : null}
            <AppField label="Email" value={email} onChangeText={setEmail} placeholder="student@college.edu" />
            <AppField label="Password" value={password} onChangeText={setPassword} placeholder="Password" />
            <AppButton label={loading ? "Working..." : authMode === "login" ? "Sign in" : "Create account"} onPress={handleAuth} />
            <AppButton
              label={authMode === "login" ? "Need an account?" : "Already have an account?"}
              onPress={() => setAuthMode(authMode === "login" ? "signup" : "login")}
              variant="soft"
            />
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{screenLabel(screen)}</Text>
            <Text style={styles.subtitle}>{profile?.name || user.email || "Student"}</Text>
          </View>
          <AppButton label="Sign out" onPress={handleSignOut} variant="soft" />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}

        {screen === "home" ? (
          <>
            <AppCard>
              <Text style={styles.sectionTitle}>How are you feeling today?</Text>
              <View style={styles.wrapRow}>
                {moods.map((mood) => (
                  <Pressable
                    key={mood.label}
                    onPress={() => setSelectedMood(mood.label)}
                    style={[styles.chip, selectedMood === mood.label && styles.activeChip]}
                  >
                    <Text style={styles.emoji}>{mood.emoji}</Text>
                    <Text style={styles.bodyText}>{mood.label}</Text>
                  </Pressable>
                ))}
              </View>
              <AppField label="Note" value={moodNote} onChangeText={setMoodNote} multiline placeholder="Want to share what's on your mind?" />
              <AppButton
                label={alreadyCheckedIn ? "Already checked in" : "Check in"}
                onPress={() =>
                  createMoodCheckIn(selectedMood ?? "", moodNote || undefined)
                    .then(() => {
                      setMoodNote("");
                      setMessage("Mood checked in.");
                      return refreshData();
                    })
                    .catch((failure) => setError(failure instanceof Error ? failure.message : "Failed to submit mood"))
                }
                disabled={alreadyCheckedIn || !selectedMood}
              />
            </AppCard>

            <AppCard>
              <Text style={styles.sectionTitle}>Need help?</Text>
              {helpOptions.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    setHelpType(option.id as HelpOptionId);
                    setShowHelpModal(true);
                  }}
                  style={styles.helpOption}
                >
                  <Text style={styles.helpTitle}>{option.title}</Text>
                  <Text style={styles.helpBody}>{option.description}</Text>
                </Pressable>
              ))}
            </AppCard>

            <AppCard>
              <Text style={styles.sectionTitle}>Today at a glance</Text>
              <Text style={styles.bodyText}>Points today: {userStats?.todayPoints ?? 0}</Text>
              <Text style={styles.bodyText}>
                Tasks: {todoStats.completed}/{todoStats.total}
              </Text>
              <Text style={styles.bodyText}>Streak: {userStats?.streak ?? 0}</Text>
            </AppCard>

            <AppCard>
              <Text style={styles.sectionTitle}>Most productive today</Text>
              {leaderboard.map((entry) => (
                <View key={entry.userId} style={styles.listRow}>
                  <Text style={styles.bodyText}>#{entry.rank}</Text>
                  <Text style={styles.bodyText}>{entry.name}</Text>
                  <Text style={styles.metaText}>{entry.points} pts</Text>
                </View>
              ))}
            </AppCard>
          </>
        ) : null}

        {screen === "checklist" ? (
          <>
            <AppCard>
              <Text style={styles.sectionTitle}>Add task</Text>
              <AppField label="Task" value={todoText} onChangeText={setTodoText} placeholder="What do you need to do?" />
              <View style={styles.wrapRow}>
                {todoCategories.map((category) => (
                  <Pressable
                    key={category.key}
                    onPress={() => setTodoCategory(category.key)}
                    style={[styles.smallChip, todoCategory === category.key && styles.activeChip]}
                  >
                    <Text style={styles.bodyText}>{category.label}</Text>
                  </Pressable>
                ))}
              </View>
              <AppButton
                label="Add task"
                onPress={() =>
                  createTodo(todoText.trim(), todoCategory)
                    .then(() => {
                      setTodoText("");
                      return refreshData();
                    })
                    .catch((failure) => setError(failure instanceof Error ? failure.message : "Failed to add task"))
                }
                disabled={!todoText.trim()}
              />
            </AppCard>

            <View style={styles.wrapRow}>
              <Pressable onPress={() => setTodoFilter("all")} style={[styles.smallChip, todoFilter === "all" && styles.activeChip]}>
                <Text style={styles.bodyText}>All</Text>
              </Pressable>
              {todoCategories.map((category) => (
                <Pressable
                  key={category.key}
                  onPress={() => setTodoFilter(category.key)}
                  style={[styles.smallChip, todoFilter === category.key && styles.activeChip]}
                >
                  <Text style={styles.bodyText}>{category.label}</Text>
                </Pressable>
              ))}
            </View>

            {filteredTodos.map((todo) => (
              <AppCard key={todo.id}>
                <View style={styles.taskRow}>
                  <Pressable
                    onPress={() =>
                      toggleTodo(todo.id)
                        .then(refreshData)
                        .catch((failure) => setError(failure instanceof Error ? failure.message : "Failed to update task"))
                    }
                  >
                    <Text style={styles.bodyText}>{todo.completed ? "✓" : "○"}</Text>
                  </Pressable>
                  <View style={styles.flexOne}>
                    <Text style={styles.bodyText}>{todo.title}</Text>
                    <Text style={styles.metaText}>{todo.category}</Text>
                  </View>
                  <AppButton
                    label="Delete"
                    onPress={() =>
                      deleteTodo(todo.id)
                        .then(refreshData)
                        .catch((failure) => setError(failure instanceof Error ? failure.message : "Failed to delete task"))
                    }
                    variant="soft"
                  />
                </View>
              </AppCard>
            ))}
          </>
        ) : null}

        {screen === "community" ? (
          <>
            <AppCard>
              <Text style={styles.sectionTitle}>Study groups</Text>
              <AppButton label="Create group" onPress={() => setShowGroupModal(true)} />
            </AppCard>
            {groups.map((group) => (
              <AppCard key={group.id}>
                <Text style={styles.sectionTitle}>{group.name}</Text>
                <Text style={styles.metaText}>
                  {group.memberCount} members • {group.createdBy ?? "Unknown"}
                </Text>
                <Text style={styles.bodyText}>{group.description || "No description yet."}</Text>
                <AppButton
                  label={myGroupIds.has(group.id) ? "Leave group" : "Join group"}
                  onPress={() =>
                    (myGroupIds.has(group.id) ? leaveStudyGroup(group.id) : joinStudyGroup(group.id))
                      .then(refreshData)
                      .catch((failure) => setError(failure instanceof Error ? failure.message : "Failed to update group"))
                  }
                  variant={myGroupIds.has(group.id) ? "soft" : "solid"}
                />
              </AppCard>
            ))}

            <AppCard>
              <Text style={styles.sectionTitle}>Campus spots</Text>
              {locations.map((location) => (
                <View key={location.id} style={styles.cardRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.bodyText}>{location.name}</Text>
                    <Text style={styles.metaText}>
                      {location.isOpen ? "Open" : "Closed"} • {location.type}
                    </Text>
                  </View>
                  <AppButton
                    label={location.isOpen ? "Close" : "Open"}
                    onPress={() =>
                      updateLocationStatus(location.id, !location.isOpen)
                        .then(refreshData)
                        .catch((failure) => setError(failure instanceof Error ? failure.message : "Failed to update location"))
                    }
                    variant="soft"
                  />
                </View>
              ))}
            </AppCard>

            <AppCard>
              <Text style={styles.sectionTitle}>Open help requests</Text>
              {helpRequests.map((request) => (
                <View key={request.id} style={styles.cardDivider}>
                  <Text style={styles.bodyText}>{request.title}</Text>
                  <Text style={styles.metaText}>{request.type}</Text>
                </View>
              ))}
            </AppCard>
          </>
        ) : null}

        {screen === "explore" ? (
          <>
            <AppCard>
              <Text style={styles.sectionTitle}>Top spots</Text>
              {locations.map((location) => (
                <View key={location.id} style={styles.cardDivider}>
                  <Text style={styles.bodyText}>{location.name}</Text>
                  <Text style={styles.metaText}>
                    {location.avgRating.toFixed(1)} rating • {location.reviewCount} reviews
                  </Text>
                </View>
              ))}
            </AppCard>
            <AppCard>
              <Text style={styles.sectionTitle}>Student blogs</Text>
              <AppButton label="Write blog" onPress={() => setShowBlogModal(true)} />
              {publicBlogs.map((blog) => (
                <View key={blog.id} style={styles.cardDivider}>
                  <Text style={styles.bodyText}>{blog.title}</Text>
                  <Text style={styles.metaText}>{blog.users?.[0]?.name ?? "Anonymous"}</Text>
                  <Text style={styles.bodyText}>{blog.content}</Text>
                </View>
              ))}
            </AppCard>
          </>
        ) : null}

        {screen === "profile" ? (
          <>
            <AppCard>
              <Text style={styles.sectionTitle}>{profile?.name || "Student"}</Text>
              <Text style={styles.metaText}>{profile?.email || user.email}</Text>
              <Text style={styles.bodyText}>Points: {profileStats?.totalPoints ?? 0}</Text>
              <Text style={styles.bodyText}>Tasks completed: {profileStats?.tasksCompleted ?? 0}</Text>
              <AppField label="Bio" value={bio} onChangeText={setBio} multiline />
              <AppButton
                label="Save bio"
                onPress={() =>
                  updateUserBio(bio)
                    .then(refreshData)
                    .catch((failure) => setError(failure instanceof Error ? failure.message : "Failed to save bio"))
                }
              />
            </AppCard>

            <AppCard>
              <Text style={styles.sectionTitle}>Mood history</Text>
              {moodHistory.map((entry) => (
                <View key={entry.id} style={styles.listRow}>
                  <Text style={styles.bodyText}>{entry.label}</Text>
                  <Text style={styles.metaText}>{new Date(entry.created_at).toLocaleDateString()}</Text>
                </View>
              ))}
            </AppCard>

            <AppCard>
              <Text style={styles.sectionTitle}>Daily recap</Text>
              <Text style={styles.bodyText}>
                {dailyRecap?.tasksCompleted ?? 0}/{dailyRecap?.totalTasks ?? 0} tasks complete
              </Text>
              <Text style={styles.bodyText}>Points earned: {dailyRecap?.pointsEarned ?? 0}</Text>
              <Text style={styles.bodyText}>Mood: {dailyRecap?.mood ?? "Not checked in"}</Text>
            </AppCard>

            <AppCard>
              <Text style={styles.sectionTitle}>My blogs</Text>
              {myBlogs.map((blog) => (
                <View key={blog.id} style={styles.cardDivider}>
                  <Text style={styles.bodyText}>{blog.title}</Text>
                  <Text style={styles.metaText}>{new Date(blog.created_at).toLocaleDateString()}</Text>
                </View>
              ))}
            </AppCard>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.tabBar}>
        {screenTabs.map((tab) => (
          <Pressable key={tab} onPress={() => setScreen(tab)} style={styles.tabItem}>
            <Text style={[styles.tabText, screen === tab && styles.tabTextActive]}>{screenLabel(tab)}</Text>
          </Pressable>
        ))}
      </View>

      <Modal animationType="slide" transparent visible={showHelpModal}>
        <View style={styles.modalBackdrop}>
          <AppCard>
            <Text style={styles.sectionTitle}>Create help request</Text>
            <AppField label="Type" value={helpType} editable={false} />
            <AppField label="Title" value={helpTitle} onChangeText={setHelpTitle} />
            <AppField label="Description" value={helpDescription} onChangeText={setHelpDescription} multiline />
            <View style={styles.modalButtons}>
              <AppButton label="Cancel" onPress={() => setShowHelpModal(false)} variant="soft" />
              <AppButton
                label="Submit"
                onPress={() =>
                  createHelpRequest(helpType, helpTitle.trim(), helpDescription.trim() || undefined)
                    .then(() => {
                      setShowHelpModal(false);
                      setHelpTitle("");
                      setHelpDescription("");
                      return refreshData();
                    })
                    .catch((failure) => setError(failure instanceof Error ? failure.message : "Failed to create help request"))
                }
                disabled={!helpTitle.trim()}
              />
            </View>
          </AppCard>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={showGroupModal}>
        <View style={styles.modalBackdrop}>
          <AppCard>
            <Text style={styles.sectionTitle}>Create group</Text>
            <AppField label="Name" value={groupName} onChangeText={setGroupName} />
            <AppField label="Description" value={groupDescription} onChangeText={setGroupDescription} multiline />
            <View style={styles.modalButtons}>
              <AppButton label="Cancel" onPress={() => setShowGroupModal(false)} variant="soft" />
              <AppButton
                label="Create"
                onPress={() =>
                  createStudyGroup(groupName.trim(), groupDescription.trim() || undefined)
                    .then(() => {
                      setShowGroupModal(false);
                      setGroupName("");
                      setGroupDescription("");
                      return refreshData();
                    })
                    .catch((failure) => setError(failure instanceof Error ? failure.message : "Failed to create group"))
                }
                disabled={!groupName.trim()}
              />
            </View>
          </AppCard>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={showBlogModal}>
        <View style={styles.modalBackdrop}>
          <AppCard>
            <Text style={styles.sectionTitle}>Write blog</Text>
            <AppField label="Title" value={blogTitle} onChangeText={setBlogTitle} />
            <AppField label="Content" value={blogContent} onChangeText={setBlogContent} multiline />
            <View style={styles.modalButtons}>
              <AppButton label="Cancel" onPress={() => setShowBlogModal(false)} variant="soft" />
              <AppButton
                label="Publish"
                onPress={() =>
                  createBlog(blogTitle.trim(), blogContent.trim(), true)
                    .then(() => {
                      setShowBlogModal(false);
                      setBlogTitle("");
                      setBlogContent("");
                      return refreshData();
                    })
                    .catch((failure) => setError(failure instanceof Error ? failure.message : "Failed to publish blog"))
                }
                disabled={!blogTitle.trim() || !blogContent.trim()}
              />
            </View>
          </AppCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function screenLabel(screen: ScreenKey) {
  return screen.charAt(0).toUpperCase() + screen.slice(1);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  screenContent: {
    padding: 16,
    paddingBottom: 96,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
  },
  helperText: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  errorText: {
    color: "#fecaca",
    fontWeight: "600",
  },
  successText: {
    color: "#bbf7d0",
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: "700",
  },
  bodyText: {
    color: colors.textDark,
    lineHeight: 20,
  },
  metaText: {
    color: "#4b5563",
    fontSize: 12,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.textDark,
    fontWeight: "600",
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    color: colors.textDark,
  },
  inputMultiline: {
    minHeight: 110,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  inputDisabled: {
    backgroundColor: colors.cardMuted,
  },
  button: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonSolid: {
    backgroundColor: colors.accent,
  },
  buttonSoft: {
    backgroundColor: colors.accentSoft,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: "700",
  },
  buttonSolidText: {
    color: colors.text,
  },
  buttonSoftText: {
    color: colors.accent,
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    minWidth: 72,
    backgroundColor: colors.cardMuted,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    gap: 4,
  },
  smallChip: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  activeChip: {
    backgroundColor: colors.accentSoft,
  },
  emoji: {
    fontSize: 24,
  },
  helpOption: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  helpTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  helpBody: {
    color: colors.textMuted,
  },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardDivider: {
    gap: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  flexOne: {
    flex: 1,
  },
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    backgroundColor: colors.surfaceStrong,
    borderTopWidth: 1,
    borderTopColor: "#58606c",
    paddingVertical: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
  },
  tabText: {
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: 12,
  },
  tabTextActive: {
    color: colors.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
});

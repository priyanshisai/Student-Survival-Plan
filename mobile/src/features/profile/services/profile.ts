import { requireUser } from "../../../lib/supabase/auth";
import { getSupabase } from "../../../lib/supabase/client";
import { addDailyPoints } from "../../../lib/supabase/points";
import { startOfTodayIso } from "../../../lib/utils/date";
import { parseInterests } from "../../../lib/utils/interests";

const profileBaseSelect = "id, name, email, created_at";
let resolvedBioColumn: "bio" | "profile_bio" | null | undefined;
let resolvedInterestsColumn: "interests" | "interest" | null | undefined;
let resolvedAvatarColumn: "profile_pic" | "profilePic" | "avatar_url" | null | undefined;
let resolvedProductivityColumn: "productivity_streak" | "productivity_streaks" | null | undefined;

type ProfileRow = {
  id: string | number;
  name?: string | null;
  email?: string | null;
  interests?: string | null;
  interest?: string | null;
  profile_pic?: string | null;
  profilePic?: string | null;
  avatar_url?: string | null;
  productivity_streak?: number | null;
  productivity_streaks?: number | null;
  created_at?: string | null;
  bio?: string | null;
  profile_bio?: string | null;
};

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }

  return null;
}

function withNormalizedBio(profile: ProfileRow, bioColumn: "bio" | "profile_bio" | null) {
  const bio = bioColumn ? profile[bioColumn] : null;
  return {
    ...profile,
    bio: typeof bio === "string" ? bio : null,
  };
}

function withNormalizedInterests(profile: ProfileRow, interestsColumn: "interests" | "interest" | null) {
  const rawInterests = interestsColumn ? profile[interestsColumn] : null;
  return {
    ...profile,
    interests: typeof rawInterests === "string" ? rawInterests : null,
  };
}

function withNormalizedAvatar(profile: ProfileRow, avatarColumn: "profile_pic" | "profilePic" | "avatar_url" | null) {
  const rawAvatar = avatarColumn ? profile[avatarColumn] : null;
  return {
    ...profile,
    profile_pic: typeof rawAvatar === "string" ? rawAvatar : null,
  };
}

function withNormalizedProductivity(
  profile: ProfileRow,
  productivityColumn: "productivity_streak" | "productivity_streaks" | null
) {
  const rawProductivity = productivityColumn ? profile[productivityColumn] : null;
  return {
    ...profile,
    productivity_streak: typeof rawProductivity === "number" ? rawProductivity : null,
  };
}

function getProfileSelect(
  bioColumn: "bio" | "profile_bio" | null,
  interestsColumn: "interests" | "interest" | null,
  avatarColumn: "profile_pic" | "profilePic" | "avatar_url" | null,
  productivityColumn: "productivity_streak" | "productivity_streaks" | null
) {
  const parts = [profileBaseSelect];
  if (productivityColumn) {
    parts.push(productivityColumn);
  }
  if (avatarColumn) {
    parts.push(avatarColumn);
  }
  if (interestsColumn) {
    parts.push(interestsColumn);
  }
  if (bioColumn) {
    parts.push(bioColumn);
  }
  return parts.join(", ");
}

async function resolveBioColumn() {
  if (resolvedBioColumn !== undefined) {
    return resolvedBioColumn;
  }

  const supabase = getSupabase();

  const { error: bioError } = await supabase.from("users").select("id, bio").limit(1);
  if (!bioError) {
    resolvedBioColumn = "bio";
    return resolvedBioColumn;
  }

  if (getErrorCode(bioError) !== "42703") {
    throw bioError;
  }

  const { error: profileBioError } = await supabase.from("users").select("id, profile_bio").limit(1);
  if (!profileBioError) {
    resolvedBioColumn = "profile_bio";
    return resolvedBioColumn;
  }

  if (getErrorCode(profileBioError) !== "42703") {
    throw profileBioError;
  }

  resolvedBioColumn = null;
  return resolvedBioColumn;
}

async function resolveInterestsColumn() {
  if (resolvedInterestsColumn !== undefined) {
    return resolvedInterestsColumn;
  }

  const supabase = getSupabase();

  const { error: interestsError } = await supabase.from("users").select("id, interests").limit(1);
  if (!interestsError) {
    resolvedInterestsColumn = "interests";
    return resolvedInterestsColumn;
  }

  if (getErrorCode(interestsError) !== "42703") {
    throw interestsError;
  }

  const { error: interestError } = await supabase.from("users").select("id, interest").limit(1);
  if (!interestError) {
    resolvedInterestsColumn = "interest";
    return resolvedInterestsColumn;
  }

  if (getErrorCode(interestError) !== "42703") {
    throw interestError;
  }

  resolvedInterestsColumn = null;
  return resolvedInterestsColumn;
}

async function resolveAvatarColumn() {
  if (resolvedAvatarColumn !== undefined) {
    return resolvedAvatarColumn;
  }

  const supabase = getSupabase();
  const candidates: Array<"profile_pic" | "profilePic" | "avatar_url"> = ["profile_pic", "profilePic", "avatar_url"];

  for (const candidate of candidates) {
    const { error } = await supabase.from("users").select(`id, ${candidate}`).limit(1);
    if (!error) {
      resolvedAvatarColumn = candidate;
      return resolvedAvatarColumn;
    }

    if (getErrorCode(error) !== "42703") {
      throw error;
    }
  }

  resolvedAvatarColumn = null;
  return resolvedAvatarColumn;
}

async function resolveProductivityColumn() {
  if (resolvedProductivityColumn !== undefined) {
    return resolvedProductivityColumn;
  }

  const supabase = getSupabase();
  const candidates: Array<"productivity_streak" | "productivity_streaks"> = ["productivity_streak", "productivity_streaks"];

  for (const candidate of candidates) {
    const { error } = await supabase.from("users").select(`id, ${candidate}`).limit(1);
    if (!error) {
      resolvedProductivityColumn = candidate;
      return resolvedProductivityColumn;
    }

    if (getErrorCode(error) !== "42703") {
      throw error;
    }
  }

  resolvedProductivityColumn = null;
  return resolvedProductivityColumn;
}

function normalizeProfile<T extends { interests?: string | null }>(profile: T) {
  return {
    ...profile,
    interests: parseInterests(profile.interests),
  };
}

export async function ensureProfile() {
  const user = await requireUser();
  const supabase = getSupabase();
  const bioColumn = await resolveBioColumn();
  const interestsColumn = await resolveInterestsColumn();
  const avatarColumn = await resolveAvatarColumn();
  const productivityColumn = await resolveProductivityColumn();
  const profileSelect = getProfileSelect(bioColumn, interestsColumn, avatarColumn, productivityColumn);

  let { data: existing, error: existingError } = await supabase
    .from("users")
    .select(profileSelect)
    .eq("id", user.id)
    .maybeSingle();

  let usesEmailLookup = false;
  if (existingError && getErrorCode(existingError) === "22P02" && user.email) {
    usesEmailLookup = true;
    const emailLookup = await supabase.from("users").select(profileSelect).eq("email", user.email).maybeSingle();
    existing = emailLookup.data;
    existingError = emailLookup.error;
  }

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return normalizeProfile(
      withNormalizedProductivity(
        withNormalizedAvatar(withNormalizedInterests(withNormalizedBio(existing as ProfileRow, bioColumn), interestsColumn), avatarColumn),
        productivityColumn
      )
    );
  }

  const profileName =
    typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim().length > 0
      ? user.user_metadata.name.trim()
      : typeof user.email === "string"
        ? user.email.split("@")[0]
        : "Student";

  let created: ProfileRow | null = null;
  let createError: unknown = null;

  if (!usesEmailLookup) {
    const createById = await supabase
      .from("users")
      .upsert(
        {
          id: user.id,
          email: user.email,
          name: profileName,
        },
        { onConflict: "id" }
      )
      .select(profileSelect)
      .single();
    created = createById.data as ProfileRow | null;
    createError = createById.error;
  } else if (user.email) {
    const createByEmail = await supabase
      .from("users")
      .insert({
        email: user.email,
        name: profileName,
      })
      .select(profileSelect)
      .maybeSingle();
    created = createByEmail.data as ProfileRow | null;
    createError = createByEmail.error;

    if (createError && getErrorCode(createError) === "23505") {
      const existingByEmail = await supabase.from("users").select(profileSelect).eq("email", user.email).maybeSingle();
      created = existingByEmail.data as ProfileRow | null;
      createError = existingByEmail.error;
    }
  }

  if (createError) {
    if (getErrorCode(createError) === "22P02") {
      return normalizeProfile({
        id: user.id,
        email: user.email ?? null,
        name: profileName,
        bio: null,
        interests: [],
        profile_pic: null,
        productivity_streak: 0,
        created_at: new Date().toISOString(),
      });
    }

    throw createError;
  }

  if (!created) {
    return normalizeProfile({
      id: user.id,
      email: user.email ?? null,
      name: profileName,
      bio: null,
      interests: [],
      profile_pic: null,
      productivity_streak: 0,
      created_at: new Date().toISOString(),
    });
  }

  return normalizeProfile(
    withNormalizedProductivity(
      withNormalizedAvatar(withNormalizedInterests(withNormalizedBio(created as ProfileRow, bioColumn), interestsColumn), avatarColumn),
      productivityColumn
    )
  );
}

export async function getProfile() {
  return ensureProfile();
}

export async function updateProfile(data: {
  name?: string;
  bio?: string;
  interests?: string[];
}) {
  const profile = (await ensureProfile()) as ProfileRow;
  const supabase = getSupabase();
  const bioColumn = await resolveBioColumn();
  const interestsColumn = await resolveInterestsColumn();
  const avatarColumn = await resolveAvatarColumn();
  const productivityColumn = await resolveProductivityColumn();

  const updatePayload: {
    name?: string;
    interests?: string;
    interest?: string;
    bio?: string;
    profile_bio?: string;
  } = {
    name: data.name,
  };
  if (interestsColumn === "interests") {
    updatePayload.interests = data.interests !== undefined ? JSON.stringify(data.interests) : undefined;
  } else if (interestsColumn === "interest") {
    updatePayload.interest = data.interests !== undefined ? JSON.stringify(data.interests) : undefined;
  }
  if (bioColumn === "bio") {
    updatePayload.bio = data.bio;
  } else if (bioColumn === "profile_bio") {
    updatePayload.profile_bio = data.bio;
  }

  let { data: updated, error } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", profile.id)
    .select(getProfileSelect(bioColumn, interestsColumn, avatarColumn, productivityColumn))
    .single();

  if (error && getErrorCode(error) === "22P02" && profile.email) {
    const retryByEmail = await supabase
      .from("users")
      .update(updatePayload)
      .eq("email", profile.email)
      .select(getProfileSelect(bioColumn, interestsColumn, avatarColumn, productivityColumn))
      .single();
    updated = retryByEmail.data;
    error = retryByEmail.error;
  }

  if (error) {
    throw error;
  }

  return normalizeProfile(
    withNormalizedProductivity(
      withNormalizedAvatar(withNormalizedInterests(withNormalizedBio(updated as ProfileRow, bioColumn), interestsColumn), avatarColumn),
      productivityColumn
    )
  );
}

export async function updateUserBio(newBio: string) {
  const profile = (await ensureProfile()) as ProfileRow;
  const supabase = getSupabase();
  const bioColumn = await resolveBioColumn();

  if (!bioColumn) {
    return { id: profile.id, bio: null };
  }

  let { data, error } = await supabase
    .from("users")
    .update(bioColumn === "bio" ? { bio: newBio } : { profile_bio: newBio })
    .eq("id", profile.id)
    .select(`id, ${bioColumn}`)
    .single();

  if (error && getErrorCode(error) === "22P02" && profile.email) {
    const retryByEmail = await supabase
      .from("users")
      .update(bioColumn === "bio" ? { bio: newBio } : { profile_bio: newBio })
      .eq("email", profile.email)
      .select(`id, ${bioColumn}`)
      .single();
    data = retryByEmail.data;
    error = retryByEmail.error;
  }

  if (error) {
    throw error;
  }

  return { id: data.id, bio: (data as ProfileRow)[bioColumn] ?? null };
}

export async function getProfileStats() {
  const user = await requireUser();
  const supabase = getSupabase();

  const [
    { data: pointRows, error: pointsError },
    { count: tasksCompleted, error: tasksError },
    { count: blogsWritten, error: blogsError },
    { count: moodCheckins, error: moodError },
  ] = await Promise.all([
    supabase.from("leaderboard_entries").select("points").eq("user_id", user.id),
    supabase
      .from("todo_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completed", true),
    supabase
      .from("blog_posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("mood_check_ins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if (pointsError || tasksError || blogsError || moodError) {
    throw pointsError || tasksError || blogsError || moodError;
  }

  const totalPoints = (pointRows ?? []).reduce((sum, row) => sum + row.points, 0);
  const totalTasks = tasksCompleted ?? 0;
  const totalBlogs = blogsWritten ?? 0;
  const totalMoods = moodCheckins ?? 0;

  const badges: string[] = [];
  if (totalPoints >= 100) badges.push("Point Collector");
  if (totalTasks >= 10) badges.push("Task Master");
  if (totalBlogs >= 1) badges.push("Blogger");
  if (totalMoods >= 7) badges.push("Mindful");

  return {
    totalPoints,
    tasksCompleted: totalTasks,
    blogsWritten: totalBlogs,
    moodCheckins: totalMoods,
    badges,
  };
}

export async function getDailyRecap() {
  const user = await requireUser();
  const supabase = getSupabase();
  const startOfDay = startOfTodayIso();

  const [
    { data: tasksToday, error: tasksError },
    { data: pointsToday, error: pointsError },
    { data: moodToday, error: moodError },
  ] = await Promise.all([
    supabase
      .from("todo_items")
      .select("title, completed, category, updated_at")
      .eq("user_id", user.id)
      .gte("updated_at", startOfDay)
      .order("updated_at", { ascending: false }),
    supabase
      .from("leaderboard_entries")
      .select("points")
      .eq("user_id", user.id)
      .eq("date", startOfDay)
      .maybeSingle(),
    supabase
      .from("mood_check_ins")
      .select("label")
      .eq("user_id", user.id)
      .gte("created_at", startOfDay)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (tasksError || pointsError || moodError) {
    throw tasksError || pointsError || moodError;
  }

  const completedTasks = (tasksToday ?? []).filter((task) => task.completed).length;

  return {
    tasksCompleted: completedTasks,
    totalTasks: tasksToday?.length ?? 0,
    pointsEarned: pointsToday?.points ?? 0,
    mood: moodToday?.label ?? null,
    timeStudied: "0 hr 0 min",
    activities: (tasksToday ?? []).map((task) => ({
      title: task.title,
      completed: task.completed,
      category: task.category,
      time: task.updated_at,
    })),
  };
}

export async function getMyBlogs() {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getPublicBlogs() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, content, is_public, created_at, users(name)")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createBlog(title: string, content: string, isPublic = true) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      user_id: user.id,
      title,
      content,
      is_public: isPublic,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await addDailyPoints(user.id, 20);
  return data;
}

export async function deleteBlog(blogId: string) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", blogId)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  return { success: true };
}

# React Native version of `profile.ts`, `user.ts`, and `help.ts`

This note converts the logic in:

- [src/lib/actions/profile.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/lib/actions/profile.ts)
- [src/lib/actions/user.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/lib/actions/user.ts)
- [src/lib/actions/help.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/lib/actions/help.ts)

from Next.js server actions into React Native-friendly Supabase code.

The original files rely on:

- `"use server"`
- `auth()` from NextAuth
- `prisma`
- `revalidatePath()`

Those are server-only patterns. In React Native, the equivalent is:

1. Use `supabase.auth.getUser()` for auth.
2. Query/update Postgres tables through `supabase.from(...)`.
3. Refetch or update local/query-cache state after mutations.
4. Enforce ownership and permissions through RLS policies.

## 1. Known mismatches in the current web code

Two issues are worth calling out before converting:

- [src/lib/actions/profile.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/lib/actions/profile.ts) returns `moodToday?.emoji` in `getDailyRecap()`, but [prisma/schema.prisma](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/prisma/schema.prisma) defines `MoodCheckIn` with `label`, not `emoji`.
- [src/lib/actions/help.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/lib/actions/help.ts) imports `prisma` as a default export, while [src/lib/prisma.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/lib/prisma.ts) exports a named `prisma`.

The React Native examples below use the schema-backed names, especially `label` for moods.

## 2. Supabase client for React Native

```ts
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

Use the anon key only. Do not use the service role key currently embedded in [src/supabase-client.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/supabase-client.ts) from a mobile app.

## 3. React Native + Supabase version

Assumptions:

- `users`, `leaderboard_entries`, `todo_items`, `blog_posts`, `mood_check_ins`, `help_requests`, and `help_responses` exist in Supabase.
- Columns use snake_case.
- Foreign keys exist so nested selects work.

```ts
import { supabase } from "../supabase";

export type HelpType = "item" | "wtf" | "prof" | "advice";

async function requireUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Unauthorized");

  return user;
}

// ==================== PROFILE ====================

export async function getProfile() {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, name, email, bio, interests, profile_pic, productivity_streak, created_at"
    )
    .eq("id", user.id)
    .single();

  if (error) throw error;

  return {
    ...data,
    interests: parseInterests(data.interests),
  };
}

export async function updateProfile(data: {
  name?: string;
  bio?: string;
  interests?: string[];
}) {
  const user = await requireUser();

  const { data: updated, error } = await supabase
    .from("users")
    .update({
      name: data.name,
      bio: data.bio,
      interests:
        data.interests !== undefined ? JSON.stringify(data.interests) : undefined,
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;

  return {
    ...updated,
    interests: parseInterests(updated.interests),
  };
}

export async function updateUserBio(newBio: string) {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("users")
    .update({ bio: newBio })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProfileStats() {
  const user = await requireUser();

  const [
    { data: pointsRows, error: pointsError },
    { count: tasksCompleted, error: tasksError },
    { count: blogsWritten, error: blogsError },
    { count: moodCheckins, error: moodsError },
  ] = await Promise.all([
    supabase
      .from("leaderboard_entries")
      .select("points")
      .eq("user_id", user.id),
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

  if (pointsError) throw pointsError;
  if (tasksError) throw tasksError;
  if (blogsError) throw blogsError;
  if (moodsError) throw moodsError;

  const totalPoints = (pointsRows ?? []).reduce((sum, row) => sum + row.points, 0);
  const completedTasks = tasksCompleted ?? 0;
  const totalBlogs = blogsWritten ?? 0;
  const totalMoods = moodCheckins ?? 0;

  const badges: string[] = [];
  if (totalPoints >= 100) badges.push("🌟 Point Collector");
  if (completedTasks >= 10) badges.push("✅ Task Master");
  if (totalBlogs >= 1) badges.push("✍️ Blogger");
  if (totalMoods >= 7) badges.push("🧘 Mindful");

  return {
    totalPoints,
    tasksCompleted: completedTasks,
    blogsWritten: totalBlogs,
    moodCheckins: totalMoods,
    badges,
  };
}

export async function getDailyRecap() {
  const user = await requireUser();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = today.toISOString();

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
      .select("label, created_at")
      .eq("user_id", user.id)
      .gte("created_at", startOfDay)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (tasksError) throw tasksError;
  if (pointsError) throw pointsError;
  if (moodError) throw moodError;

  const completedTasks = (tasksToday ?? []).filter((task) => task.completed).length;
  const totalTasks = tasksToday?.length ?? 0;

  return {
    tasksCompleted: completedTasks,
    totalTasks,
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

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createBlog(
  title: string,
  content: string,
  isPublic = true
) {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      user_id: user.id,
      title,
      content,
      is_public: isPublic,
    })
    .select()
    .single();

  if (error) throw error;

  await addPoints(user.id, 20);
  return data;
}

export async function deleteBlog(blogId: string) {
  const user = await requireUser();

  const { data: blog, error: fetchError } = await supabase
    .from("blog_posts")
    .select("id, user_id")
    .eq("id", blogId)
    .single();

  if (fetchError) throw fetchError;
  if (!blog || blog.user_id !== user.id) {
    throw new Error("Blog not found");
  }

  const { error: deleteError } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", blogId);

  if (deleteError) throw deleteError;
  return { success: true };
}

// ==================== HELP ====================

export async function createHelpRequest(
  type: HelpType,
  title: string,
  description?: string
) {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("help_requests")
    .insert({
      user_id: user.id,
      type,
      title,
      description: description ?? null,
      status: "open",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getHelpRequests(type?: HelpType, limit = 10) {
  let query = supabase
    .from("help_requests")
    .select(
      `
      id,
      type,
      title,
      description,
      status,
      created_at,
      updated_at,
      user:users(name, profile_pic),
      responses:help_responses(*)
    `
    )
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getMyHelpRequests() {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("help_requests")
    .select(
      `
      id,
      type,
      title,
      description,
      status,
      created_at,
      updated_at,
      responses:help_responses(*)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function respondToHelp(helpRequestId: string, content: string) {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("help_responses")
    .insert({
      help_request_id: helpRequestId,
      responder_id: user.id,
      content,
    })
    .select()
    .single();

  if (error) throw error;

  await addPoints(user.id, 15);
  return data;
}

export async function resolveHelpRequest(helpRequestId: string) {
  const user = await requireUser();

  const { data: helpRequest, error: fetchError } = await supabase
    .from("help_requests")
    .select("id, user_id")
    .eq("id", helpRequestId)
    .single();

  if (fetchError) throw fetchError;
  if (!helpRequest || helpRequest.user_id !== user.id) {
    throw new Error("Help request not found");
  }

  const { data, error } = await supabase
    .from("help_requests")
    .update({ status: "resolved" })
    .eq("id", helpRequestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function addPoints(userId: string, points: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = today.toISOString();

  const { data: existing, error: fetchError } = await supabase
    .from("leaderboard_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    const { error: updateError } = await supabase
      .from("leaderboard_entries")
      .update({ points: existing.points + points })
      .eq("id", existing.id);

    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await supabase.from("leaderboard_entries").insert({
    user_id: userId,
    points,
    date,
  });

  if (insertError) throw insertError;
}

function parseInterests(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
```

## 4. Main differences when using Supabase in React Native

### Auth changes from server session to client session

Original:

```ts
const session = await auth();
if (!session?.user?.id) throw new Error("Unauthorized");
```

React Native with Supabase:

```ts
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) throw new Error("Unauthorized");
```

Next.js resolves auth on the server. React Native stores auth state on-device, usually in `AsyncStorage`.

### Prisma models become table-first Supabase queries

Original code uses model APIs like:

```ts
prisma.user.update(...)
prisma.helpRequest.findMany(...)
prisma.blogPost.create(...)
```

Supabase uses direct table access:

```ts
supabase.from("users").update(...)
supabase.from("help_requests").select(...)
supabase.from("blog_posts").insert(...)
```

That means you work with actual SQL table and column names instead of Prisma model names.

### `revalidatePath()` has no React Native equivalent

`profile.ts` and `help.ts` both depend on `revalidatePath()` to refresh pages after writes.

React Native has no route-cache invalidation API. After `updateProfile()`, `createBlog()`, `createHelpRequest()`, `respondToHelp()`, or `resolveHelpRequest()`, you must:

- update local state
- invalidate your React Query cache
- or refetch the affected screens manually

### RLS becomes the core security boundary

With Prisma server actions, the database is never exposed directly to the client.

With Supabase in React Native, the app makes DB requests itself, so you must enforce ownership with Row Level Security. For these files, that especially means:

- users can only update their own `users` row
- users can only delete their own blogs
- users can only resolve their own help requests
- users can only insert help responses as themselves
- users can only read profile/help/blog data that your product intends to expose

### Aggregation is more manual

`getProfileStats()` uses Prisma aggregate/count helpers. Supabase can do this, but it is usually more manual:

- sums may require fetching rows and reducing client-side, or using a SQL view/RPC
- counts use `select("*", { count: "exact", head: true })`

For screens like profile dashboards, a SQL view or RPC often becomes cleaner than many separate client-side queries.

### JSON and date handling are less opinionated

`interests` is stored in the Prisma app as a JSON string, so in Supabase you need to decide whether to:

- keep it as a text column containing JSON strings
- or migrate it to a proper `jsonb` array column

If you keep the current shape, the client has to `JSON.parse()` and `JSON.stringify()` it manually.

Dates also differ:

- Prisma usually returns `Date` objects in server code
- Supabase typically returns ISO strings

That matters for fields like `created_at`, `updated_at`, and the daily recap timeline.

### Naming changes are everywhere

Prisma code uses camelCase:

- `profilePic`
- `productivityStreak`
- `helpRequestId`
- `isPublic`

Supabase schemas usually use snake_case:

- `profile_pic`
- `productivity_streak`
- `help_request_id`
- `is_public`

The migration is mostly mechanical, but it touches every query and every returned object shape.

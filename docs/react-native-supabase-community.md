# React Native version of `src/lib/actions/community.ts`

The original file at [src/lib/actions/community.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/lib/actions/community.ts) is a Next.js server action file. In React Native, the Supabase version must remove:

- `"use server"`
- `auth()` from NextAuth
- `prisma`
- `revalidatePath()`

and replace them with client-side Supabase auth plus direct table queries.

## 1. Supabase client for React Native

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

Use the anon key only on mobile. Do not reuse the service role key currently present in [src/supabase-client.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/supabase-client.ts).

## 2. React Native + Supabase community actions

Assumptions:

- `study_groups`, `study_group_members`, `campus_locations`, `location_reviews`, `blog_posts`, and `leaderboard_entries` exist in Supabase.
- Foreign keys are set up so embedded selects work.
- Column names use snake_case.

```ts
import { supabase } from "../supabase";

async function requireUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Unauthorized");

  return user;
}

// ==================== STUDY GROUPS ====================

export async function createStudyGroup(name: string, description?: string) {
  const user = await requireUser();

  const { data: group, error: groupError } = await supabase
    .from("study_groups")
    .insert({
      name,
      description: description ?? null,
      created_by_id: user.id,
    })
    .select()
    .single();

  if (groupError) throw groupError;

  const { error: memberError } = await supabase.from("study_group_members").insert({
    user_id: user.id,
    study_group_id: group.id,
  });

  if (memberError) throw memberError;
  return group;
}

export async function getStudyGroups(search?: string) {
  let query = supabase
    .from("study_groups")
    .select(
      `
      id,
      name,
      description,
      created_at,
      created_by:users!study_groups_created_by_id_fkey(name),
      members:study_group_members(count)
    `
    )
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []).map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    createdBy: group.created_by?.name ?? null,
    memberCount: group.members?.[0]?.count ?? 0,
    createdAt: group.created_at,
  }));
}

export async function joinStudyGroup(groupId: string) {
  const user = await requireUser();

  const { data: existing, error: existingError } = await supabase
    .from("study_group_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("study_group_id", groupId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) throw new Error("Already a member");

  const { error } = await supabase.from("study_group_members").insert({
    user_id: user.id,
    study_group_id: groupId,
  });

  if (error) throw error;

  await addPoints(user.id, 5);
  return { success: true };
}

export async function leaveStudyGroup(groupId: string) {
  const user = await requireUser();

  const { error } = await supabase
    .from("study_group_members")
    .delete()
    .eq("user_id", user.id)
    .eq("study_group_id", groupId);

  if (error) throw error;
  return { success: true };
}

export async function getMyGroups() {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("study_group_members")
    .select(
      `
      joined_at,
      study_group:study_groups(
        id,
        name,
        description,
        members:study_group_members(count)
      )
    `
    )
    .eq("user_id", user.id);

  if (error) throw error;

  return (data ?? []).map((membership) => ({
    id: membership.study_group.id,
    name: membership.study_group.name,
    description: membership.study_group.description,
    memberCount: membership.study_group.members?.[0]?.count ?? 0,
    joinedAt: membership.joined_at,
  }));
}

// ==================== CAMPUS LOCATIONS ====================

export async function getCampusLocations() {
  const { data, error } = await supabase
    .from("campus_locations")
    .select(
      `
      id,
      name,
      type,
      description,
      is_open,
      reviews:location_reviews(rating)
    `
    )
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((location) => {
    const ratings = location.reviews ?? [];
    const total = ratings.reduce((sum, review) => sum + review.rating, 0);

    return {
      id: location.id,
      name: location.name,
      type: location.type,
      description: location.description,
      isOpen: location.is_open,
      avgRating: ratings.length > 0 ? total / ratings.length : 0,
      reviewCount: ratings.length,
    };
  });
}

export async function updateLocationStatus(locationId: string, isOpen: boolean) {
  const user = await requireUser();

  const { error } = await supabase
    .from("campus_locations")
    .update({ is_open: isOpen })
    .eq("id", locationId);

  if (error) throw error;

  await addPoints(user.id, 2);
  return { success: true };
}

export async function createCampusLocation(
  name: string,
  type: string,
  description?: string
) {
  await requireUser();

  const { data, error } = await supabase
    .from("campus_locations")
    .insert({
      name,
      type,
      description: description ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function reviewLocation(
  locationId: string,
  rating: number,
  comment?: string
) {
  const user = await requireUser();

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const { data, error } = await supabase
    .from("location_reviews")
    .insert({
      location_id: locationId,
      user_id: user.id,
      rating,
      comment: comment ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  await addPoints(user.id, 10);
  return data;
}

export async function getLocationReviews(locationId: string) {
  const { data, error } = await supabase
    .from("location_reviews")
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      user:users(name, profile_pic)
    `
    )
    .eq("location_id", locationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ==================== EXPLORE ====================

export async function getPublicBlogs(limit = 10) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      `
      id,
      title,
      content,
      created_at,
      updated_at,
      is_public,
      user:users(name, profile_pic)
    `
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

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
```

## 3. Main differences when using Supabase in React Native

### Auth moves from server session to mobile session

Original code:

```ts
const session = await auth();
if (!session?.user?.id) {
  throw new Error("Unauthorized");
}
```

React Native with Supabase:

```ts
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  throw new Error("Unauthorized");
}
```

In the Next.js version, auth is server-resolved. In React Native, auth state is held in the app and usually persisted in `AsyncStorage`.

### Prisma relations become embedded Supabase selects

Prisma can express nested includes and counts directly:

```ts
include: {
  createdBy: { select: { name: true } },
  _count: { select: { members: true } },
}
```

With Supabase, you typically write relation-aware selects such as:

```ts
.select(`
  id,
  name,
  created_by:users!study_groups_created_by_id_fkey(name),
  members:study_group_members(count)
`)
```

This is one of the biggest practical differences. Prisma uses typed model relations. Supabase uses table names, foreign keys, and PostgREST select syntax.

### `revalidatePath()` disappears

Original code revalidates pages like `/community` and `/explore`.

React Native has no Next.js route cache layer, so after `createStudyGroup`, `joinStudyGroup`, `reviewLocation`, or `updateLocationStatus`, you must:

- update local component state
- invalidate your client cache if using React Query
- or refetch the affected lists

### Security depends on RLS, not server isolation

In the web server-action version, Prisma runs on the server, so the client never touches the database directly.

In the React Native + Supabase version, the app makes database calls itself. That means protection must come from:

- Supabase Auth
- Row Level Security policies
- careful table policies for insert/update/delete

For this file specifically, RLS matters for:

- only allowing a user to insert/delete their own `study_group_members` rows
- restricting who can update `campus_locations.is_open`
- restricting who can insert `location_reviews`
- optionally controlling who can create `campus_locations`

### Naming changes are mechanical but pervasive

Prisma code uses camelCase:

- `createdById`
- `studyGroupId`
- `profilePic`
- `isPublic`

Supabase schemas usually use snake_case:

- `created_by_id`
- `study_group_id`
- `profile_pic`
- `is_public`

This affects every insert, filter, select, and returned object shape.

### Dates come back as strings

Prisma usually materializes `DateTime` values as `Date` objects in server code.

Supabase typically returns ISO strings like:

```ts
"2026-03-24T11:15:00.000Z"
```

If your React Native UI needs date formatting or comparisons, parse or normalize them in the client.

### Aggregation is less ergonomic

Prisma makes member counts and relation data straightforward through `_count` and `include`.

With Supabase, counts and aggregates are possible, but the query shape is usually less ergonomic and more tightly coupled to table names and foreign key names. For more complex community pages, it is often cleaner to:

- create SQL views
- create RPC functions
- or fetch base rows and derive summary fields in client code

That tradeoff becomes more noticeable in `getStudyGroups()` and `getCampusLocations()`.

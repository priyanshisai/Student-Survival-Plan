# React Native version of `src/lib/actions/mood.ts`

The original file at [src/lib/actions/mood.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/lib/actions/mood.ts) is a Next.js server action. In React Native, the equivalent implementation must remove:

- `"use server"`
- `auth()` from NextAuth
- `prisma`
- `revalidatePath()`

and replace them with Supabase Auth plus direct table queries.

Important: there is a mismatch in the current web code and schema.

- [src/lib/actions/mood.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/lib/actions/mood.ts) creates a mood row with `emoji`.
- [prisma/schema.prisma](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/prisma/schema.prisma) defines `MoodCheckIn` with `label`, not `emoji`.

For the React Native example below, I use `label` because that matches the schema. If your Supabase table actually stores `emoji`, rename that column in the code.

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

Use the anon key on mobile. Do not use the service role key from [src/supabase-client.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/supabase-client.ts).

## 2. React Native + Supabase mood actions

Assumption: your Supabase tables are `mood_check_ins` and `leaderboard_entries`, with snake_case columns mirroring the Prisma models.

```ts
import { supabase } from "../supabase";

export type MoodCheckIn = {
  id: string;
  user_id: string;
  label: string;
  note: string | null;
  created_at: string;
};

async function requireUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Unauthorized");

  return user;
}

export async function createMoodCheckIn(label: string, note?: string) {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("mood_check_ins")
    .insert({
      user_id: user.id,
      label,
      note: note ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  await updateUserPoints(user.id, 5);
  return data;
}

export async function getMoodHistory(limit = 7) {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("mood_check_ins")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getTodaysMood() {
  const user = await requireUser();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("mood_check_ins")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function updateUserPoints(userId: string, points: number) {
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

### Auth source changes

Original server action:

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

In Next.js, auth state is resolved on the server. In React Native, auth state lives in the app and is typically persisted in `AsyncStorage`.

### Prisma queries become table queries

Original:

```ts
await prisma.moodCheckIn.create(...)
await prisma.moodCheckIn.findMany(...)
await prisma.moodCheckIn.findFirst(...)
```

React Native with Supabase:

```ts
await supabase.from("mood_check_ins").insert(...)
await supabase.from("mood_check_ins").select(...)
```

Prisma gives you model methods. Supabase gives you a PostgREST query builder over real tables and columns.

### No `revalidatePath()`

Original:

```ts
revalidatePath("/home");
revalidatePath("/profile");
```

That API is specific to Next.js route/data caching. In React Native there is no route cache invalidation layer. After creating a mood check-in, you update local state, invalidate a query cache like React Query, or manually refetch.

### Security shifts to RLS

With the current server action, the database is protected because all queries execute on the server.

With Supabase from React Native, database requests come directly from the app. Protection must come from:

- Supabase Auth
- Row Level Security policies
- the anon key only

If RLS is missing or loose, a mobile client can read or write more than it should.

### Naming differences

Your Prisma code uses camelCase fields like:

- `userId`
- `createdAt`

Supabase schemas commonly use snake_case:

- `user_id`
- `created_at`

This is a mechanical but important migration difference.

### Date handling differences

Prisma `DateTime` values are usually materialized as `Date` objects in server-side code.

Supabase commonly returns strings like:

```ts
"2026-03-24T10:30:00.000Z"
```

So in React Native you often parse dates in the UI layer if you need `Date` methods.

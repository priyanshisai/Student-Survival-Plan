# React Native version of `src/lib/actions/todos.ts`

The original file at [src/lib/actions/todos.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/lib/actions/todos.ts) is a Next.js server action. React Native cannot use:

- `"use server"`
- `auth()` from NextAuth
- `prisma` on the client
- `revalidatePath()` from Next.js

With Supabase in React Native, the equivalent pattern is:

1. Create a mobile Supabase client.
2. Read the current user from `supabase.auth`.
3. Query Postgres tables directly with `.from(...).select()/insert()/update()/delete()`.
4. Update local UI state manually, or refetch after mutations.

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

Important: use the anonymous public key on mobile, not the service role key.

## 2. React Native + Supabase todo actions

Assumption: your Supabase tables are `todo_items` and `leaderboard_entries` with fields equivalent to the Prisma models. If your actual table names are different, change `.from("...")`.

```ts
import { supabase } from "../supabase";

export type TodoCategory = "health" | "study" | "reminder" | "skill";

export type TodoItem = {
  id: string;
  user_id: string;
  title: string;
  category: TodoCategory;
  completed: boolean;
  due_date: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
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

export async function createTodo(
  title: string,
  category: TodoCategory,
  dueDate?: Date
) {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("todo_items")
    .insert({
      user_id: user.id,
      title,
      category,
      due_date: dueDate ? dueDate.toISOString() : null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTodos(category?: TodoCategory) {
  const user = await requireUser();

  let query = supabase
    .from("todo_items")
    .select("*")
    .eq("user_id", user.id)
    .order("completed", { ascending: true })
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getActiveTodos() {
  const user = await requireUser();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("todo_items")
    .select("*")
    .eq("user_id", user.id)
    .or(
      `completed.eq.false,and(completed.eq.true,updated_at.gte.${today.toISOString()})`
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function toggleTodo(todoId: string) {
  const user = await requireUser();

  const { data: todo, error: fetchError } = await supabase
    .from("todo_items")
    .select("*")
    .eq("id", todoId)
    .eq("user_id", user.id)
    .single();

  if (fetchError) throw fetchError;
  if (!todo) throw new Error("Todo not found");

  const { data: updatedTodo, error: updateError } = await supabase
    .from("todo_items")
    .update({ completed: !todo.completed })
    .eq("id", todoId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateError) throw updateError;

  if (updatedTodo.completed) {
    await addPoints(user.id, 10);
  }

  return updatedTodo;
}

export async function deleteTodo(todoId: string) {
  const user = await requireUser();

  const { error } = await supabase
    .from("todo_items")
    .delete()
    .eq("id", todoId)
    .eq("user_id", user.id);

  if (error) throw error;
  return { success: true };
}

export async function getTodoStats() {
  const user = await requireUser();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [{ count: completed, error: completedError }, { count: pending, error: pendingError }] =
    await Promise.all([
      supabase
        .from("todo_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("updated_at", today.toISOString()),
      supabase
        .from("todo_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", false),
    ]);

  if (completedError) throw completedError;
  if (pendingError) throw pendingError;

  return {
    completed: completed ?? 0,
    total: (completed ?? 0) + (pending ?? 0),
  };
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

## 3. Main Supabase differences in React Native

### Auth

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

### Database access

Original:

```ts
await prisma.todoItem.findMany(...)
await prisma.todoItem.create(...)
```

React Native with Supabase:

```ts
await supabase.from("todo_items").select(...)
await supabase.from("todo_items").insert(...)
```

### Cache invalidation

Original:

```ts
revalidatePath("/checklist");
```

React Native has no route cache invalidation API. After a mutation, update component state, invalidate your query cache, or refetch.

### Security model

With Prisma server actions, your database is protected because queries run only on the server.

With Supabase in React Native, queries run from the app, so you must rely on:

- Supabase Auth
- Row Level Security policies
- the anon key only

Do not ship a service role key to React Native. Your current [src/supabase-client.ts](/Users/priyanshi_sai/WebstormProjects/student-survival-plan/src/supabase-client.ts) contains a service role key, which would fully expose your database if reused in a mobile app.

### Naming and dates

Prisma models typically use camelCase fields in TypeScript like `userId`, `dueDate`, `createdAt`.

Supabase tables usually use snake_case columns like `user_id`, `due_date`, `created_at`.

Prisma returns JavaScript `Date` objects for `DateTime` fields. Supabase returns ISO date strings unless you transform them yourself.

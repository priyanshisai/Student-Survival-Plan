import { requireUser } from "../../../lib/supabase/auth";
import { getSupabase } from "../../../lib/supabase/client";
import { addDailyPoints } from "../../../lib/supabase/points";
import { startOfTodayIso } from "../../../lib/utils/date";

export type TodoCategory = "health" | "study" | "reminder" | "skill";

export async function createTodo(title: string, category: TodoCategory, dueDate?: Date) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("todo_items")
    .insert({
      user_id: user.id,
      title,
      category,
      due_date: dueDate ? dueDate.toISOString() : null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getTodos(category?: TodoCategory) {
  const user = await requireUser();
  const supabase = getSupabase();

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

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getActiveTodos() {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("todo_items")
    .select("*")
    .eq("user_id", user.id)
    .or(`completed.eq.false,and(completed.eq.true,updated_at.gte.${startOfTodayIso()})`)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function toggleTodo(todoId: string) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data: todo, error: fetchError } = await supabase
    .from("todo_items")
    .select("id, completed")
    .eq("id", todoId)
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const { data: updatedTodo, error: updateError } = await supabase
    .from("todo_items")
    .update({ completed: !todo.completed })
    .eq("id", todoId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError) {
    throw updateError;
  }

  if (updatedTodo.completed) {
    await addDailyPoints(user.id, 10);
  }

  return updatedTodo;
}

export async function deleteTodo(todoId: string) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { error } = await supabase
    .from("todo_items")
    .delete()
    .eq("id", todoId)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  return { success: true };
}

export async function getTodoStats() {
  const user = await requireUser();
  const supabase = getSupabase();
  const today = startOfTodayIso();

  const [{ count: completed, error: completedError }, { count: pending, error: pendingError }] =
    await Promise.all([
      supabase
        .from("todo_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("updated_at", today),
      supabase
        .from("todo_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", false),
    ]);

  if (completedError || pendingError) {
    throw completedError || pendingError;
  }

  return {
    completed: completed ?? 0,
    total: (completed ?? 0) + (pending ?? 0),
  };
}

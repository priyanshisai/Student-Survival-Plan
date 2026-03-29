import { requireUser } from "../../../lib/supabase/auth";
import { getSupabase } from "../../../lib/supabase/client";
import { addDailyPoints } from "../../../lib/supabase/points";
import { startOfTodayIso } from "../../../lib/utils/date";

export async function createMoodCheckIn(label: string, note?: string) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data, error } = await supabase
      .from("mood_check_ins")
      .insert({ user_id: user.id, label, note: note ?? null })
      .select("*")
      .single();

  if (error) throw error;

  addDailyPoints(user.id, 5).catch(console.error);

  return data;
}

export async function getMoodHistory(limit = 7) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("mood_check_ins")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getTodaysMood() {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("mood_check_ins")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", startOfTodayIso())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

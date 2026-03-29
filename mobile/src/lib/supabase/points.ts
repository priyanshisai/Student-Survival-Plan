import { getSupabase } from "./client";
import { startOfTodayIso } from "../utils/date";

export async function addDailyPoints(userId: string, points: number) {
  const supabase = getSupabase();
  const date = startOfTodayIso();

  const { data: existing, error: fetchError } = await supabase
    .from("leaderboard_entries")
    .select("id, points")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("leaderboard_entries")
      .update({ points: existing.points + points })
      .eq("id", existing.id);

    if (updateError) {
      throw updateError;
    }

    return;
  }

  const { error: insertError } = await supabase.from("leaderboard_entries").insert({
    user_id: userId,
    points,
    date,
  });

  if (insertError) {
    throw insertError;
  }
}

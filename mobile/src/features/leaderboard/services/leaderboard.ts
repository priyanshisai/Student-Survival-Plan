import { requireUser } from "../../../lib/supabase/auth";
import { getSupabase } from "../../../lib/supabase/client";
import { startOfTodayIso } from "../../../lib/utils/date";

export async function getTodayLeaderboard(limit = 10) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("user_id, points, users(name, profile_pic)")
    .gte("date", startOfTodayIso())
    .order("points", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((entry, index) => ({
    rank: index + 1,
    userId: entry.user_id,
    name: entry.users?.[0]?.name ?? "Anonymous",
    profilePic: entry.users?.[0]?.profile_pic ?? null,
    points: entry.points,
  }));
}

export async function getAllTimeLeaderboard(limit = 10) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("leaderboard_entries").select("user_id, points");

  if (error) {
    throw error;
  }

  const totals = new Map<string, number>();
  for (const entry of data ?? []) {
    totals.set(entry.user_id, (totals.get(entry.user_id) ?? 0) + entry.points);
  }

  const sorted = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const users = await Promise.all(
    sorted.map(async ([userId]) => {
      const { data: user } = await supabase
        .from("users")
        .select("id, name, profile_pic")
        .eq("id", userId)
        .maybeSingle();

      return user;
    })
  );

  return sorted.map(([userId, points], index) => {
    const user = users.find((entry) => entry?.id === userId);

    return {
      rank: index + 1,
      userId,
      name: user?.name ?? "Anonymous",
      profilePic: user?.profile_pic ?? null,
      points,
    };
  });
}

export async function getMyRank() {
  const user = await requireUser();
  const supabase = getSupabase();
  const date = startOfTodayIso();

  const { data: myEntry, error } = await supabase
    .from("leaderboard_entries")
    .select("points")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!myEntry) {
    return { rank: null, points: 0 };
  }

  const { count, error: countError } = await supabase
    .from("leaderboard_entries")
    .select("*", { count: "exact", head: true })
    .gte("date", date)
    .gt("points", myEntry.points);

  if (countError) {
    throw countError;
  }

  return {
    rank: (count ?? 0) + 1,
    points: myEntry.points,
  };
}

export async function getUserStats() {
  const user = await requireUser();
  const supabase = getSupabase();
  const date = startOfTodayIso();

  const [
    { data: totalPointRows, error: totalPointsError },
    { data: todayPoints, error: todayPointsError },
    { count: tasksCompleted, error: tasksError },
    { data: streakRows, error: streakError },
  ] = await Promise.all([
    supabase.from("leaderboard_entries").select("points").eq("user_id", user.id),
    supabase
      .from("leaderboard_entries")
      .select("points")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle(),
    supabase
      .from("todo_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("updated_at", date),
    supabase
      .from("leaderboard_entries")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false }),
  ]);

  if (totalPointsError || todayPointsError || tasksError || streakError) {
    throw totalPointsError || todayPointsError || tasksError || streakError;
  }

  return {
    totalPoints: (totalPointRows ?? []).reduce((sum, entry) => sum + entry.points, 0),
    todayPoints: todayPoints?.points ?? 0,
    tasksCompleted: tasksCompleted ?? 0,
    streak: calculateStreak((streakRows ?? []).map((entry) => entry.date)),
  };
}

function calculateStreak(dates: string[]) {
  if (dates.length === 0) {
    return 0;
  }

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = 0; index < dates.length; index += 1) {
    const entryDate = new Date(dates[index]);
    entryDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - index);
    expectedDate.setHours(0, 0, 0, 0);

    if (entryDate.getTime() === expectedDate.getTime()) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}

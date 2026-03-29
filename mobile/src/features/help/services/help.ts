import { requireUser } from "../../../lib/supabase/auth";
import { getSupabase } from "../../../lib/supabase/client";
import { addDailyPoints } from "../../../lib/supabase/points";

export type HelpType = "item" | "wtf" | "prof" | "advice";

export async function createHelpRequest(type: HelpType, title: string, description?: string) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("help_requests")
    .insert({
      user_id: user.id,
      type,
      title,
      description: description ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getHelpRequests(type?: HelpType, limit = 10) {
  const supabase = getSupabase();
  let query = supabase
    .from("help_requests")
    .select("*, users(name, profile_pic), help_responses(*)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getMyHelpRequests() {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("help_requests")
    .select("*, help_responses(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function respondToHelp(helpRequestId: string, content: string) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("help_responses")
    .insert({
      help_request_id: helpRequestId,
      responder_id: user.id,
      content,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await addDailyPoints(user.id, 15);
  return data;
}

export async function resolveHelpRequest(helpRequestId: string) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("help_requests")
    .update({ status: "resolved" })
    .eq("id", helpRequestId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

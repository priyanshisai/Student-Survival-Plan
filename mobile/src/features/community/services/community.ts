import { requireUser } from "../../../lib/supabase/auth";
import { getSupabase } from "../../../lib/supabase/client";
import { addDailyPoints } from "../../../lib/supabase/points";

export async function createStudyGroup(name: string, description?: string) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data: group, error: groupError } = await supabase
    .from("study_groups")
    .insert({
      name,
      description: description ?? null,
      created_by_id: user.id,
    })
    .select("*")
    .single();

  if (groupError) {
    throw groupError;
  }

  const { error: memberError } = await supabase.from("study_group_members").insert({
    user_id: user.id,
    study_group_id: group.id,
  });

  if (memberError) {
    throw memberError;
  }

  return group;
}

export async function getStudyGroups(search?: string) {
  const supabase = getSupabase();
  let query = supabase
    .from("study_groups")
    .select("id, name, description, created_at, created_by_id")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data: groups, error } = await query;

  if (error) {
    throw error;
  }

  const result = await Promise.all(
    (groups ?? []).map(async (group) => {
      const [{ count: memberCount }, { data: creator }] = await Promise.all([
        supabase
          .from("study_group_members")
          .select("*", { count: "exact", head: true })
          .eq("study_group_id", group.id),
        supabase.from("profiles").select("name").eq("id", group.created_by_id).maybeSingle(),
      ]);

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        createdBy: creator?.name ?? null,
        memberCount: memberCount ?? 0,
        createdAt: group.created_at,
      };
    })
  );

  return result;
}

export async function joinStudyGroup(groupId: string) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data: existing, error: existingError } = await supabase
    .from("study_group_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("study_group_id", groupId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    throw new Error("Already a member");
  }

  const { error } = await supabase.from("study_group_members").insert({
    user_id: user.id,
    study_group_id: groupId,
  });

  if (error) {
    throw error;
  }

  await addDailyPoints(user.id, 5);
  return { success: true };
}

export async function leaveStudyGroup(groupId: string) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { error } = await supabase
    .from("study_group_members")
    .delete()
    .eq("user_id", user.id)
    .eq("study_group_id", groupId);

  if (error) {
    throw error;
  }

  return { success: true };
}

export async function getMyGroups() {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data: memberships, error } = await supabase
    .from("study_group_members")
    .select("study_group_id, joined_at")
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  const groups = await Promise.all(
    (memberships ?? []).map(async (membership) => {
      const [{ data: group }, { count: memberCount }] = await Promise.all([
        supabase
          .from("study_groups")
          .select("id, name, description")
          .eq("id", membership.study_group_id)
          .single(),
        supabase
          .from("study_group_members")
          .select("*", { count: "exact", head: true })
          .eq("study_group_id", membership.study_group_id),
      ]);

      if (!group) {
        throw new Error("Study group not found");
      }

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        memberCount: memberCount ?? 0,
        joinedAt: membership.joined_at,
      };
    })
  );

  return groups;
}

export async function getCampusLocations() {
  const supabase = getSupabase();
  const { data: locations, error } = await supabase
    .from("campus_locations")
    .select("id, name, type, description, is_open")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  const result = await Promise.all(
    (locations ?? []).map(async (location) => {
      const { data: reviews } = await supabase
        .from("location_reviews")
        .select("rating")
        .eq("location_id", location.id);

      const ratings = reviews ?? [];
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
    })
  );

  return result;
}

export async function updateLocationStatus(locationId: string, isOpen: boolean) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { error } = await supabase
    .from("campus_locations")
    .update({ is_open: isOpen })
    .eq("id", locationId);

  if (error) {
    throw error;
  }

  await addDailyPoints(user.id, 2);
  return { success: true };
}

export async function createCampusLocation(name: string, type: string, description?: string) {
  await requireUser();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("campus_locations")
    .insert({
      name,
      type,
      description: description ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function reviewLocation(locationId: string, rating: number, comment?: string) {
  const user = await requireUser();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("location_reviews")
    .insert({
      location_id: locationId,
      user_id: user.id,
      rating,
      comment: comment ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

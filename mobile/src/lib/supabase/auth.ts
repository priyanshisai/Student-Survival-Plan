import { getSupabase } from "./client";

export async function requireUser() {
  const {
    data: { user },
    error,
  } = await getSupabase().auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

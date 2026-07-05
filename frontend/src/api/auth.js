import api from "./client";

// Call right after Firebase sign-in. Creates/refreshes the Mongo user record
// and returns the merged profile (plan, usage, historyCount, etc).
export async function syncUser() {
  const { data } = await api.post("/auth/sync");
  return data.user;
}

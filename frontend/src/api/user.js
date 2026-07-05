import api from "./client";

export async function getMe() {
  const { data } = await api.get("/user/me");
  return data.user;
}

export async function getUsage() {
  const { data } = await api.get("/user/usage");
  return data; // { usage, resetsInMs }
}

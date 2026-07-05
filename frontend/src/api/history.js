import api from "./client";

export async function listHistory() {
  const { data } = await api.get("/history");
  return data.items;
}

// payload: { filename, format, bgType, bgColor, resultFull (data URL), bgImageThumb? (data URL) }
export async function createHistoryItem(payload) {
  const { data } = await api.post("/history", payload);
  return data.item;
}

export async function deleteHistoryItem(id) {
  const { data } = await api.delete(`/history/${id}`);
  return data;
}

export async function clearHistory() {
  const { data } = await api.delete("/history");
  return data;
}

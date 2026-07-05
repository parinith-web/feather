import axios from "axios";
import { auth } from "../firebase";

// Base URL of the deployed backend, e.g. https://snapcut-backend.onrender.com
// Set VITE_API_URL in the frontend's .env (see .env.example). Falls back to
// localhost for local development against `npm run dev` in /backend.
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
});

// Attaches the current Firebase ID token to every outgoing request, forcing a
// refresh only when needed (getIdToken() caches internally and re-mints the
// token automatically as it nears expiry).
api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalizes backend error responses ({ error: "message" }) into a plain
// message string so callers can just do `catch (err) { toast.error(err.message) }`.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      "Something went wrong talking to the server.";
    return Promise.reject(new Error(message));
  }
);

export default api;

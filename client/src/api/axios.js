import axios from "axios";

// ============================================================
// Centralized Axios API client
// ============================================================
// Base URL resolution order:
//   1. VITE_API_BASE_URL, if set (Vercel Production/Preview env vars,
//      or a local .env file) — this is the primary, intended source.
//   2. If missing AND we're running on localhost, fall back to the
//      local Express server.
//   3. If missing in any other environment (a genuine misconfiguration),
//      fall back to the known-good production API URL rather than
//      silently resolving to a same-origin relative "/api" path that
//      does not exist on the frontend's own domain — that mismatch is
//      exactly what caused login to fail before this rebuild.
//
// Whatever value is used, it is normalized (trailing slash stripped)
// so a stray "/" in an env var can never produce a double-slash path
// like ".../api//auth/login".
function resolveBaseURL() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/+$/, "");
  }

  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (isLocalHost) {
    return "http://localhost:5000/api";
  }

  // Safety net for production if the env var is ever missing.
  return "https://coindrop-rewards-api-new.onrender.com/api";
}

export const API_BASE_URL = resolveBaseURL();

// Origin only (no "/api" suffix) — used to build absolute URLs for
// static assets served outside /api, such as uploaded screenshots
// under /uploads/...
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send/receive the httpOnly JWT cookie cross-origin
  headers: { "Content-Type": "application/json" },
});

export default api;

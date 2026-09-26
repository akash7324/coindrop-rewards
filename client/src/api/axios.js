import axios from "axios";

// The Vite dev server proxies "/api" to the Express backend (see vite.config.js),
// so a relative baseURL works in dev and in a same-origin production deploy.
// Set VITE_API_BASE_URL only if you host the API on a different origin.
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL,
  withCredentials: true, // send/receive the httpOnly JWT cookie
  headers: { "Content-Type": "application/json" },
});

export default api;

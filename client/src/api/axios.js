import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://coindrop-rewards-api-new.onrender.com/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

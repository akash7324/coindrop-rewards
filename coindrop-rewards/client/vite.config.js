import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the Express backend during local dev
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      // Forward uploaded screenshot requests to the backend as well
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});

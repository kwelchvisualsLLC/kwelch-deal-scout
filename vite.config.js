import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Pure static app — AI calls go straight from the browser to the Anthropic API
// (see src/lib/api.js). `base: "./"` makes it work under a GitHub Pages subpath.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { port: 5174 },
  build: { outDir: "dist" },
});

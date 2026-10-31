import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://yzdame.github.io",
  base: "/Pauline",
  output: "static",
  outDir: process.env.PAULINE_OUT_DIR ?? "./dist",
  vite: {
    cacheDir: ".cache/vite",
    optimizeDeps: {
      noDiscovery: true,
      include: [],
    },
  },
  build: {
    format: "directory",
  },
});

import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://yzdame.github.io",
  base: "/Pauline",
  output: "static",
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

import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://yzdame.github.io",
  base: "/Pauline",
  output: "static",
  build: {
    format: "directory",
  },
});

import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://yzdame.github.io",
  base: "/pauline",
  output: "static",
  build: {
    format: "directory",
  },
});

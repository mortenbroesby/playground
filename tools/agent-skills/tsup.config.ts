import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/cli.ts",
    "src/hooks/skills-metadata-hook.ts",
    "src/skills-smoke.test.ts",
    "src/skills-search.bench.ts",
  ],
  outDir: "dist",
  format: ["esm"],
  sourcemap: true,
  clean: true,
});

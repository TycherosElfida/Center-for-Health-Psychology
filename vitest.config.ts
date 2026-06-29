import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Native Vite tsconfig path resolution — replaces vite-tsconfig-paths plugin
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    // @ts-expect-error - Some versions of vitest types don't include environmentMatchGlobs
    environmentMatchGlobs: [
      // Server-side code runs in Node — no DOM needed
      ["src/server/**", "node"],
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/cypress/**",
      "**/e2e/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
      "**/.worktrees/**",
    ],
    // setupFiles: [],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/**/*.stories.*", "src/generated/**"],
    },
  },
});

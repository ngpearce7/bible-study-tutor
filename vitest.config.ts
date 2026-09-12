import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": process.cwd() } },
  test: { environment: "edge-runtime", include: ["convex/**/*.test.ts", "data/**/*.test.ts"] }
});

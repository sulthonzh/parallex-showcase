import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts", "src/**/*.test.ts"],
  },
  resolve: { alias: { "@": path.resolve(process.cwd(), "./src") } },
});

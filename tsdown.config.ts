import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  exports: true,
  publint: true,
  attw: {
    ignoreRules: ["cjs-resolves-to-esm"],
  },
})

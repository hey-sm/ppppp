import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/index.types.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  external: ["react", "react-dom", "react/jsx-runtime"],
  clean: true,
  silent: true,
});

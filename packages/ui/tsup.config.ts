import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/index.types.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  // React 作为 peerDependency，不打包进产物
  // 由消费者（apps/web）提供 React 实例，避免重复打包
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  clean: true,
  silent: true,
  // 组件内 import './X.css' 会被 tsup 合并为 dist/index.css
})

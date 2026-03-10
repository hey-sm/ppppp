import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite 7 配置
// @tailwindcss/vite 是 Tailwind CSS v4 的 Vite 插件
// resolve.alias 配置 @/ 路径别名，shadcn/ui 组件依赖此别名
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

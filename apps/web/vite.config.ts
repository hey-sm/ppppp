import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite 7 配置
// @tailwindcss/vite 是 Tailwind CSS v4 的 Vite 插件
// resolve.alias 配置 @/ 路径别名，shadcn/ui 组件依赖此别名
export default defineConfig(({ command }) => {
  const devAliases: Record<string, string> =
    command === 'serve'
      ? {
          // Dev-only: point workspace package imports to source for HMR.
          '@fluxp/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
          '@fluxp/ui/types': path.resolve(
            __dirname,
            '../../packages/ui/src/index.types.ts',
          ),
        }
      : {}

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        ...devAliases,
      },
    },
    optimizeDeps:
      command === 'serve'
        ? {
            // Prevent Vite from pre-bundling workspace libs so edits reflect without restart.
            exclude: ['@fluxp/ui', '@fluxp/ui/types'],
          }
        : undefined,
    server:
      command === 'serve'
        ? {
            fs: {
              // Allow serving files from the monorepo root (packages/*).
              allow: [path.resolve(__dirname, '../..')],
            },
          }
        : undefined,
  }
})

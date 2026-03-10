这是一份为您整合好的完整 Markdown 文档，您可以直接将其保存为 `CLAUDE.md` 或 `README.md`。

---

# Claude Code 项目指南

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 指令 (Commands)

```bash
# 开发环境 (通过 Turborepo 并行运行所有 package)
pnpm dev

# 构建
pnpm build

# 代码检查 (使用 oxlint，而非 ESLint)
pnpm lint                          # 通过 turbo 检查所有 package
pnpm lint:fix                      # 通过 turbo 自动修复
cd apps/web && pnpm lint           # 检查单个 package

# 代码格式化 (使用 oxfmt，而非 Prettier)
pnpm format                        # 格式化所有文件
pnpm format:check                  # CI 检查（不写入文件）

# 测试 (每个 package 使用 vitest)
pnpm test                          # 所有 package
cd packages/ui && pnpm test        # 单个 package
cd packages/ui && pnpm test:watch  # 监听模式

# 添加 shadcn/ui 组件
cd apps/web && pnpm dlx shadcn@latest add <component>

```

---

## 架构 (Architecture)

**Monorepo** 方案 — 使用 pnpm workspaces + Turborepo。包含四个 package：

| Package                                         | 用途                                                         | 构建工具     |
| ----------------------------------------------- | ------------------------------------------------------------ | ------------ |
| `apps/web` (`@fluxp/web`)                       | Vite + React 19 SPA 单页应用                                 | `vite`       |
| `packages/ui` (`@fluxp/ui`)                     | 组件库 (Button, VirtualList, MSchedule) — CSS 自包含         | `tsup` → ESM |
| `packages/logger-sdk` (`@fluxp/logger-sdk`)     | 日志采集，含中间件插件 (Fetch, Router, Click, ErrorBoundary) | `tsup` → ESM |
| `packages/perf-monitor` (`@fluxp/perf-monitor`) | 性能监控：Web Vitals, FPS, 内存, 长任务 (Long Tasks)         | `tsup` → ESM |

### Web 应用技术栈

- **路由**: TanStack Router — 类型安全，路由定义在 `apps/web/src/router.tsx`。
- 布局路由：`sidebarLayout` (主页/仪表盘)，`uiLabRoute` (独立路由，无侧边栏，包含 `/schedule`, `/virtual-list` 子路由)。

- **状态管理**: Zustand — `appStore` (主题/语言/颜色，持久化)，`logStore`，`perfStore`。
- **样式**: Tailwind CSS v4 (通过 `@tailwindcss/vite` 插件) + shadcn/ui (new-york 风格，zinc 基色，oklch 颜色)。
- **国际化**: react-i18next — 语言包位于 `apps/web/src/i18n/` 的 `zh.json` / `en.json`，默认中文。
- **图标**: lucide-react。
- **路径别名**: `@/` → `apps/web/src/`。

---

## SDK 初始化

两个 SDK 均在 `apps/web/src/main.tsx` 中 React 渲染前初始化：

- **Logger**: 使用中间件模式 (`setup(emit)` / `teardown()`)。
- **PerfMonitor**: 使用观察者模式 (`subscribe(callback)`)。
- 指标数据最终均流入 Zustand store 进行统一管理。

---

## 组件库 (@fluxp/ui)

- **特性**: 纯 React 组件，无运行时依赖。Peer deps 为 React 19。支持受控与非受控模式。
- **样式**: CSS 样式自包含（采用 BEM 命名规范，带 `fluxp-` 前缀）。
- **构建**: 使用 tsup 构建为 ESM 格式，包含 `.d.ts` 和 CSS。
- **开发依赖**: Turbo 的 `dev` 任务配置了 `"dependsOn": ["^build"]`，确保 Web 应用启动前已构建依赖包。CSS 文件与组件代码同目录存放。

**导出路径：**

```typescript
import { Button, VirtualList, MSchedule } from "@fluxp/ui"; // 运行时
import type { ButtonProps, MScheduleValue } from "@fluxp/ui/types"; // 仅类型
import "@fluxp/ui/styles.css"; // 组件样式
```

---

## 代码风格 (Code Style)

- **格式化工具**: oxfmt (`.oxfmtrc.json`) — 无分号，单引号，保留尾随逗号，100 字符行宽。
- **检查工具**: oxlint (`.oxlintrc.json`) — 开启 correctness 类别及 react/typescript/import/unicorn 插件。
- **TS**: 全程开启 TypeScript 严格模式。
- **编码偏好**: 优先使用**基于对象的变体映射 (Variant Mapping)**，而非 if-else 链（参考 Button 组件实现）。
- **集成追踪**: 在交互元素上使用 `data-track` 属性，以便 logger-sdk 进行自动化追踪。

### pnpm + 原生绑定 (Native Bindings)

oxlint 和 oxfmt 使用平台特定的原生绑定。在 Windows x64 环境下，`@oxlint/binding-win32-x64-msvc` 和 `@oxfmt/binding-win32-x64-msvc` 已显式列在根目录的 `devDependencies` 中，以解决 pnpm 处理可选依赖时的兼容性问题。

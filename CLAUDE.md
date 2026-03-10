# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (all packages in parallel via Turborepo)
pnpm dev

# Build
pnpm build

# Lint (oxlint, not ESLint)
pnpm lint                          # all packages via turbo
pnpm lint:fix                      # auto-fix via turbo
cd apps/web && pnpm lint           # single package

# Format (oxfmt, not Prettier)
pnpm format                        # format all files
pnpm format:check                  # CI check (no write)

# Test (vitest in each package)
pnpm test                          # all packages
cd packages/ui && pnpm test        # single package
cd packages/ui && pnpm test:watch  # watch mode

# Add shadcn/ui components
cd apps/web && pnpm dlx shadcn@latest add <component>
```

## Architecture

**Monorepo** — pnpm workspaces + Turborepo. Four packages:

| Package                                         | Purpose                                                                                               | Build        |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------ |
| `apps/web` (`@fluxp/web`)                       | Vite + React 19 SPA                                                                                   | `vite`       |
| `packages/ui` (`@fluxp/ui`)                     | Component library (Button, VirtualList, MSchedule) — CSS self-contained                              | `tsup` → ESM |
| `packages/logger-sdk` (`@fluxp/logger-sdk`)     | Log collection with middleware plugins (FetchInterceptor, RouterTracker, ClickTracker, ErrorBoundary) | `tsup` → ESM |
| `packages/perf-monitor` (`@fluxp/perf-monitor`) | Web Vitals, FPS, Memory, Long Tasks monitoring                                                        | `tsup` → ESM |

### Web App Stack

- **Routing**: TanStack Router — type-safe, routes in `apps/web/src/router.tsx`. Layout routes: `sidebarLayout` (Home/Dashboard), `uiLabRoute` (standalone, no sidebar with sub-routes `/schedule`, `/virtual-list`)
- **State**: Zustand — `appStore` (theme/lang/color, persisted), `logStore`, `perfStore`
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin) + shadcn/ui (new-york style, zinc base, oklch colors)
- **i18n**: react-i18next — `zh.json` / `en.json` in `apps/web/src/i18n/`, default Chinese
- **Icons**: lucide-react
- **Path alias**: `@/` → `apps/web/src/`

### SDK Initialization

Both SDKs initialize in `apps/web/src/main.tsx` before React renders. Logger uses middleware pattern (`setup(emit)` / `teardown()`); PerfMonitor uses observer pattern (`subscribe(callback)`). Metrics flow into Zustand stores.

### Component Library (`@fluxp/ui`)

Pure React components, no runtime deps. Peer deps: React 19. Each component supports both controlled and uncontrolled modes. CSS is self-contained (BEM naming with `fluxp-` prefix). Built with tsup to ESM + `.d.ts` + CSS.

Three export paths:
```ts
import { Button, VirtualList, MSchedule } from '@fluxp/ui'       // runtime
import type { ButtonProps, MScheduleValue } from '@fluxp/ui/types' // types only
import '@fluxp/ui/styles.css'                                      // component CSS
```

Turbo `dev` task has `"dependsOn": ["^build"]` — packages are built before the web app starts. CSS lives in `packages/ui/src/components/*.css`, co-located with each component.

## Code Style

- **Formatter**: oxfmt (`.oxfmtrc.json`) — no semicolons, single quotes, trailing commas, 100 char width
- **Linter**: oxlint (`.oxlintrc.json`) — correctness category + react/typescript/import/unicorn plugins
- TypeScript strict mode throughout
- Object-based variant mapping preferred over if-else chains (see Button component)
- `data-track` attributes on interactive elements for logger-sdk integration

### pnpm + native bindings

oxlint and oxfmt use platform-specific native bindings. On Windows x64, `@oxlint/binding-win32-x64-msvc` and `@oxfmt/binding-win32-x64-msvc` are explicitly listed in root devDependencies to work around pnpm's optional dependency resolution.

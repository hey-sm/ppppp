import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { DevToolsPanel } from '@/components/DevToolsPanel'
import { HomePage } from '@/pages/HomePage'
import { UILabLayout } from '@/pages/ui-lab/UILabLayout'
import { ScheduleDemo } from '@/pages/ui-lab/ScheduleDemo'
import { VirtualListDemo } from '@/pages/ui-lab/VirtualListDemo'
import { DashboardPage } from '@/pages/DashboardPage'

/** 侧边栏收起时显示的悬浮 fluxp 图标 */
function SidebarFloatingTrigger() {
  const { state, toggleSidebar } = useSidebar()
  if (state === 'expanded') return null
  return (
    <button
      onClick={toggleSidebar}
      className="fixed top-2 left-4 z-50 flex items-center gap-2 w-12 h-9"
      title="fluxp"
    >
      <img src="/favicon.svg" alt="" className="w-5 h-5 dark:invert shrink-0" />
      <span className="font-bold tracking-tight">fluxp</span>
    </button>
  )
}

// ── 根路由：纯 Outlet，不带布局 ──
const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// ── 带侧边栏的布局路由（Home / Dashboard 等主页面） ──
const sidebarLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'sidebar-layout',
  component: function SidebarLayout() {
    return (
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarFloatingTrigger />
        <SidebarInset>
          <main>
            <Outlet />
          </main>
          <DevToolsPanel />
        </SidebarInset>
      </SidebarProvider>
    )
  },
})

const homeRoute = createRoute({
  getParentRoute: () => sidebarLayout,
  path: '/',
  component: HomePage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => sidebarLayout,
  path: '/dashboard',
  component: DashboardPage,
})

// ── UI Lab：独立布局（不含全局侧边栏），内含子路由 ──
const uiLabRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ui-lab',
  component: UILabLayout,
})

const scheduleRoute = createRoute({
  getParentRoute: () => uiLabRoute,
  path: '/schedule',
  component: ScheduleDemo,
})

const virtualListRoute = createRoute({
  getParentRoute: () => uiLabRoute,
  path: '/virtual-list',
  component: VirtualListDemo,
})

// ── 构建路由树 ──
const routeTree = rootRoute.addChildren([
  sidebarLayout.addChildren([homeRoute, dashboardRoute]),
  uiLabRoute.addChildren([scheduleRoute, virtualListRoute]),
])

// ── 创建并导出 Router 实例 ──
export const router = createRouter({ routeTree })

// ── 类型注册 ──
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

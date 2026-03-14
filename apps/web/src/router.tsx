import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
} from "@tanstack/react-router";
import { AppDock } from "@/components/AppDock";
import { DevToolsPanel } from "@/components/DevToolsPanel";

const HomePage = lazyRouteComponent(
  () => import("@/pages/HomePage"),
  "HomePage",
);
const DashboardPage = lazyRouteComponent(
  () => import("@/pages/DashboardPage"),
  "DashboardPage",
);
const LinksPage = lazyRouteComponent(
  () => import("@/pages/LinksPage"),
  "LinksPage",
);
const UILabLayout = lazyRouteComponent(
  () => import("@/pages/ui-lab/UILabLayout"),
  "UILabLayout",
);
const ScheduleDemo = lazyRouteComponent(
  () => import("@/pages/ui-lab/ScheduleDemo"),
  "ScheduleDemo",
);
const RegionTreeDemo = lazyRouteComponent(
  () => import("@/pages/ui-lab/RegionTreeDemo"),
  "RegionTreeDemo",
);
const VirtualListDemo = lazyRouteComponent(
  () => import("@/pages/ui-lab/VirtualListDemo"),
  "VirtualListDemo",
);
const ChinaDivisionTreeDemo = lazyRouteComponent(
  () => import("@/pages/ui-lab/ChinaDivisionTreeDemo"),
  "ChinaDivisionTreeDemo",
);

// ── 根路由：�?Outlet，不带布局 ──
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <AppDock />
    </>
  ),
});

// ── 带侧边栏的布局路由（Home / Dashboard 等主页面�?──
const sidebarLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "sidebar-layout",
  component: function SidebarLayout() {
    return (
      <main className="min-h-svh">
        <Outlet />
        <DevToolsPanel />
      </main>
    );
  },
});

const homeRoute = createRoute({
  getParentRoute: () => sidebarLayout,
  path: "/",
  component: HomePage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => sidebarLayout,
  path: "/dashboard",
  component: DashboardPage,
});

const linksRoute = createRoute({
  getParentRoute: () => sidebarLayout,
  path: "/links",
  component: LinksPage,
});

// ── UI Lab：独立布局（不含全局侧边栏），内含子路由 ──
const uiLabRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ui-lab",
  component: UILabLayout,
});

const scheduleRoute = createRoute({
  getParentRoute: () => uiLabRoute,
  path: "/schedule",
  component: ScheduleDemo,
});

const regionTreeRoute = createRoute({
  getParentRoute: () => uiLabRoute,
  path: "/region-tree",
  component: RegionTreeDemo,
});

const virtualListRoute = createRoute({
  getParentRoute: () => uiLabRoute,
  path: "/virtual-list",
  component: VirtualListDemo,
});

const chinaDivisionTreeRoute = createRoute({
  getParentRoute: () => uiLabRoute,
  path: "/china-division-tree",
  component: ChinaDivisionTreeDemo,
});

// ── 构建路由�?──
const routeTree = rootRoute.addChildren([
  sidebarLayout.addChildren([homeRoute, dashboardRoute, linksRoute]),
  uiLabRoute.addChildren([
    scheduleRoute,
    regionTreeRoute,
    virtualListRoute,
    chinaDivisionTreeRoute,
  ]),
]);

// ── 创建并导�?Router 实例 ──
export const router = createRouter({ routeTree });

// ── 类型注册 ──
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

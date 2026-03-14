// ============================================================================
// 应用入口：初始化 Logger SDK + Perf Monitor + 渲染 React 应用
// ============================================================================
//
// 初始化顺序：
// 1. 创建 Logger 实例，注册所有中间件
// 2. 创建 PerfMonitor 实例，订阅性能数据
// 3. 渲染 React 应用
//
// 为什么在 main.tsx 而不是组件里初始化？
// - Logger 和 PerfMonitor 是全局单例，应该尽早启动
// - 组件可能被卸载重挂，但 SDK 应持续运行
// - 在入口初始化可以尽量捕获页面加载阶段的日志和性能数据

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./router";
import { ThemeProvider } from "./components/ThemeProvider";
import { useLogStore } from "./stores/logStore";
import { usePerfStore } from "./stores/perfStore";
import "./i18n/i18n";
import "./index.css";

// 自研 SDK 引入
import {
  createLogger,
  FetchInterceptor,
  RouterTracker,
  ClickTracker,
  ErrorBoundary,
} from "@fluxp/logger-sdk";
import { createPerfMonitor } from "@fluxp/perf-monitor";

// 1. 初始化 Logger SDK
// 注册所有中间件，日志输出到 Zustand store
const logger = createLogger({
  middlewares: [
    new FetchInterceptor(), // 自动拦截 fetch 请求
    new RouterTracker(), // 自动追踪路由变化
    new ClickTracker(), // 自动追踪用户点击
    new ErrorBoundary(), // 自动捕获未处理错误
  ],
  onLog: (entry) => {
    // 每条日志推送到 Zustand store，供 DevTools 面板实时消费
    useLogStore.getState().addLog(entry);
  },
  minLevel: "info",
});

// 记录应用启动日志
logger.info("Application initialized", {
  timestamp: Date.now(),
  userAgent: navigator.userAgent,
});

// 2. 初始化 Perf Monitor SDK
const perfMonitor = createPerfMonitor({
  enableFPS: true,
  enableMemory: true,
  enableLongTasks: true,
  throttleInterval: 1000,
});

// 订阅性能数据，推送到 Zustand store
perfMonitor.subscribe((metrics) => {
  usePerfStore.getState().updateMetrics(metrics);
});

// 3. 初始化 React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

// 4. 渲染 React 应用
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);

// 清理：SPA 卸载时（比如 HMR 热更新）
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    logger.destroy();
    perfMonitor.destroy();
  });
}

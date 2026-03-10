/**
 * @fluxp/perf-monitor
 *
 * 前端性能监控 SDK — 采集 Web Vitals、FPS、内存、长任务
 */

// ── 类型导出 ──
export type { PerfMetrics, PerfMonitorInstance, PerfMonitorOptions, WebVital } from './types'

// ── 核心模块 ──
export { createPerfMonitor } from './PerfMonitor'

// ── 独立采集器（可单独使用） ──
export { observeWebVitals } from './vitals'
export { observeLongTasks } from './longTask'
export { createFPSMonitor } from './fps'
export { createMemoryMonitor } from './memory'

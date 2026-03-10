// ============================================================================
// PerfMonitor 聚合类：统一管理所有性能采集器
// ============================================================================
//
// 设计思路：门面模式（Facade Pattern）
//
// 消费者不需要分别调用 vitals / fps / memory / longTask 四个模块
// 只需创建一个 PerfMonitor 实例即可获得所有指标
//
// 数据流：
//   各采集器 → 更新 metrics 快照 → 节流通知订阅者
//                                     ↓
//                            消费者（Zustand store → Dashboard UI）

import { observeWebVitals } from './vitals'
import { observeLongTasks } from './longTask'
import { createFPSMonitor } from './fps'
import { createMemoryMonitor } from './memory'
import type {
  PerfMetrics,
  PerfMonitorInstance,
  PerfMonitorOptions,
  LongTaskEntry,
  WebVital,
} from './types'

/**
 * 创建性能监控实例
 *
 * @example
 * ```ts
 * const monitor = createPerfMonitor({
 *   enableFPS: true,
 *   throttleInterval: 1000,
 * })
 *
 * // 订阅性能数据
 * const unsubscribe = monitor.subscribe((metrics) => {
 *   console.log('FPS:', metrics.fps)
 *   console.log('Vitals:', metrics.vitals)
 * })
 *
 * // 获取当前快照
 * const snapshot = monitor.getMetrics()
 *
 * // 清理
 * monitor.destroy()
 * ```
 */
export function createPerfMonitor(options: PerfMonitorOptions = {}): PerfMonitorInstance {
  const {
    enableFPS = true,
    enableMemory = true,
    enableLongTasks = true,
    throttleInterval = 1000,
  } = options

  // ── 性能指标快照（所有采集器更新到这里）──
  const metrics: PerfMetrics = {
    vitals: {},
    fps: 0,
    memory: null,
    longTasks: [],
  }

  // ── 订阅者列表 ──
  const subscribers = new Set<(metrics: PerfMetrics) => void>()

  // ── 节流通知：避免高频更新导致 UI 重渲染压力 ──
  let notifyTimer: ReturnType<typeof setTimeout> | null = null
  function notifySubscribers(): void {
    if (notifyTimer) return
    notifyTimer = setTimeout(() => {
      notifyTimer = null
      // 传递快照的浅拷贝，防止订阅者修改内部数据
      const snapshot = {
        ...metrics,
        vitals: { ...metrics.vitals },
        longTasks: [...metrics.longTasks],
      }
      subscribers.forEach((cb) => cb(snapshot))
    }, throttleInterval)
  }

  // ── 启动各采集器 ──

  // 1. Web Vitals
  const cleanupVitals = observeWebVitals((vital: WebVital) => {
    metrics.vitals[vital.name] = vital
    notifySubscribers()
  })

  // 2. FPS（可选）
  const fpsMonitor = enableFPS
    ? createFPSMonitor((fps) => {
        metrics.fps = fps
        notifySubscribers()
      })
    : null
  fpsMonitor?.start()

  // 3. 内存（可选）
  const memoryMonitor = enableMemory
    ? createMemoryMonitor((memory) => {
        metrics.memory = memory
        notifySubscribers()
      })
    : null
  memoryMonitor?.start()

  // 4. Long Task（可选）
  // 只保留最近 100 个长任务，避免内存无限增长
  const MAX_LONG_TASKS = 100
  const cleanupLongTasks = enableLongTasks
    ? observeLongTasks((entry: LongTaskEntry) => {
        metrics.longTasks.push(entry)
        if (metrics.longTasks.length > MAX_LONG_TASKS) {
          metrics.longTasks = metrics.longTasks.slice(-MAX_LONG_TASKS)
        }
        notifySubscribers()
      })
    : () => {}

  // ── 公开 API ──
  return {
    getMetrics() {
      return { ...metrics, vitals: { ...metrics.vitals }, longTasks: [...metrics.longTasks] }
    },

    subscribe(callback: (metrics: PerfMetrics) => void) {
      subscribers.add(callback)
      // 立即推送当前数据，让订阅者不必等待下一次更新
      callback(this.getMetrics())
      // 返回取消订阅函数
      return () => subscribers.delete(callback)
    },

    destroy() {
      cleanupVitals()
      fpsMonitor?.stop()
      memoryMonitor?.stop()
      cleanupLongTasks()
      subscribers.clear()
      if (notifyTimer) {
        clearTimeout(notifyTimer)
        notifyTimer = null
      }
    },
  }
}

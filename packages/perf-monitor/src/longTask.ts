// ============================================================================
// Long Task 监控
// ============================================================================
//
// Long Task API 定义：
// 浏览器主线程上执行时间超过 50ms 的任务称为"长任务"
//
// 为什么 50ms 是阈值？
// 人眼对延迟的感知阈值约 100ms，即 100ms 内的响应用户感觉是"即时"的
// 浏览器需要在每帧（约 16ms）内完成渲染，但考虑到其他开销
// 50ms 被定义为安全上限：超过 50ms 就可能导致用户感知到的卡顿

import type { LongTaskEntry } from './types'

/**
 * 监听长任务
 *
 * @param onLongTask - 每检测到一个长任务就调用
 * @returns cleanup 函数
 */
export function observeLongTasks(onLongTask: (entry: LongTaskEntry) => void): () => void {
  let observer: PerformanceObserver | null = null

  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        onLongTask({
          startTime: Math.round(entry.startTime),
          duration: Math.round(entry.duration),
        })
      }
    })

    observer.observe({ type: 'longtask', buffered: true })
  } catch {
    // Long Task API 不是所有浏览器都支持（如 Firefox）
    // 降级：不采集，静默忽略
  }

  return () => {
    observer?.disconnect()
  }
}

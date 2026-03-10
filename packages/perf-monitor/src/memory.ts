// ============================================================================
// 内存监控
// ============================================================================
//
// 实现思路：轮询 performance.memory API
//
// 注意事项：
// 1. performance.memory 是 Chrome 独有的非标准 API
//    Firefox 和 Safari 不支持，需要做特性检测
// 2. 必须在安全上下文（HTTPS 或 localhost）下才可用
// 3. 数据更新频率由浏览器控制，通常约 30 秒更新一次
//    因此我们用 2 秒轮询间隔即可
//
// 指标含义：
// - usedJSHeapSize:  当前 JS 堆已使用的内存（最关键的指标）
// - totalJSHeapSize: 当前 JS 堆总大小（已分配）
// - jsHeapSizeLimit: JS 堆的最大限制

// 扩展 Performance 接口，因为 memory 是非标准属性
interface PerformanceMemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemoryInfo
}

/**
 * 创建内存监控器
 *
 * @param onMemory - 内存数据更新时的回调（值单位为 MB）
 * @param interval - 轮询间隔（默认 2000ms）
 * @returns 包含 start/stop 方法的控制器
 */
export function createMemoryMonitor(
  onMemory: (memory: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }) => void,
  interval = 2000,
): { start: () => void; stop: () => void } {
  let timerId: ReturnType<typeof setInterval> | null = null

  function sample(): void {
    const perf = performance as PerformanceWithMemory
    if (!perf.memory) return

    // 将字节转换为 MB，保留两位小数
    onMemory({
      usedJSHeapSize: parseFloat((perf.memory.usedJSHeapSize / 1048576).toFixed(2)),
      totalJSHeapSize: parseFloat((perf.memory.totalJSHeapSize / 1048576).toFixed(2)),
      jsHeapSizeLimit: parseFloat((perf.memory.jsHeapSizeLimit / 1048576).toFixed(2)),
    })
  }

  return {
    start() {
      // 特性检测：只在支持 memory API 的浏览器中启用
      const perf = performance as PerformanceWithMemory
      if (!perf.memory) {
        console.warn('[PerfMonitor] performance.memory is not supported in this browser')
        return
      }

      // 立即采样一次
      sample()
      // 定时轮询
      timerId = setInterval(sample, interval)
    },
    stop() {
      if (timerId !== null) {
        clearInterval(timerId)
        timerId = null
      }
    },
  }
}

// ============================================================================
// FPS 实时帧率监控
// ============================================================================
//
// 实现思路：requestAnimationFrame 循环
//
// 原理：
// requestAnimationFrame (rAF) 在浏览器每次准备渲染新帧时调用回调
// 理想状态下 60fps 屏幕每秒调用 60 次
//
// 计算方法：
// 1. 在 rAF 回调中记录时间戳
// 2. 每秒统计一次 rAF 被调用的次数，即为 FPS
//
// 为什么不用 performance.now() 差值计算？
// 直接计数 rAF 调用次数更直观且准确：
// - 如果 JS 执行阻塞主线程，rAF 不会被调用，FPS 自然下降
// - 这正是我们想要监控的"用户感知帧率"

/**
 * 创建 FPS 监控器
 *
 * @param onFPS - 每秒回调一次，传入当前 FPS 值
 * @returns 包含 start/stop 方法的控制器
 */
export function createFPSMonitor(onFPS: (fps: number) => void): {
  start: () => void
  stop: () => void
} {
  let rafId: number | null = null
  let frameCount = 0
  let lastTime = 0
  let running = false

  /**
   * rAF 循环核心
   * 每帧调用一次，每秒统计并上报 FPS
   */
  function tick(timestamp: number): void {
    if (!running) return

    // 首次调用时初始化 lastTime
    if (lastTime === 0) {
      lastTime = timestamp
    }

    frameCount++

    // 每隔 1 秒（1000ms）统计一次
    const elapsed = timestamp - lastTime
    if (elapsed >= 1000) {
      // 计算实际 FPS：帧数 / 实际经过秒数 * 1000
      // 避免简单地用 frameCount 作为 FPS（因为间隔不总是精确 1000ms）
      const fps = Math.round((frameCount / elapsed) * 1000)
      onFPS(fps)

      // 重置计数器
      frameCount = 0
      lastTime = timestamp
    }

    // 继续下一帧
    rafId = requestAnimationFrame(tick)
  }

  return {
    start() {
      if (running) return
      running = true
      frameCount = 0
      lastTime = 0
      rafId = requestAnimationFrame(tick)
    },
    stop() {
      running = false
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    },
  }
}

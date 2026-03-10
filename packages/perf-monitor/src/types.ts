// ============================================================================
// 性能监控 SDK 类型定义
// ============================================================================

/**
 * Web Vitals 指标名称
 *
 * 这些是 Google 定义的核心 Web 指标（Core Web Vitals）：
 * - FCP (First Contentful Paint): 首次内容渲染时间
 *   用户看到第一个有意义内容的时刻（文字、图片等）
 *
 * - LCP (Largest Contentful Paint): 最大内容渲染时间
 *   视口中最大元素完成渲染的时刻（通常是 hero image 或标题）
 *   Google 认为 LCP < 2.5s 为"良好"
 *
 * - CLS (Cumulative Layout Shift): 累计布局偏移
 *   页面加载过程中元素意外移动的程度（如广告加载导致内容跳动）
 *   CLS < 0.1 为"良好"
 *
 * - TTFB (Time to First Byte): 首字节到达时间
 *   从请求发出到收到第一个字节的耗时，反映服务器响应速度
 */
export type WebVitalName = 'FCP' | 'LCP' | 'CLS' | 'TTFB'

/** 单个 Web Vital 指标数据 */
export interface WebVital {
  name: WebVitalName
  /** 指标数值（毫秒或分数） */
  value: number
  /**
   * 指标评级
   * - good:             表现良好（绿色）
   * - needs-improvement: 需要改善（黄色）
   * - poor:             表现差（红色）
   */
  rating: 'good' | 'needs-improvement' | 'poor'
}

/**
 * Long Task 长任务数据
 *
 * Long Task API 定义：任何占用主线程超过 50ms 的任务即为"长任务"
 * 长任务会阻塞用户交互（按钮无响应、动画卡顿）
 */
export interface LongTaskEntry {
  /** 任务开始时间（相对于页面导航，单位 ms） */
  startTime: number
  /** 任务持续时间（单位 ms） */
  duration: number
}

/**
 * 性能指标快照
 * 包含所有采集维度的当前数据
 */
export interface PerfMetrics {
  /** 核心 Web 指标 */
  vitals: Partial<Record<WebVitalName, WebVital>>
  /** 实时帧率 */
  fps: number
  /** 内存使用（MB，仅 Chrome 支持） */
  memory: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } | null
  /** 检测到的长任务列表 */
  longTasks: LongTaskEntry[]
}

/**
 * 性能监控实例 API
 */
export interface PerfMonitorInstance {
  /** 获取当前性能指标快照 */
  getMetrics(): PerfMetrics
  /**
   * 订阅性能数据更新
   * @returns 取消订阅的函数
   */
  subscribe(callback: (metrics: PerfMetrics) => void): () => void
  /** 停止采集，释放所有资源 */
  destroy(): void
}

/**
 * 性能监控配置
 */
export interface PerfMonitorOptions {
  /** 是否启用 FPS 监控（默认 true） */
  enableFPS?: boolean
  /** 是否启用内存监控（默认 true，仅 Chrome 生效） */
  enableMemory?: boolean
  /** 是否启用 Long Task 监控（默认 true） */
  enableLongTasks?: boolean
  /** 数据更新回调的节流间隔（默认 1000ms） */
  throttleInterval?: number
}

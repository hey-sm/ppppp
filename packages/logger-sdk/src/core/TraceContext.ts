// ============================================================================
// TraceContext：链路追踪上下文管理器
// ============================================================================
//
// 设计思路：
// 模拟 OpenTelemetry 的 Trace Context 概念，为每条日志赋予链路信息
//
// 核心概念：
// - traceId: 一个全局唯一 ID，标识一条完整的用户操作链路
//   例如：用户点击导航 → 路由切换 → 页面请求数据 → 渲染完成
//   这一系列操作共享同一个 traceId
//
// - spanId: 每个独立操作的唯一 ID
//   上面链路中的每一步都有自己的 spanId
//
// 为什么需要这个？
// 在前端日志中引入链路追踪，可以将零散的日志串联为有意义的操作流：
// 面试官在 DevTools 浮窗中可以看到一次完整的用户操作过程

/**
 * 生成一个短随机 ID
 * 使用 crypto.randomUUID() 的前 8 位作为短 ID
 * 权衡：完整 UUID 太长影响 DevTools 显示，8 位在单次会话中碰撞概率极低
 */
function generateId(): string {
  // 优先使用 crypto.randomUUID()（浏览器原生支持，安全随机）
  // 降级方案：Math.random + 时间戳拼接
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

export class TraceContext {
  /** 当前链路的 traceId */
  private _traceId: string

  constructor() {
    // 创建上下文时自动生成一个 traceId
    this._traceId = generateId()
  }

  /** 获取当前 traceId */
  get traceId(): string {
    return this._traceId
  }

  /**
   * 生成一个新的 spanId
   * 每次调用都返回不同的值，代表链路中的不同操作步骤
   */
  createSpanId(): string {
    return generateId()
  }

  /**
   * 重置 traceId
   * 当一条新的操作链路开始时调用（如路由切换时开启新链路）
   */
  reset(): void {
    this._traceId = generateId()
  }
}

// ============================================================================
// Logger 核心类：SDK 的中枢
// ============================================================================
//
// 设计模式：中间件管道 + 观察者模式
//
// 数据流：
// 中间件自动采集事件 ──→ emit() ──→ Logger.log() ──→ 构造 LogEntry
//                                                       ↓
//                                              onLog 回调通知消费者
//                                        （如推送到 Zustand store → DevTools UI）
//
// 为什么用工厂函数 createLogger 而不是直接暴露 class？
// 1. 隐藏内部实现细节，只暴露必要的 API
// 2. 防止消费者 new 多个实例导致事件监听重复
// 3. 工厂函数返回的是接口类型，未来可以无缝替换内部实现

import { TraceContext } from './TraceContext'
import type { LogEntry, LogLevel, LogCategory, Middleware, LoggerOptions } from '../types'

/**
 * 日志等级优先级映射
 * 数字越大优先级越高，用于 minLevel 过滤
 */
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/** Logger 实例的公开 API */
export interface LoggerInstance {
  /** 注册一个中间件 */
  use(middleware: Middleware): void
  /** 记录 debug 级别日志 */
  debug(message: string, metadata?: Record<string, unknown>): void
  /** 记录 info 级别日志 */
  info(message: string, metadata?: Record<string, unknown>): void
  /** 记录 warn 级别日志 */
  warn(message: string, metadata?: Record<string, unknown>): void
  /** 记录 error 级别日志 */
  error(message: string, metadata?: Record<string, unknown>): void
  /** 重置链路追踪（开始新的操作链路） */
  resetTrace(): void
  /** 销毁 Logger，清理所有中间件的事件监听 */
  destroy(): void
}

/**
 * 创建 Logger 实例
 *
 * @example
 * ```ts
 * const logger = createLogger({
 *   middlewares: [new FetchInterceptor(), new ClickTracker()],
 *   onLog: (entry) => useLogStore.getState().addLog(entry),
 *   minLevel: 'info',
 * })
 * ```
 */
export function createLogger(options: LoggerOptions = {}): LoggerInstance {
  const { middlewares = [], onLog, minLevel = 'debug' } = options

  // 链路追踪上下文 — 所有日志共享同一个 traceId
  const traceContext = new TraceContext()

  // 已注册的中间件列表 — destroy 时需要遍历调用 teardown
  const registeredMiddlewares: Middleware[] = []

  /**
   * 核心日志记录方法
   *
   * 职责：
   * 1. 检查日志等级是否满足 minLevel 过滤条件
   * 2. 构造结构化的 LogEntry 对象
   * 3. 通过 onLog 回调通知消费者
   */
  function log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    // 等级过滤：低于 minLevel 的日志直接丢弃
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[minLevel]) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      traceId: traceContext.traceId,
      spanId: traceContext.createSpanId(),
      category,
      metadata,
    }

    // 将结构化日志推送给消费者
    onLog?.(entry)
  }

  /**
   * emit 函数 — 提供给中间件使用的日志发射器
   * 中间件不直接访问 Logger 内部，而是通过这个函数来记录日志
   * 这是控制反转（IoC）的体现：Logger 控制日志的流向，中间件只负责采集
   */
  function emit(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    log(level, category, message, metadata)
  }

  /**
   * 注册中间件
   * 调用中间件的 setup 方法，把 emit 函数传给它
   * 中间件在 setup 中挂载事件监听，捕获到事件后调用 emit 记录日志
   */
  function use(middleware: Middleware): void {
    middleware.setup(emit)
    registeredMiddlewares.push(middleware)
  }

  /**
   * 销毁 Logger
   * 遍历所有中间件调用 teardown，清理事件监听
   * 防止内存泄漏（尤其是 SPA 中组件卸载后监听未清理的问题）
   */
  function destroy(): void {
    registeredMiddlewares.forEach((m) => m.teardown())
    registeredMiddlewares.length = 0
  }

  // 初始化时注册所有配置的中间件
  middlewares.forEach(use)

  // 返回公开 API（隐藏内部实现）
  return {
    use,
    debug: (msg, meta) => log('debug', 'custom', msg, meta),
    info: (msg, meta) => log('info', 'custom', msg, meta),
    warn: (msg, meta) => log('warn', 'custom', msg, meta),
    error: (msg, meta) => log('error', 'custom', msg, meta),
    resetTrace: () => traceContext.reset(),
    destroy,
  }
}

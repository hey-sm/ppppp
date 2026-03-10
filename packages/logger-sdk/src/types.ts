// ============================================================================
// 类型定义：定义 Logger SDK 的核心类型系统
// ============================================================================

/**
 * 日志等级枚举
 * 参考业界标准的日志分级方案（类似 syslog）
 * - debug: 开发调试信息，生产环境通常过滤掉
 * - info:  常规操作记录（路由切换、按钮点击等）
 * - warn:  可能的问题警告（性能劣化、废弃 API 使用等）
 * - error: 运行时错误（未捕获异常、网络失败等）
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 日志分类
 * 通过分类让消费者可以按类型过滤日志
 * 每种中间件对应一个分类，自定义日志使用 'custom'
 */
export type LogCategory = 'router' | 'fetch' | 'click' | 'error' | 'custom'

/**
 * 结构化日志条目
 *
 * 设计要点：
 * 1. traceId + spanId 模拟分布式追踪（参考 OpenTelemetry Trace 规范）
 *    - traceId: 标识一条完整的用户操作链路（如"用户从首页跳转到 UI Lab"）
 *    - spanId:  标识链路中的单个操作步骤
 * 2. category 用于分类过滤，metadata 存放扩展数据
 * 3. timestamp 使用 Date.now() 的毫秒时间戳，方便排序和计算时间差
 */
export interface LogEntry {
  /** 日志等级 */
  level: LogLevel
  /** 日志消息文本 */
  message: string
  /** 毫秒时间戳 */
  timestamp: number
  /** 链路追踪 ID，标识一条完整的操作链路 */
  traceId: string
  /** 当前操作的唯一 ID */
  spanId: string
  /** 日志分类 */
  category: LogCategory
  /** 扩展元数据（如 HTTP 状态码、URL、元素选择器等） */
  metadata?: Record<string, unknown>
}

/**
 * 中间件接口
 *
 * 设计思路：插件化架构
 * - 每个中间件负责一种自动采集逻辑（如拦截 fetch、监听点击）
 * - setup() 在中间件注册时调用，挂载事件监听
 * - teardown() 在 Logger 销毁时调用，清理事件监听，防止内存泄漏
 *
 * 这种设计让 SDK 具备良好的扩展性：
 * 用户可以轻松编写自定义中间件来采集任意事件
 */
export interface Middleware {
  /** 中间件名称，用于标识和调试 */
  name: string
  /**
   * 注册中间件时调用
   * @param emit - Logger 提供的日志发射函数，中间件通过它来记录日志
   */
  setup(
    emit: (
      level: LogLevel,
      category: LogCategory,
      message: string,
      metadata?: Record<string, unknown>,
    ) => void,
  ): void
  /** 销毁时调用，清理所有副作用（事件监听、定时器等） */
  teardown(): void
}

/**
 * Logger 配置选项
 */
export interface LoggerOptions {
  /** 要注册的中间件列表 */
  middlewares?: Middleware[]
  /**
   * 日志输出回调
   * 每产生一条日志就调用一次，消费者在此处理日志（如推送到 Zustand store）
   */
  onLog?: (entry: LogEntry) => void
  /**
   * 最低日志等级过滤
   * 低于此等级的日志将被丢弃（如生产环境设为 'warn' 以屏蔽 debug 和 info）
   */
  minLevel?: LogLevel
}

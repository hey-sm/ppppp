/**
 * @fluxp/logger-sdk
 *
 * 前端日志采集 SDK — 中间件架构，自动采集用户行为和运行时错误
 */

// ── 类型导出 ──
export type { LogLevel, LogCategory, LogEntry, Middleware, LoggerOptions } from './types'

// ── 核心模块 ──
export { createLogger } from './core/Logger'
export { TraceContext } from './core/TraceContext'

// ── 内置中间件 ──
export { FetchInterceptor } from './middleware/FetchInterceptor'
export { RouterTracker } from './middleware/RouterTracker'
export { ClickTracker } from './middleware/ClickTracker'
export { ErrorBoundary } from './middleware/ErrorBoundary'

// ============================================================================
// ErrorBoundary 中间件：自动捕获全局未处理错误
// ============================================================================
//
// 实现思路：全局错误兜底
//
// 浏览器中有两种"逃逸"的错误需要捕获：
//
// 1. 同步错误（window.onerror / 'error' event）
//    - 未被 try-catch 捕获的运行时错误（如 TypeError、ReferenceError）
//    - 资源加载失败（img/script/css 加载 404）
//
// 2. 异步错误（window.onunhandledrejection / 'unhandledrejection' event）
//    - Promise 被 reject 但没有 .catch() 处理
//    - async 函数中未被 try-catch 的异常
//
// 为什么需要这个中间件？
// - React ErrorBoundary 只能捕获渲染阶段的错误，事件处理和异步代码中的错误会逃逸
// - 这个中间件是最后一道防线，确保没有错误被悄悄吞掉
// - 配合前面的 traceId，可以追踪错误发生时的用户操作上下文

import type { LogLevel, LogCategory, Middleware } from '../types'

type EmitFn = (
  level: LogLevel,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>,
) => void

export class ErrorBoundary implements Middleware {
  name = 'ErrorBoundary'

  private emit: EmitFn | null = null
  private handleError: ((event: ErrorEvent) => void) | null = null
  private handleRejection: ((event: PromiseRejectionEvent) => void) | null = null

  setup(emit: EmitFn): void {
    this.emit = emit

    // ── 1. 捕获同步运行时错误 ──
    this.handleError = (event: ErrorEvent) => {
      this.emit?.('error', 'error', event.message || 'Unknown Error', {
        // 错误发生的文件路径
        filename: event.filename,
        // 错误发生的行号和列号
        lineno: event.lineno,
        colno: event.colno,
        // 完整的错误堆栈（如果有的话）
        stack: event.error?.stack,
        type: 'uncaught_error',
      })
    }
    window.addEventListener('error', this.handleError)

    // ── 2. 捕获未处理的 Promise rejection ──
    this.handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason

      // 提取错误信息：reason 可能是 Error 对象，也可能是字符串或其他类型
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : 'Unhandled Promise Rejection'

      this.emit?.('error', 'error', message, {
        stack: reason instanceof Error ? reason.stack : undefined,
        reason: typeof reason === 'object' ? JSON.stringify(reason) : String(reason),
        type: 'unhandled_rejection',
      })
    }
    window.addEventListener('unhandledrejection', this.handleRejection)
  }

  teardown(): void {
    if (this.handleError) {
      window.removeEventListener('error', this.handleError)
      this.handleError = null
    }
    if (this.handleRejection) {
      window.removeEventListener('unhandledrejection', this.handleRejection)
      this.handleRejection = null
    }
    this.emit = null
  }
}

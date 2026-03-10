// ============================================================================
// FetchInterceptor 中间件：自动拦截并记录所有 HTTP 请求
// ============================================================================
//
// 实现思路：猴子补丁（Monkey Patching）
//
// 原理：
// 1. 保存 window.fetch 的原始引用
// 2. 用自定义函数替换 window.fetch
// 3. 自定义函数内部调用原始 fetch，并在请求前后记录日志
// 4. teardown 时恢复原始 fetch
//
// 为什么用猴子补丁而不是 Service Worker？
// - Service Worker 需要额外注册和文件，对于日志场景过于重量级
// - 猴子补丁足够覆盖绝大多数 HTTP 请求场景
// - 这也是业界主流前端监控 SDK（如 Sentry）的做法
//
// 注意事项：
// - 多个 SDK 同时补丁 fetch 可能产生冲突，需要确保正确链式调用
// - teardown 恢复时要确认当前 fetch 是否还是我们的补丁版本

import type { LogLevel, LogCategory, Middleware } from '../types'

type EmitFn = (
  level: LogLevel,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>,
) => void

export class FetchInterceptor implements Middleware {
  name = 'FetchInterceptor'

  /** 保存原始 fetch 引用，teardown 时恢复 */
  private originalFetch: typeof fetch | null = null
  private emit: EmitFn | null = null

  setup(emit: EmitFn): void {
    this.emit = emit

    // 保存原始 fetch
    this.originalFetch = window.fetch.bind(window)
    const self = this

    // 替换 window.fetch
    window.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const startTime = performance.now()
      const method = init?.method ?? 'GET'
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

      try {
        // 调用原始 fetch
        const response = await self.originalFetch!(input, init)
        const duration = Math.round(performance.now() - startTime)

        // 记录成功的请求
        self.emit?.('info', 'fetch', `${method} ${url} ${response.status} ${duration}ms`, {
          method,
          url,
          status: response.status,
          duration,
        })

        return response
      } catch (error) {
        const duration = Math.round(performance.now() - startTime)

        // 记录失败的请求（网络错误、CORS 等）
        self.emit?.('error', 'fetch', `${method} ${url} FAILED ${duration}ms`, {
          method,
          url,
          error: error instanceof Error ? error.message : String(error),
          duration,
        })

        // 重新抛出错误，不影响业务代码的错误处理
        throw error
      }
    }
  }

  teardown(): void {
    // 恢复原始 fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch
      this.originalFetch = null
    }
    this.emit = null
  }
}

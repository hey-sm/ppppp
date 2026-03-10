// ============================================================================
// RouterTracker 中间件：自动追踪路由变化
// ============================================================================
//
// 实现思路：双重监听
//
// 1. 浏览器原生事件 popstate：捕获浏览器前进/后退按钮触发的路由变化
// 2. History API 补丁：捕获 SPA 框架（如 React Router、TanStack Router）
//    通过 pushState/replaceState 触发的路由变化
//
// 为什么需要同时做这两件事？
// - popstate 只在浏览器前进/后退时触发
// - SPA 框架的路由切换通常调用 history.pushState，这不会触发 popstate
// - 所以必须同时补丁 pushState/replaceState 才能完整追踪 SPA 路由变化
//
// TanStack Router 的集成方式：
// TanStack Router 使用 history.pushState 进行导航，
// 所以这个中间件无需任何额外配置就能自动工作

import type { LogLevel, LogCategory, Middleware } from '../types'

type EmitFn = (
  level: LogLevel,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>,
) => void

export class RouterTracker implements Middleware {
  name = 'RouterTracker'

  private emit: EmitFn | null = null
  private originalPushState: typeof history.pushState | null = null
  private originalReplaceState: typeof history.replaceState | null = null
  private handlePopState: (() => void) | null = null

  setup(emit: EmitFn): void {
    this.emit = emit
    const self = this

    // ── 1. 监听 popstate（浏览器前进/后退）──
    this.handlePopState = () => {
      self.emit?.('info', 'router', `Navigate to ${location.pathname}`, {
        path: location.pathname,
        search: location.search,
        hash: location.hash,
        trigger: 'popstate',
      })
    }
    window.addEventListener('popstate', this.handlePopState)

    // ── 2. 补丁 pushState（SPA 路由跳转）──
    this.originalPushState = history.pushState.bind(history)
    history.pushState = function patchedPushState(...args: Parameters<typeof history.pushState>) {
      // 先执行原始的 pushState
      self.originalPushState!(...args)
      // 然后记录日志
      self.emit?.('info', 'router', `Navigate to ${location.pathname}`, {
        path: location.pathname,
        search: location.search,
        trigger: 'pushState',
      })
    }

    // ── 3. 补丁 replaceState（路由替换，如重定向）──
    this.originalReplaceState = history.replaceState.bind(history)
    history.replaceState = function patchedReplaceState(
      ...args: Parameters<typeof history.replaceState>
    ) {
      self.originalReplaceState!(...args)
      self.emit?.('info', 'router', `Replace to ${location.pathname}`, {
        path: location.pathname,
        search: location.search,
        trigger: 'replaceState',
      })
    }
  }

  teardown(): void {
    // 清理 popstate 监听
    if (this.handlePopState) {
      window.removeEventListener('popstate', this.handlePopState)
      this.handlePopState = null
    }
    // 恢复原始 pushState / replaceState
    if (this.originalPushState) {
      history.pushState = this.originalPushState
      this.originalPushState = null
    }
    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState
      this.originalReplaceState = null
    }
    this.emit = null
  }
}

// ============================================================================
// ClickTracker 中间件：自动追踪用户点击行为
// ============================================================================
//
// 实现思路：事件委托（Event Delegation）
//
// 原理：
// 不给每个元素单独绑定 click 事件，而是在 document 上统一监听 click 事件
// 通过 event.target 获取被点击的具体元素
//
// 为什么用事件委托？
// 1. 性能优势：只需一个事件监听器，而非成百上千个
// 2. 动态元素：动态添加的 DOM 元素也能自动被追踪，无需额外绑定
// 3. 这是 React 自身事件系统的底层原理
//
// 元素标识策略（按优先级）：
// 1. data-track 属性 — 开发者显式标注的追踪标识（最优语义）
// 2. id 属性 — 元素的唯一标识
// 3. className + tagName — 兜底方案

import type { LogLevel, LogCategory, Middleware } from '../types'

type EmitFn = (
  level: LogLevel,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>,
) => void

export class ClickTracker implements Middleware {
  name = 'ClickTracker'

  private emit: EmitFn | null = null
  private handleClick: ((event: MouseEvent) => void) | null = null

  setup(emit: EmitFn): void {
    this.emit = emit

    this.handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target) return

      // 构建元素标识字符串
      const identifier = this.getElementIdentifier(target)
      const text = target.textContent?.slice(0, 50)?.trim() || ''

      this.emit?.('info', 'click', `Click: ${identifier}`, {
        // 元素标签名
        tagName: target.tagName.toLowerCase(),
        // 元素标识
        identifier,
        // 元素文本内容（截断避免过长）
        text,
        // 点击位置（相对于视口）
        x: event.clientX,
        y: event.clientY,
      })
    }

    // 使用捕获阶段（capture: true）确保在事件冒泡前就记录
    // 即使业务代码调用了 stopPropagation 也不影响日志采集
    document.addEventListener('click', this.handleClick, { capture: true })
  }

  /**
   * 获取元素的可读标识
   *
   * 优先级策略：
   * 1. data-track — 显式追踪标识，语义最清晰
   *    <button data-track="theme-toggle">切换主题</button> → "theme-toggle"
   * 2. id — 次选，通常也有明确语义
   *    <button id="submit-btn">提交</button> → "button#submit-btn"
   * 3. tagName + className — 兜底
   *    <button class="btn primary">确定</button> → "button.btn.primary"
   */
  private getElementIdentifier(element: HTMLElement): string {
    // 优先使用 data-track 属性
    const trackId = element.getAttribute('data-track')
    if (trackId) return trackId

    const tag = element.tagName.toLowerCase()

    // 其次使用 id
    if (element.id) return `${tag}#${element.id}`

    // 兜底：tagName + className
    const classes = Array.from(element.classList).slice(0, 3).join('.')
    return classes ? `${tag}.${classes}` : tag
  }

  teardown(): void {
    if (this.handleClick) {
      document.removeEventListener('click', this.handleClick, { capture: true })
      this.handleClick = null
    }
    this.emit = null
  }
}

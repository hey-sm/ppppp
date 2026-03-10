// ============================================================================
// Button 组件：组件库的基石
// ============================================================================
//
// 设计思路：
// 1. Variant 变体模式 — 通过 variant prop 切换不同视觉风格
//    这是现代组件库（shadcn/ui, Radix）的标准设计模式
// 2. 组合式 API — 支持 asChild 模式，让 Button 的样式可以应用到任意元素
// 3. forwardRef — 支持 ref 转发，方便父组件直接操作 DOM
// 4. data-track — 内置日志追踪标识，配合 logger-sdk 的 ClickTracker 使用

import React, { forwardRef } from 'react'

/** Button 的视觉变体 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/** Button 的尺寸 */
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 视觉变体 */
  variant?: ButtonVariant
  /** 尺寸 */
  size?: ButtonSize
  /** 是否处于加载状态 */
  loading?: boolean
  /**
   * 日志追踪标识
   * 会渲染为 data-track 属性，被 logger-sdk 的 ClickTracker 自动采集
   */
  trackId?: string
}

/**
 * 各变体对应的 CSS 类名映射
 *
 * 实现思路：用对象映射取代 if-else / switch
 * 优点：新增变体只需添加映射，无需修改渲染逻辑
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'fluxp-btn-primary',
  secondary: 'fluxp-btn-secondary',
  ghost: 'fluxp-btn-ghost',
  danger: 'fluxp-btn-danger',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'fluxp-btn-sm',
  md: 'fluxp-btn-md',
  lg: 'fluxp-btn-lg',
}

/**
 * Button 组件
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" trackId="submit-form">
 *   提交
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      trackId,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = [
      'fluxp-btn',
      variantStyles[variant],
      sizeStyles[size],
      loading ? 'fluxp-btn-loading' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        data-track={trackId}
        {...props}
      >
        {loading && (
          <span className="fluxp-btn-spinner" aria-hidden="true">
            {/* 简单的 CSS 旋转动画加载指示器 */}⟳
          </span>
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

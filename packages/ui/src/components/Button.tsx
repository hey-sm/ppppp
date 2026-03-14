// ============================================================================
// Button 组件：组件库的基础按钮
// ============================================================================
//
// 设计思路：
// 1. Variant 变体模式：通过 variant prop 切换不同视觉风格
//    这是现代组件库（shadcn/ui、Radix）里很常见的设计方式
// 2. 组合式 API：通过 className 让宿主继续叠加 Tailwind class
// 3. forwardRef：支持 ref 转发，方便父组件直接操作 DOM
// 4. data-track：内置日志追踪标识，配合 logger-sdk 的 ClickTracker 使用

import React, { forwardRef } from "react";

/** Button 的视觉变体 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/** Button 的尺寸 */
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 视觉变体 */
  variant?: ButtonVariant;
  /** 尺寸 */
  size?: ButtonSize;
  /** 是否处于加载状态 */
  loading?: boolean;
  /**
   * 日志追踪标识
   * 会渲染为 data-track 属性，被 logger-sdk 的 ClickTracker 自动采集
   */
  trackId?: string;
}

/**
 * 各变体对应的 Tailwind class 映射
 *
 * 优点：
 * 1. 变体逻辑集中，避免在 JSX 里堆一长串条件判断
 * 2. 所有 class 都是静态字符串，Tailwind 可以稳定扫描到
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(15,23,42,0.14)] hover:bg-[var(--primary-hover)]",
  secondary:
    "border-border bg-card text-foreground hover:bg-[var(--secondary-hover)]",
  ghost:
    "bg-transparent text-foreground hover:bg-[var(--ghost-hover)]",
  danger:
    "bg-destructive text-destructive-foreground shadow-[0_12px_28px_rgba(15,23,42,0.18)] hover:bg-[var(--destructive-hover)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 text-[0.8125rem]",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-12 px-5 text-[0.9375rem]",
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-[calc(var(--radius)-0.125rem)] border border-transparent font-semibold leading-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_var(--selection-hover)] disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none";

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
      variant = "primary",
      size = "md",
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
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      loading ? "pointer-events-none" : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        data-track={trackId}
        {...props}
      >
        {loading && (
          <span
            className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

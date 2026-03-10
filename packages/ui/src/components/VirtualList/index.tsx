// ============================================================================
// VirtualList 组件：虚拟滚动列表
// ============================================================================
//
// 核心原理：
// 传统列表渲染 N 条数据就创建 N 个 DOM 节点
// 虚拟列表只渲染 **可视区域** 内的节点（通常只有 10-20 个）
// 用户滚动时，动态更新这些节点的内容和位置
//
// 性能对比（以 10000 条数据为例）：
// - 普通列表：10000 个 DOM 节点，初始渲染 ~2000ms，内存 ~50MB
// - 虚拟列表：~20 个 DOM 节点，初始渲染 ~5ms，  内存 ~2MB
//
// 实现思路（定高虚拟滚动）：
//
// ┌──────────────────────────┐
// │     容器（固定高度）        │ ← overflow: auto, 产生滚动条
// │ ┌──────────────────────┐ │
// │ │  撑高容器              │ │ ← 高度 = itemHeight × totalCount（撑出滚动条）
// │ │                       │ │
// │ │  ┌─────────────────┐  │ │
// │ │  │ 可见区域的 items │  │ │ ← 绝对定位，translateY 偏移到正确位置
// │ │  └─────────────────┘  │ │
// │ │                       │ │
// │ └──────────────────────┘ │
// └──────────────────────────┘
//
// 关键计算：
// startIndex = Math.floor(scrollTop / itemHeight)
// endIndex = startIndex + Math.ceil(containerHeight / itemHeight) + buffer

import React, { useState, useCallback, useRef } from "react";
import "./index.css";

export interface VirtualListProps<T> {
  /** 数据源 */
  items: T[];
  /** 每行固定高度（px） */
  itemHeight: number;
  /** 容器高度（px） */
  containerHeight: number;
  /** 渲染每一行的函数 */
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * 上下缓冲区行数（默认 5）
   * 在可视区域上下多渲染若干行，避免快速滚动时出现白屏
   */
  overscan?: number;
  /** 容器额外的 className */
  className?: string;
}

/**
 * 虚拟滚动列表组件
 *
 * @example
 * ```tsx
 * <VirtualList
 *   items={Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }))}
 *   itemHeight={40}
 *   containerHeight={500}
 *   renderItem={(item) => <div>{item.name}</div>}
 * />
 * ```
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── 核心计算：确定哪些 item 在可视区域内 ──

  // 总容器高度（用于撑出正确的滚动条）
  const totalHeight = items.length * itemHeight;

  // 可视区域的第一个 item 索引
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);

  // 可视区域的最后一个 item 索引
  // 加上 overscan 缓冲，避免滚动时白屏闪烁
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  // 只取可视范围内的 items（这就是"虚拟"的核心——不渲染看不见的部分）
  const visibleItems = items.slice(startIndex, endIndex);

  // 可视区域的起始偏移量（用于定位）
  const offsetY = startIndex * itemHeight;

  /**
   * 滚动事件处理
   * 使用 useCallback 避免每次渲染创建新函数引用
   */
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fluxp-virtual-list ${className ?? ""}`}
      style={{
        height: containerHeight,
        overflow: "auto",
        position: "relative",
      }}
      onScroll={handleScroll}
    >
      {/* 撑高容器：这个 div 的唯一作用是把父容器撑到正确的总高度 */}
      <div style={{ height: totalHeight, position: "relative" }}>
        {/* 可见区域：transform 把 items 移动到正确的滚动位置 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((item, i) => (
            <div
              key={startIndex + i}
              style={{ height: itemHeight }}
              className="fluxp-virtual-list-item"
            >
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

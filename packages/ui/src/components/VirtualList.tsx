// ============================================================================
// VirtualList 缁勪欢锛氳櫄鎷熸粴鍔ㄥ垪琛?// ============================================================================
//
// 鏍稿績鍘熺悊锛?// 浼犵粺鍒楄〃娓叉煋 N 鏉℃暟鎹氨浼氬垱寤?N 涓?DOM 鑺傜偣銆?// 铏氭嫙鍒楄〃鍙覆鏌撯€滃彲瑙嗗尯鍩熲€濆唴鐨勮妭鐐癸紝鐢ㄦ埛婊氬姩鏃跺姩鎬佹洿鏂板唴瀹瑰拰浣嶇疆锛?// 鐢ㄦ洿灏戠殑 DOM 鎹㈠彇鏇寸ǔ瀹氱殑鎬ц兘琛ㄧ幇銆?
import React, { useEffect, useState, useCallback, useRef } from "react";

export interface VirtualListProps<T> {
  /** 鏁版嵁婧?*/
  items: T[];
  /** 姣忚鍥哄畾楂樺害锛坧x锛?*/
  itemHeight: number;
  /** 瀹瑰櫒楂樺害锛坧x锛?*/
  containerHeight: number;
  /** 娓叉煋姣忎竴琛岀殑鍑芥暟 */
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * 涓婁笅缂撳啿鍖鸿鏁帮紝榛樿 5
   * 璁╁揩閫熸粴鍔ㄦ椂涓嶅鏄撳嚭鐜扮櫧灞忛棯鐑?   */
  overscan?: number;
  /** 瀹瑰櫒棰濆 className */
  className?: string;
  /** 鏄惁绂佺敤鍐呯疆瀹瑰櫒鏍峰紡锛堣竟妗?鑳屾櫙/闃村奖绛夛級 */
  unstyled?: boolean;
  /** 鏄惁绂佺敤鍐呯疆琛屾牱寮忥紙padding/鍒嗗壊绾?鏉＄汗绛夛級 */
  itemUnstyled?: boolean;
  /** 琛?wrapper 棰濆 className */
  itemClassName?: string;
  /** Scroll to a given item index (best-effort). */
  scrollToIndex?: number | null;
}

const rootStyles =
  "relative overflow-auto rounded-[var(--radius)] border border-border bg-card text-foreground [box-shadow:var(--surface-shadow)]";

const itemStyles =
  "flex items-center border-b border-border px-4 text-[0.9rem] odd:bg-[color-mix(in_srgb,var(--card)_86%,var(--background))] even:bg-[color-mix(in_srgb,var(--muted)_58%,var(--card))] last:border-b-0";

/**
 * 铏氭嫙婊氬姩鍒楄〃缁勪欢
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
  unstyled = false,
  itemUnstyled = false,
  itemClassName,
  scrollToIndex = null,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  /**
   * 婊氬姩浜嬩欢澶勭悊
   * 鐢?useCallback 閬垮厤姣忔娓叉煋閲嶆柊鍒涘缓鍑芥暟
   */
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    if (scrollToIndex == null) return;
    const el = containerRef.current;
    if (!el) return;

    const maxTop = Math.max(0, totalHeight - containerHeight);
    const nextTop = Math.max(0, Math.min(maxTop, scrollToIndex * itemHeight));
    if (Math.abs(el.scrollTop - nextTop) < 1) return;

    el.scrollTop = nextTop;
    setScrollTop(nextTop);
  }, [scrollToIndex, itemHeight, containerHeight, totalHeight]);

  return (
    <div
      ref={containerRef}
      className={[unstyled ? "relative overflow-auto" : rootStyles, className ?? ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        height: containerHeight,
      }}
      onScroll={handleScroll}
    >
      {/* 鎾戦珮瀹瑰櫒锛氳礋璐ｇ敓鎴愭纭殑婊氬姩鏉￠珮搴?*/}
      <div className="relative" style={{ height: totalHeight }}>
        {/* 鍙鍖哄煙锛氶€氳繃 translateY 鎶婂綋鍓嶆壒娆＄殑鍏冪礌绉诲埌姝ｇ‘浣嶇疆 */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((item, i) => (
            <div
              key={startIndex + i}
              style={{ height: itemHeight }}
              className={[itemUnstyled ? "" : itemStyles, itemClassName ?? ""]
                .filter(Boolean)
                .join(" ")}
            >
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


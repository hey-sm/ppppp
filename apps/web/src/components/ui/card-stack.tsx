// ============================================================================
// CardStack — 3D 扇形卡片轮播组件
// ============================================================================
//
// 布局模型：
//   所有卡片绝对定位在同一容器中，通过 CSS transform 实现扇形展开。
//   每张卡片根据与 active 的偏移量 (signedOffset) 计算：
//   - x 位移（水平扇开）、rotateZ（旋转角度）、rotateX（倾斜）
//   - scale（缩放）、y（下沉）、translateZ（纵深）
//
// 动画引擎：
//   framer-motion spring 弹簧动画，天然支持**动画中断**——
//   切换时不等上一帧完成，直接从当前物理位置起跳到新目标。
//   活跃卡片用高 stiffness / 低 mass（快速到位），
//   背景卡片用低 stiffness / 高 damping（柔和跟随，形成层次感）。
//
// 交互模型（视觉层与交互层分离）：
//   卡片纯展示，不挂任何点击事件，不受 z-index 遮挡影响。
//   点击由容器统一处理：根据点击位置与容器中心的关系判断方向。
//   - 点击左半区 → prev()
//   - 点击右半区 → next()
//   - 死区（中间卡片宽度范围内） → 不切换
//   函数式 setState 保证快速连点每次都基于最新 state，不丢操作。
//
// z-index 策略：
//   活跃卡片直接设 200（非动画属性，React 渲染即生效），
//   其余卡片 100 - abs(offset)，保证切换瞬间层级正确。
// ============================================================================

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SquareArrowOutUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CardStackItem = {
  id: string | number;
  title: string;
  description?: string;
  imageSrc?: string;
  href?: string;
  ctaLabel?: string;
  tag?: string;
};

export type CardStackProps<T extends CardStackItem> = {
  items: T[];
  initialIndex?: number;
  maxVisible?: number;
  cardWidth?: number;
  cardHeight?: number;
  overlap?: number;
  spreadDeg?: number;
  perspectivePx?: number;
  depthPx?: number;
  tiltXDeg?: number;
  activeLiftPx?: number;
  activeScale?: number;
  inactiveScale?: number;
  springStiffness?: number;
  springDamping?: number;
  loop?: boolean;
  autoAdvance?: boolean;
  intervalMs?: number;
  pauseOnHover?: boolean;
  showDots?: boolean;
  className?: string;
  onChangeIndex?: (index: number, item: T) => void;
  renderCard?: (item: T, state: { active: boolean }) => React.ReactNode;
};

function wrapIndex(n: number, len: number) {
  if (len <= 0) return 0;
  return ((n % len) + len) % len;
}

function signedOffset(i: number, active: number, len: number, loop: boolean) {
  const raw = i - active;
  if (!loop || len <= 1) return raw;
  const alt = raw > 0 ? raw - len : raw + len;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
}

export function CardStack<T extends CardStackItem>({
  items,
  initialIndex = 0,
  maxVisible = 7,
  cardWidth = 520,
  cardHeight = 320,
  overlap = 0.48,
  spreadDeg = 48,
  perspectivePx = 1100,
  depthPx = 140,
  tiltXDeg = 12,
  activeLiftPx = 22,
  activeScale = 1.03,
  inactiveScale = 0.94,
  springStiffness = 280,
  springDamping = 28,
  loop = true,
  autoAdvance = false,
  intervalMs = 2800,
  pauseOnHover = true,
  showDots = true,
  className,
  onChangeIndex,
  renderCard,
}: CardStackProps<T>) {
  const reduceMotion = useReducedMotion();
  const len = items.length;

  const [active, setActive] = React.useState(() =>
    wrapIndex(initialIndex, len),
  );
  const [hovering, setHovering] = React.useState(false);

  React.useEffect(() => {
    setActive((a) => wrapIndex(a, len));
  }, [len]);

  const onChangeRef = React.useRef(onChangeIndex);
  onChangeRef.current = onChangeIndex;

  React.useEffect(() => {
    if (!len) return;
    onChangeRef.current?.(active, items[active]!);
  }, [active, len, items]);

  const maxOffset = Math.max(0, Math.floor(maxVisible / 2));
  const cardSpacing = Math.max(10, Math.round(cardWidth * (1 - overlap)));
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;

  const visibleCards = React.useMemo(
    () =>
      items
        .map((item, i) => ({
          item,
          i,
          off: signedOffset(i, active, len, loop),
        }))
        .filter(({ off }) => Math.abs(off) <= maxOffset),
    [items, active, len, loop, maxOffset],
  );

  const goToIndex = React.useCallback(
    (newIndex: number) => {
      if (!len) return;
      setActive(wrapIndex(newIndex, len));
    },
    [len],
  );

  const prev = React.useCallback(() => {
    setActive((cur) => {
      if (!loop && cur <= 0) return cur;
      return wrapIndex(cur - 1, len);
    });
  }, [loop, len]);

  const next = React.useCallback(() => {
    setActive((cur) => {
      if (!loop && cur >= len - 1) return cur;
      return wrapIndex(cur + 1, len);
    });
  }, [loop, len]);

  // ── 容器级点击：交互层与视觉层分离，不受卡片 z-index 影响 ──
  const onContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const dx = e.clientX - centerX;
    const deadZone = cardWidth / 2;
    if (dx < -deadZone) prev();
    else if (dx > deadZone) next();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  React.useEffect(() => {
    if (!autoAdvance || reduceMotion || !len) return;
    if (pauseOnHover && hovering) return;
    const id = window.setInterval(() => next(), Math.max(700, intervalMs));
    return () => window.clearInterval(id);
  }, [
    autoAdvance,
    intervalMs,
    hovering,
    pauseOnHover,
    reduceMotion,
    len,
    next,
  ]);

  if (!len) return null;

  const activeItem = items[active]!;

  return (
    <div
      className={cn("w-full", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="relative w-full  cursor-pointer"
        style={{ height: Math.max(380, cardHeight + 80) }}
        tabIndex={0}
        onClick={onContainerClick}
        onKeyDown={onKeyDown}
      >
        <div
          className="absolute inset-0 flex items-end justify-center"
          style={{ perspective: `${perspectivePx}px` }}
        >
          {visibleCards.map(({ item, off }) => {
            const abs = Math.abs(off);
            const rotateZ = off * stepDeg;
            const x = off * cardSpacing;
            const y = abs * 10;
            const z = -abs * depthPx;
            const isActive = off === 0;
            const scale = isActive ? activeScale : inactiveScale;
            const lift = isActive ? -activeLiftPx : 0;
            const rotateX = isActive ? 0 : tiltXDeg;
            const zIndex = isActive ? 200 : 100 - abs;

            return (
              <motion.div
                key={item.id}
                className="absolute bottom-0 rounded-2xl overflow-hidden shadow-xl select-none pointer-events-none"
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  zIndex,
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                  willChange: "transform",
                }}
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: y + 40, x, rotateZ, rotateX, scale }
                }
                animate={{
                  opacity: 1,
                  x,
                  y: y + lift,
                  rotateZ,
                  rotateX,
                  scale,
                }}
                transition={{
                  type: "spring",
                  stiffness: isActive
                    ? springStiffness * 1.3
                    : springStiffness * 0.8,
                  damping: isActive ? springDamping : springDamping * 1.15,
                  mass: isActive ? 0.7 : 0.9,
                }}
              >
                <div
                  className="h-full w-full"
                  style={{
                    transform: `translateZ(${z}px)`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {renderCard ? (
                    renderCard(item, { active: isActive })
                  ) : (
                    <DefaultFanCard item={item} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {showDots ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            {items.map((it, idx) => {
              const on = idx === active;
              return (
                <button
                  key={it.id}
                  onClick={() => goToIndex(idx)}
                  className={cn(
                    "h-2 w-2 rounded-full transition",
                    on
                      ? "bg-foreground"
                      : "bg-foreground/30 hover:bg-foreground/50",
                  )}
                  aria-label={`Go to ${it.title}`}
                />
              );
            })}
          </div>
          {activeItem.href ? (
            <a
              href={activeItem.href}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition"
              aria-label="Open link"
            >
              <SquareArrowOutUpRight className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DefaultFanCard({ item }: { item: CardStackItem }) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0">
        {item.imageSrc ? (
          <img
            src={item.imageSrc}
            alt={item.title}
            className="h-full w-full object-cover"
            draggable={false}
            loading="eager"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-end p-5">
        <div className="truncate text-lg font-semibold text-white">
          {item.title}
        </div>
        {item.description ? (
          <div className="mt-1 line-clamp-2 text-sm text-white/80">
            {item.description}
          </div>
        ) : null}
      </div>
    </div>
  );
}

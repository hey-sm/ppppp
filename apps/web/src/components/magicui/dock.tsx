import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type HTMLMotionProps,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

export interface DockProps extends VariantProps<typeof dockVariants> {
  className?: string;
  iconSize?: number;
  iconMagnification?: number;
  iconDistance?: number;
  direction?: "top" | "middle" | "bottom";
  children: React.ReactNode;
}

const DEFAULT_SIZE = 40;
const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

const dockVariants = cva(
  "mx-auto flex h-[60px] w-max items-center justify-center gap-2 overflow-hidden rounded-2xl border border-border/50 bg-background/72 p-1.5 shadow-[0_16px_36px_-24px_rgba(15,23,42,0.35)] backdrop-blur-md supports-backdrop-blur:bg-background/62",
);

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      iconSize = DEFAULT_SIZE,
      iconMagnification = DEFAULT_MAGNIFICATION,
      iconDistance = DEFAULT_DISTANCE,
      direction = "middle",
      ...props
    },
    ref,
  ) => {
    const mouseX = useMotionValue(Infinity);

    const renderChildren = () => {
      return React.Children.map(children, (child) => {
        if (
          React.isValidElement<DockIconProps>(child) &&
          child.type === DockIcon
        ) {
          return React.cloneElement(
            child as React.ReactElement<DockIconProps>,
            {
              ...child.props,
              mouseX,
              size: iconSize,
              magnification: iconMagnification,
              distance: iconDistance,
            },
          );
        }
        return child;
      });
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={(event) => mouseX.set(event.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        {...props}
        className={cn(dockVariants({ className }), {
          "items-start": direction === "top",
          "items-center": direction === "middle",
          "items-end": direction === "bottom",
        })}
      >
        {renderChildren()}
      </motion.div>
    );
  },
);

Dock.displayName = "Dock";

export interface DockIconProps extends Omit<
  HTMLMotionProps<"div">,
  "children"
> {
  size?: number;
  magnification?: number;
  distance?: number;
  mouseX?: MotionValue<number>;
  className?: string;
  children?: React.ReactNode;
}

const DockIcon = ({
  size = DEFAULT_SIZE,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  mouseX,
  className,
  children,
  ...props
}: DockIconProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const padding = Math.max(6, size * 0.2);
  const fallbackMouseX = useMotionValue(Infinity);

  const distanceCalc = useTransform(
    mouseX ?? fallbackMouseX,
    (value: number) => {
      const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
      return value - bounds.x - bounds.width / 2;
    },
  );

  const sizeTransform = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [size, magnification, size],
  );
  const scaleSize = useSpring(sizeTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width: scaleSize, height: scaleSize, padding }}
      className={cn(
        "flex aspect-square items-center justify-center",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

DockIcon.displayName = "DockIcon";

export type FloatingDockItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  hideLabel?: boolean;
  render?: (props: {
    item: FloatingDockItem;
    className: string;
    children: React.ReactNode;
  }) => React.ReactElement;
};

export type FloatingDockProps = {
  items: FloatingDockItem[];
  panel?: React.ReactNode;
  panelOpen?: boolean;
  onClosePanel?: () => void;
  keepVisible?: boolean;
  hideDelay?: number;
  wakeZoneWidth?: number;
  armAutoHideOnScroll?: boolean;
  scrollThreshold?: number;
  className?: string;
  dockClassName?: string;
};

function DockItemBody({ item }: { item: FloatingDockItem }) {
  return (
    <>
      {!item.hideLabel ? (
        <span
          className={cn(
            "pointer-events-none absolute left-1/2 -top-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] text-foreground/80 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          )}
        >
          {item.label}
        </span>
      ) : null}
      <span
        className={cn(
          "relative z-10 flex size-12 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 ease-out group-hover:text-foreground",
          item.active && "text-primary",
        )}
      >
        {item.icon}
      </span>
    </>
  );
}

export function FloatingDock({
  items,
  panel,
  panelOpen = false,
  onClosePanel,
  keepVisible = false,
  hideDelay = 3000,
  wakeZoneWidth = 360,
  armAutoHideOnScroll = true,
  scrollThreshold = 220,
  className,
  dockClassName,
}: FloatingDockProps) {
  const reducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = React.useState(true);
  const [isHovering, setIsHovering] = React.useState(false);
  const [isFocusWithin, setIsFocusWithin] = React.useState(false);
  const [autoHideArmed, setAutoHideArmed] =
    React.useState(!armAutoHideOnScroll);
  const [isMobile, setIsMobile] = React.useState(false);
  const hideTimer = React.useRef<number | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const dockRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setIsMobile(isTouchDevice || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  React.useEffect(() => {
    if (!armAutoHideOnScroll) return;

    const handleScroll = () => {
      if (autoHideArmed) return;
      const doc = document.documentElement;
      const distanceToBottom =
        doc.scrollHeight - (window.scrollY + window.innerHeight);

      if (window.scrollY > 24 && distanceToBottom <= scrollThreshold) {
        setAutoHideArmed(true);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [armAutoHideOnScroll, autoHideArmed, scrollThreshold]);

  React.useEffect(() => {
    if (isMobile) return;

    const shouldStayVisible =
      !autoHideArmed || keepVisible || panelOpen || isHovering || isFocusWithin;

    if (shouldStayVisible) {
      setIsVisible(true);
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      return;
    }

    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
    }

    hideTimer.current = window.setTimeout(() => setIsVisible(false), hideDelay);

    return () => {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [
    autoHideArmed,
    hideDelay,
    isFocusWithin,
    isHovering,
    isMobile,
    keepVisible,
    panelOpen,
  ]);

  React.useEffect(() => {
    if (!panelOpen || !onClosePanel) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (dockRef.current?.contains(target)) return;
      onClosePanel();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClosePanel();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClosePanel, panelOpen]);

  return (
    <>
      <div
        aria-hidden
        className="fixed bottom-0 left-1/2 z-40 h-16 -translate-x-1/2"
        style={{ width: `min(92vw, ${wakeZoneWidth}px)` }}
        onMouseEnter={() => setIsVisible(true)}
      />

      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-2 pt-1",
          className,
        )}
      >
        <div
          className="pointer-events-auto flex flex-col items-center gap-2"
          onMouseEnter={() => {
            setIsHovering(true);
            setIsVisible(true);
          }}
          onMouseLeave={() => setIsHovering(false)}
          onFocusCapture={() => {
            setIsFocusWithin(true);
            setIsVisible(true);
          }}
          onBlurCapture={(event) => {
            if (
              event.currentTarget.contains(event.relatedTarget as Node | null)
            )
              return;
            setIsFocusWithin(false);
          }}
        >
          <AnimatePresence>
            {panelOpen && panel ? (
              <motion.div
                ref={panelRef}
                initial={
                  reducedMotion ? false : { opacity: 0, y: 10, scale: 0.98 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 8, scale: 0.98 }
                }
                transition={{
                  duration: reducedMotion ? 0 : 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-fit"
              >
                {panel}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.div
            ref={dockRef}
            initial={false}
            animate={
              reducedMotion
                ? { opacity: isVisible ? 1 : 0 }
                : {
                    y: isVisible ? 0 : 72,
                    opacity: isVisible ? 1 : 0,
                  }
            }
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 28,
              mass: 0.45,
            }}
            className={cn(
              isVisible ? "pointer-events-auto" : "pointer-events-none",
            )}
          >
            <Dock
              direction="middle"
              className={cn(
                "border-border/45 bg-background/78 px-3 shadow-[0_20px_44px_-28px_rgba(15,23,42,0.4)] backdrop-blur-sm",
                dockClassName,
              )}
            >
              {items.map((item) => (
                <DockIcon key={item.id}>
                  {item.render ? (
                    item.render({
                      item,
                      className:
                        "group relative inline-flex size-12 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      children: <DockItemBody item={item} />,
                    })
                  ) : (
                    <button
                      type="button"
                      aria-label={item.label}
                      className="group relative inline-flex size-12 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <DockItemBody item={item} />
                    </button>
                  )}
                </DockIcon>
              ))}
            </Dock>
          </motion.div>
        </div>
      </div>

      {isMobile ? (
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-1">
          <button
            type="button"
            onClick={() => setIsVisible((prev) => !prev)}
            className="pointer-events-auto mt-2 h-1.5 w-16 rounded-full bg-foreground/20"
            aria-label="Toggle dock"
          />
        </div>
      ) : null}
    </>
  );
}

export { Dock, DockIcon, dockVariants };

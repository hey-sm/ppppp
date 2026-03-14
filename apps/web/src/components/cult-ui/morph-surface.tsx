import React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";

type SpringConfig = {
  type: "spring";
  stiffness: number;
  damping: number;
  mass?: number;
  delay?: number;
};

const SPEED = 1;
const FEEDBACK_WIDTH = 360;
const FEEDBACK_HEIGHT = 200;

interface TriggerProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

interface ContentProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void | Promise<void>;
  className?: string;
}

interface IndicatorProps {
  success: boolean;
  isOpen: boolean;
  className?: string;
}

interface MorphSurfaceProps {
  collapsedWidth?: number | "auto";
  collapsedHeight?: number;
  expandedWidth?: number;
  expandedHeight?: number;

  animationSpeed?: number;
  springConfig?: SpringConfig;

  surfaceLabel?: string;
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
  placeholder?: string;
  submitLabel?: string;

  onSubmit?: (data: FormData) => void | Promise<void>;
  onOpen?: () => void;
  onClose?: () => void;
  onSuccess?: () => void;

  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  surfaceClassName?: string;

  renderTrigger?: (props: TriggerProps) => React.ReactNode;
  renderContent?: (props: ContentProps) => React.ReactNode;
  renderIndicator?: (props: IndicatorProps) => React.ReactNode;

  showDock?: boolean;
}

interface MorphSurfaceContextValue {
  showFeedback: boolean;
  success: boolean;
  openFeedback: () => void;
  closeFeedback: () => void;
  surfaceLabel: string;
  triggerLabel: string;
  triggerIcon?: React.ReactNode;
  placeholder: string;
  submitLabel: string;
  onSubmit?: (data: FormData) => void | Promise<void>;
  onOpen?: () => void;
  onClose?: () => void;
  onSuccess?: () => void;
  triggerClassName?: string;
  contentClassName?: string;
  renderTrigger?: (props: TriggerProps) => React.ReactNode;
  renderContent?: (props: ContentProps) => React.ReactNode;
  renderIndicator?: (props: IndicatorProps) => React.ReactNode;
  animationSpeed: number;
  springConfig?: SpringConfig;
  expandedWidth: number;
  expandedHeight: number;
}

const MorphSurfaceContext = createContext<MorphSurfaceContextValue>(
  {} as MorphSurfaceContextValue,
);

const useMorphSurface = () => useContext(MorphSurfaceContext);

function useMorphSurfaceLogic({
  isOpen: controlledIsOpen,
  onOpenChange,
  expandedWidth = FEEDBACK_WIDTH,
  expandedHeight = FEEDBACK_HEIGHT,
  collapsedHeight = 44,
  animationSpeed = SPEED,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  expandedWidth?: number;
  expandedHeight?: number;
  collapsedHeight?: number;
  animationSpeed?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const showFeedback = isOpen;

  function closeFeedback() {
    if (controlledIsOpen !== undefined) {
      onOpenChange?.(false);
    } else {
      setInternalIsOpen(false);
    }
    inputRef.current?.blur();
  }

  function openFeedback() {
    if (controlledIsOpen !== undefined) {
      onOpenChange?.(!isOpen);
    } else {
      setInternalIsOpen((prev) => !prev);
    }
    if (!showFeedback) {
      setTimeout(() => {
        inputRef.current?.focus();
      });
    }
  }

  function setSuccessState(value: boolean) {
    setSuccess(value);
  }

  useClickOutside(containerRef, closeFeedback, showFeedback);

  return {
    containerRef,
    inputRef,
    showFeedback,
    success,
    openFeedback,
    closeFeedback,
    setSuccess: setSuccessState,
    expandedWidth,
    expandedHeight,
    collapsedHeight,
    animationSpeed,
  };
}

export function MorphSurface({
  collapsedWidth = FEEDBACK_WIDTH,
  collapsedHeight = 44,
  expandedWidth = FEEDBACK_WIDTH,
  expandedHeight = FEEDBACK_HEIGHT,
  animationSpeed = SPEED,
  springConfig,
  surfaceLabel = "Morph Surface",
  triggerLabel = "Feedback",
  triggerIcon,
  placeholder = "What's on your mind?",
  submitLabel,
  onSubmit,
  onOpen,
  onClose,
  onSuccess,
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
  triggerClassName,
  contentClassName,
  surfaceClassName,
  renderTrigger,
  renderContent,
  renderIndicator,
  showDock = true,
}: MorphSurfaceProps = {}) {
  const hookLogic = useMorphSurfaceLogic({
    isOpen: controlledIsOpen,
    onOpenChange,
    expandedWidth,
    expandedHeight,
    collapsedHeight,
    animationSpeed,
  });

  const {
    containerRef,
    inputRef,
    showFeedback,
    success,
    openFeedback,
    closeFeedback,
    setSuccess,
    expandedWidth: hookExpandedWidth,
    expandedHeight: hookExpandedHeight,
    collapsedHeight: hookCollapsedHeight,
  } = hookLogic;

  function onFeedbackSuccess() {
    closeFeedback();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, 1500);
    onSuccess?.();
  }

  const context = useMemo(
    () => ({
      showFeedback,
      success,
      openFeedback: () => {
        openFeedback();
        onOpen?.();
      },
      closeFeedback: () => {
        closeFeedback();
        onClose?.();
      },
      surfaceLabel,
      triggerLabel,
      triggerIcon,
      placeholder,
      submitLabel: submitLabel || "⌘ Enter",
      onSubmit,
      onOpen,
      onClose,
      onSuccess,
      triggerClassName,
      contentClassName,
      renderTrigger,
      renderContent,
      renderIndicator,
      animationSpeed,
      springConfig,
      expandedWidth: hookExpandedWidth,
      expandedHeight: hookExpandedHeight,
    }),
    [
      showFeedback,
      success,
      openFeedback,
      closeFeedback,
      surfaceLabel,
      triggerLabel,
      triggerIcon,
      placeholder,
      submitLabel,
      onSubmit,
      onOpen,
      onClose,
      onSuccess,
      triggerClassName,
      contentClassName,
      renderTrigger,
      renderContent,
      renderIndicator,
      animationSpeed,
      springConfig,
      hookExpandedWidth,
      hookExpandedHeight,
    ],
  );

  return (
    <div
      className={cn("flex items-end justify-center", className)}
      style={{
        width: hookExpandedWidth,
        height: hookExpandedHeight,
      }}
    >
      <motion.div
        ref={containerRef}
        onClick={() => {
          if (!showFeedback) {
            openFeedback();
          }
        }}
        className={cn(
          "relative bottom-4 z-10 flex flex-col items-center overflow-hidden",
          "bg-card dark:bg-muted",
          "shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)]",
          "dark:shadow-[0px_1px_0px_0px_hsla(0,_0%,_0%,_0.02)_inset,_0px_0px_0px_1px_hsla(0,_0%,_0%,_0.02)_inset,_0px_0px_0px_1px_rgba(255,_255,_255,_0.25)]",
          !showFeedback &&
            "cursor-pointer transition-[filter] duration-200 hover:brightness-105",
          surfaceClassName,
        )}
        initial={false}
        animate={{
          width: showFeedback ? hookExpandedWidth : collapsedWidth,
          height: showFeedback ? hookExpandedHeight : hookCollapsedHeight,
          borderRadius: showFeedback ? 14 : 20,
        }}
        transition={
          springConfig || {
            type: "spring",
            stiffness: 550 / animationSpeed,
            damping: 45,
            mass: 0.7,
            delay: showFeedback ? 0 : 0.08,
          }
        }
      >
        <MorphSurfaceContext.Provider value={context}>
          {showDock ? <MorphSurfaceDock /> : null}
          <MorphSurfaceFeedback ref={inputRef} onSuccess={onFeedbackSuccess} />
        </MorphSurfaceContext.Provider>
      </motion.div>
    </div>
  );
}

function MorphSurfaceDock() {
  const {
    success,
    showFeedback,
    openFeedback,
    surfaceLabel,
    triggerLabel,
    triggerIcon,
    triggerClassName,
    renderTrigger,
    renderIndicator,
    animationSpeed,
    springConfig,
  } = useMorphSurface();

  const logoSpring = springConfig || {
    type: "spring" as const,
    stiffness: 350 / animationSpeed,
    damping: 35,
  };

  const checkSpring = {
    type: "spring" as const,
    stiffness: 500 / animationSpeed,
    damping: 22,
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openFeedback();
  };

  const defaultIndicator = (
    <>
      {showFeedback ? (
        <div className="h-5 w-5" style={{ opacity: 0 }} />
      ) : (
        <motion.div
          className="h-5 w-5 rounded-full bg-primary"
          layoutId={`morph-surface-dot-${triggerLabel}`}
          transition={logoSpring}
        >
          <AnimatePresence>
            {success && (
              <motion.div
                key="check"
                exit={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.5 }}
                transition={{
                  ...checkSpring,
                  delay: success ? 0.3 : 0,
                }}
                className="m-[2px]"
              >
                <IconCheck />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );

  const defaultTrigger = (
    <button
      type="button"
      className={cn(
        "m-[-8px] flex flex-1 justify-end gap-1 rounded-full p-2",
        "text-muted-foreground transition-colors duration-200 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        triggerClassName,
      )}
      onClick={handleTriggerClick}
    >
      {triggerIcon && <span className="flex items-center">{triggerIcon}</span>}
      <span className="ml-1 max-w-[20ch] truncate">{triggerLabel}</span>
    </button>
  );

  const indicatorElement = renderIndicator
    ? renderIndicator({
        success,
        isOpen: showFeedback,
      })
    : defaultIndicator;

  const triggerElement = renderTrigger
    ? renderTrigger({
        isOpen: showFeedback,
        onClick: () => openFeedback(),
        className: triggerClassName,
      })
    : defaultTrigger;

  return (
    <footer className="mt-auto flex h-[44px] select-none items-center justify-center whitespace-nowrap">
      <div className="flex items-center justify-center gap-6 px-3">
        <div className="flex w-fit items-center gap-2">
          {indicatorElement}
          <div className="text-sm text-foreground">{surfaceLabel}</div>
        </div>
        {triggerElement}
      </div>
    </footer>
  );
}

const MorphSurfaceFeedback = React.forwardRef<
  HTMLTextAreaElement,
  { onSuccess: () => void }
>(({ onSuccess }, ref) => {
  const {
    closeFeedback,
    showFeedback,
    placeholder,
    onSubmit,
    contentClassName,
    renderContent,
    expandedWidth,
    expandedHeight,
    animationSpeed,
    triggerLabel,
  } = useMorphSurface();
  const submitRef = useRef<HTMLButtonElement>(null);

  const contentSpring = {
    type: "spring" as const,
    stiffness: 550 / animationSpeed,
    damping: 45,
    mass: 0.7,
  };

  const logoSpring = {
    type: "spring" as const,
    stiffness: 350 / animationSpeed,
    damping: 35,
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (onSubmit) {
      try {
        await onSubmit(formData);
        onSuccess();
      } catch (error) {
        console.error("Form submission error:", error);
      }
    } else {
      onSuccess();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      closeFeedback();
    }
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      submitRef.current?.click();
    }
  }

  const defaultContent = (
    <>
      <div className="flex justify-between py-1">
        <p className="z-[2] ml-[25px] flex select-none items-center gap-[6px] text-sm text-muted-foreground">
          {triggerLabel}
        </p>
        <button
          type="submit"
          ref={submitRef}
          className={cn(
            "mt-1 flex items-center justify-center gap-1 -translate-y-[3px] text-sm",
            "right-4 cursor-pointer select-none rounded-xl bg-transparent pr-1 text-center text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <Kbd>⌘</Kbd>
          <Kbd className="w-fit">Enter</Kbd>
        </button>
      </div>
      <textarea
        ref={ref}
        placeholder={placeholder}
        name="message"
        className={cn(
          "h-full w-full resize-none scroll-py-2 p-4 text-base outline-none",
          "rounded-b-lg rounded-t-xs bg-muted dark:bg-accent",
          "caret-primary placeholder:text-muted-foreground",
          "focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:ring-offset-0",
        )}
        required
        onKeyDown={onKeyDown}
        spellCheck={false}
      />
    </>
  );

  const handleContentSubmit = async (data: FormData) => {
    if (onSubmit) {
      try {
        await onSubmit(data);
        onSuccess();
      } catch (error) {
        console.error("Form submission error:", error);
      }
    } else {
      onSuccess();
    }
  };

  const contentElement = renderContent
    ? renderContent({
        isOpen: showFeedback,
        onClose: closeFeedback,
        onSubmit: handleContentSubmit,
        className: contentClassName,
      })
    : defaultContent;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("absolute bottom-0", contentClassName)}
      style={{
        width: expandedWidth,
        height: expandedHeight,
        pointerEvents: showFeedback ? "all" : "none",
      }}
    >
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={contentSpring}
            className="flex h-full flex-col p-1"
          >
            {contentElement}
          </motion.div>
        )}
      </AnimatePresence>
      {showFeedback && (
        <motion.div
          layoutId={`morph-surface-dot-${triggerLabel}`}
          className="absolute left-4 top-[18.5px] h-2 w-2 rounded-full bg-primary"
          transition={logoSpring}
        />
      )}
    </form>
  );
});

MorphSurfaceFeedback.displayName = "MorphSurfaceFeedback";

function IconCheck() {
  return (
    <svg
      width="16px"
      height="16px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      color="white"
    >
      <title>Icon Check</title>
      <path
        d="M5 13L9 17L19 7"
        stroke="currentColor"
        strokeWidth="2px"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Kbd({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded border bg-muted px-[6px] font-sans text-xs text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent | PointerEvent) => void,
  isOpen: boolean,
) {
  useEffect(() => {
    let startedOutsideWhileOpen = false;

    const isOutside = (event: Event) => {
      const el = ref?.current;
      return !!el && !el.contains((event?.target as Node) || null);
    };

    const handlePointerStart = (event: PointerEvent) => {
      startedOutsideWhileOpen = isOpen && isOutside(event);
    };

    const handleClick = (event: MouseEvent) => {
      if (startedOutsideWhileOpen && isOpen && isOutside(event)) {
        handler(event);
      }
      startedOutsideWhileOpen = false;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (startedOutsideWhileOpen && isOpen && isOutside(event)) {
        handler(event);
      }
      startedOutsideWhileOpen = false;
    };

    document.addEventListener("pointerdown", handlePointerStart);
    document.addEventListener("click", handleClick);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("pointerdown", handlePointerStart);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ref, handler, isOpen]);
}

import { useEffect, useMemo, useRef } from 'react'
import type { LogEntry } from '@fluxp/logger-sdk'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useLogStore, type LogFilter } from '../stores/logStore'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

const FILTERS: { label: string; value: LogFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Info', value: 'info' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
]

const LEVEL_STYLES: Record<string, string> = {
  info: 'text-status-info',
  warn: 'text-status-warn',
  error: 'text-destructive',
  debug: 'text-muted-foreground',
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function summarizeMetadata(metadata?: Record<string, unknown>): string | null {
  if (!metadata) return null

  const priorityKeys = ['url', 'path', 'selector', 'method', 'status']

  for (const key of priorityKeys) {
    const value = metadata[key]
    if (value == null) continue
    return `${key}: ${String(value)}`
  }

  const firstEntry = Object.entries(metadata)[0]
  if (!firstEntry) return null

  return `${firstEntry[0]}: ${String(firstEntry[1])}`
}

function formatUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin)
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return url
  }
}

function buildLogTitle(log: LogEntry): string {
  switch (log.category) {
    case 'click': {
      const text = typeof log.metadata?.text === 'string' ? log.metadata.text.trim() : ''
      const identifier =
        typeof log.metadata?.identifier === 'string' ? log.metadata.identifier : ''
      const target = text || identifier || 'unknown-target'
      return `Clicked ${target}`
    }
    case 'router': {
      const trigger = typeof log.metadata?.trigger === 'string' ? log.metadata.trigger : ''

      if (trigger === 'replaceState') return 'Route replaced'
      if (trigger === 'popstate') return 'Browser navigation'
      return 'Route changed'
    }
    case 'fetch': {
      const method = typeof log.metadata?.method === 'string' ? log.metadata.method : 'REQUEST'
      const status = log.metadata?.status

      if (typeof status === 'number') {
        return `${method} completed - ${status}`
      }

      return `${method} failed`
    }
    case 'error': {
      const type = typeof log.metadata?.type === 'string' ? log.metadata.type : ''
      if (type === 'unhandled_rejection') return 'Unhandled promise rejection'
      return 'Runtime error'
    }
    default:
      return log.message
  }
}

function buildBehaviorLabel(log: LogEntry): string {
  switch (log.category) {
    case 'click':
      return 'click'
    case 'router':
      return 'route'
    case 'fetch':
      return 'fetch'
    case 'error':
      return 'error'
    default:
      return 'event'
  }
}

function buildLogDescription(log: LogEntry): string {
  switch (log.category) {
    case 'click': {
      const identifier =
        typeof log.metadata?.identifier === 'string' ? log.metadata.identifier : ''
      const tagName = typeof log.metadata?.tagName === 'string' ? log.metadata.tagName : ''
      const parts = [identifier && `Target: ${identifier}`, tagName && `Tag: <${tagName}>`].filter(
        Boolean,
      )

      return parts.join(' | ') || log.message
    }
    case 'router': {
      const path = typeof log.metadata?.path === 'string' ? log.metadata.path : ''
      const search = typeof log.metadata?.search === 'string' ? log.metadata.search : ''
      const hash = typeof log.metadata?.hash === 'string' ? log.metadata.hash : ''
      return `${path}${search}${hash}` || log.message
    }
    case 'fetch': {
      const url = typeof log.metadata?.url === 'string' ? log.metadata.url : ''
      return url ? formatUrl(url) : log.message
    }
    case 'error':
      return log.message
    default:
      return summarizeMetadata(log.metadata) ?? log.message
  }
}

function buildLogMeta(log: LogEntry): string | null {
  switch (log.category) {
    case 'click': {
      const x = typeof log.metadata?.x === 'number' ? log.metadata.x : null
      const y = typeof log.metadata?.y === 'number' ? log.metadata.y : null
      return x !== null && y !== null ? `Position ${x}, ${y}` : null
    }
    case 'router': {
      const trigger = typeof log.metadata?.trigger === 'string' ? log.metadata.trigger : ''
      return trigger ? `Source: ${trigger}` : null
    }
    case 'fetch': {
      const duration = typeof log.metadata?.duration === 'number' ? log.metadata.duration : null
      return duration !== null ? `Duration ${duration}ms` : null
    }
    case 'error': {
      const filename =
        typeof log.metadata?.filename === 'string' ? formatUrl(log.metadata.filename) : ''
      const lineno = typeof log.metadata?.lineno === 'number' ? log.metadata.lineno : null
      return filename ? `${filename}${lineno ? `:${lineno}` : ''}` : null
    }
    default:
      return summarizeMetadata(log.metadata)
  }
}

/** 三次 Shift 快捷键检测 */
const SHIFT_THRESHOLD = 600

export function DevToolsPanel() {
  const { t } = useTranslation()
  const {
    logs,
    filter,
    isOpen,
    isVisible,
    togglePanel,
    setFilter,
    clearLogs,
    hideDevTools,
    showDevTools,
  } = useLogStore()
  const shiftTimesRef = useRef<number[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  // 监听三次 Shift 唤醒
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Shift') {
        shiftTimesRef.current = []
        return
      }

      const now = Date.now()
      shiftTimesRef.current.push(now)

      if (shiftTimesRef.current.length > 3) {
        shiftTimesRef.current = shiftTimesRef.current.slice(-3)
      }

      if (shiftTimesRef.current.length === 3) {
        const elapsed = shiftTimesRef.current[2] - shiftTimesRef.current[0]
        if (elapsed <= SHIFT_THRESHOLD) {
          showDevTools()
          shiftTimesRef.current = []
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDevTools])

  const filteredLogs = useMemo(
    () => (filter === 'all' ? logs : logs.filter((log) => log.level === filter)),
    [logs, filter],
  )

  const displayLogs = useMemo(() => [...filteredLogs].reverse(), [filteredLogs])

  useEffect(() => {
    if (!isOpen) return

    const listEl = listRef.current
    if (!listEl) return

    if (listEl.scrollTop < 80) {
      listEl.scrollTo({
        top: 0,
        behavior: displayLogs.length > 1 ? 'smooth' : 'auto',
      })
    }
  }, [displayLogs.length, isOpen])

  if (!isVisible) return null

  return (
    <>
      <div className="fixed bottom-4 right-4 z-999">
        <button
          className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
          onClick={togglePanel}
          data-track="devtools-toggle"
          title="Toggle DevTools"
        >
          <img src="/favicon.svg" alt="" className="h-3.5 w-3.5 shrink-0 invert dark:invert-0" />
          <span>logs</span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-14 right-4 z-[998] flex h-[min(32rem,calc(100vh-6rem))] w-[min(34rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[calc(var(--radius)+0.35rem)] border border-border/80 bg-[color-mix(in_srgb,var(--card)_92%,transparent)] shadow-[var(--surface-shadow)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between border-b border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--muted)_90%,transparent)_0%,transparent_100%)] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <img src="/favicon.svg" alt="" className="h-3.5 w-3.5 shrink-0 dark:invert" />
                  {t('devtools.title')}
                </span>
                <ToggleGroup
                  type="single"
                  value={filter}
                  onValueChange={(val) => {
                    if (val) setFilter(val as LogFilter)
                  }}
                  size="sm"
                >
                  {FILTERS.map((f) => (
                    <ToggleGroupItem
                      key={f.value}
                      value={f.value}
                      className="h-auto px-2 py-1 text-xs"
                      data-track={`devtools-filter-${f.value}`}
                    >
                      {f.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearLogs}
                  className="h-7 text-xs"
                  data-track="devtools-clear"
                >
                  {t('devtools.clear')}
                </Button>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={hideDevTools}
                  title={t('devtools.close')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-card via-card/65 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-card via-card/65 to-transparent" />
              <div
                ref={listRef}
                className="h-full overflow-y-auto px-3 py-3 text-[0.75rem] leading-5"
              >
                {displayLogs.length === 0 ? (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                    {t('devtools.waitingLogs')}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {displayLogs.map((log, index) => {
                      const levelClass = LEVEL_STYLES[log.level] ?? LEVEL_STYLES.info
                      const behavior = buildBehaviorLabel(log)
                      const title = buildLogTitle(log)
                      const description = buildLogDescription(log)
                      const meta = buildLogMeta(log)

                      return (
                        <article
                          key={`${log.timestamp}-${index}`}
                          className={cn(
                            'rounded-lg border border-border/70 bg-card/95 px-3 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-colors duration-150',
                            'hover:bg-card',
                          )}
                        >
                          <div className="min-w-0">
                            <div className="mb-1 flex items-center justify-between gap-3">
                              <span className={cn('text-[0.72rem] font-medium lowercase tracking-[0.04em]', levelClass)}>
                                {behavior}
                              </span>
                            </div>
                            <div className="border-t border-border/60 pt-1.5">
                              <p className="break-words text-[0.8rem] leading-5 text-foreground">
                                {title}
                              </p>
                              <p className="mt-1 border-t border-dashed border-border/50 pt-1 break-words text-[0.8rem] leading-5 text-foreground/78">
                                {description}
                              </p>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-border/50 pt-1.5 text-[0.72rem] text-foreground/70">
                              <span className="truncate font-mono tabular-nums">
                                {meta ?? '-'}
                              </span>
                              <span className="shrink-0 font-mono tabular-nums">
                                {formatTime(log.timestamp)}
                              </span>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

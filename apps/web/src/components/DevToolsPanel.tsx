import { useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Info, AlertTriangle, AlertCircle, Bug, X } from 'lucide-react'
import { useLogStore, type LogFilter } from '../stores/logStore'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const LEVEL_ICONS: Record<string, typeof Info> = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  debug: Bug,
}

const FILTERS: { label: string; value: LogFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Info', value: 'info' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
]

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** 三次 Shift 快捷键检测 */
const SHIFT_THRESHOLD = 600 // ms 内连按三次

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

  if (!isVisible) return null

  return (
    <>
      {/* ── 触发器：仅保留 toggle 按钮 ── */}
      <div className="fixed bottom-4 right-4 z-999">
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={togglePanel}
          data-track="devtools-toggle"
          title="Toggle DevTools"
        >
          <img src="/favicon.svg" alt="" className="w-3.5 h-3.5 invert dark:invert-0 shrink-0" />
          <span>logs</span>
        </button>
      </div>

      {/* ── 日志面板 ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="devtools-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="devtools-header">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm flex items-center gap-1.5">
                  <img src="/favicon.svg" alt="" className="w-3.5 h-3.5 dark:invert shrink-0" />
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
                      className="text-xs px-2 py-1 h-auto"
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
                  className="text-xs h-7"
                  data-track="devtools-clear"
                >
                  {t('devtools.clear')}
                </Button>
                <button
                  className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200"
                  onClick={hideDevTools}
                  title={t('devtools.close')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="devtools-logs">
              {filteredLogs.length === 0 ? (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  {t('devtools.waitingLogs')}
                </div>
              ) : (
                filteredLogs.map((log, index) => {
                  const LevelIcon = LEVEL_ICONS[log.level] ?? Info
                  return (
                    <div
                      key={`${log.timestamp}-${index}`}
                      className={`devtools-log-entry log-${log.level}`}
                    >
                      <div className="log-meta">
                        <LevelIcon className="log-level-icon" />
                        <span className="log-category">{log.category}</span>
                        <span className="log-time">{formatTime(log.timestamp)}</span>
                      </div>
                      <div className="log-message">{log.message}</div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

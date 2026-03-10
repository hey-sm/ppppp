// ============================================================================
// 性能监控大盘页面 (Performance Dashboard)
// ============================================================================
//
// 改造要点：
// 1. 指标卡片 → shadcn <Card>
// 2. Toggle → shadcn <Switch>
// 3. 所有文本使用 i18n t()
// 4. 去除旧 inline styles，使用 Tailwind + shadcn CSS 变量

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { usePerfStore } from '../stores/perfStore'
import { VirtualList } from '@fluxp/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

/** 渲染对比 Demo 的数据 */
const generateItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    text: `Row #${i + 1} — ${Math.random().toString(36).slice(2, 10)}`,
  }))

const DEMO_COUNT = 10000
const DEMO_ITEMS = generateItems(DEMO_COUNT)

/** FPS 计数器 hook：用 rAF 实时计算当前帧率 */
function useFPSCounter() {
  const [fps, setFps] = useState(0)
  const frameRef = useRef<number>(0)
  const lastRef = useRef<number>(performance.now())
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    function tick(now: number) {
      frameRef.current++
      const delta = now - lastRef.current
      if (delta >= 1000) {
        setFps(Math.round((frameRef.current / delta) * 1000))
        frameRef.current = 0
        lastRef.current = now
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return fps
}

/**
 * 单个 Web Vital 指标卡片
 */
function MetricCard({
  name,
  value,
  unit,
  rating,
  ratingLabel,
}: {
  name: string
  value: number | string
  unit?: string
  rating?: 'good' | 'needs-improvement' | 'poor'
  ratingLabel?: string
}) {
  const colorClass =
    rating === 'good' ? 'metric-good' : rating === 'poor' ? 'metric-poor' : 'metric-warn'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
    >
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{name}</div>
          <div className={`metric-value ${colorClass}`}>
            {value}
            {unit && <span className="text-base font-normal">{unit}</span>}
          </div>
          {rating && ratingLabel && (
            <div className="text-xs mt-1 text-muted-foreground">
              {rating === 'good' ? '✓' : rating === 'poor' ? '✗' : '△'} {ratingLabel}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function DashboardPage() {
  const { t } = useTranslation()
  const { metrics } = usePerfStore()
  const [useVirtual, setUseVirtual] = useState(false)
  const liveFps = useFPSCounter()

  // Web Vitals 数据
  const vitals = metrics.vitals

  /** 根据 rating 获取翻译后的文本 */
  const ratingText = (rating?: 'good' | 'needs-improvement' | 'poor') => {
    if (!rating) return ''
    if (rating === 'good') return t('dashboard.good')
    if (rating === 'poor') return t('dashboard.poor')
    return t('dashboard.needsImprovement')
  }

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-12">
      <motion.h1
        className="text-3xl font-bold mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        📊 {t('dashboard.title')}
      </motion.h1>
      <motion.p
        className="text-muted-foreground mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {t('dashboard.subtitle')}{' '}
        <code className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-mono text-sm">
          @fluxp/perf-monitor
        </code>
      </motion.p>

      {/* ════════════ Web Vitals 指标卡片 ════════════ */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-10">
        <MetricCard
          name="FCP"
          value={vitals.FCP?.value ?? '—'}
          unit={vitals.FCP ? 'ms' : ''}
          rating={vitals.FCP?.rating}
          ratingLabel={ratingText(vitals.FCP?.rating)}
        />
        <MetricCard
          name="LCP"
          value={vitals.LCP?.value ?? '—'}
          unit={vitals.LCP ? 'ms' : ''}
          rating={vitals.LCP?.rating}
          ratingLabel={ratingText(vitals.LCP?.rating)}
        />
        <MetricCard
          name="CLS"
          value={vitals.CLS?.value ?? '—'}
          rating={vitals.CLS?.rating}
          ratingLabel={ratingText(vitals.CLS?.rating)}
        />
        <MetricCard
          name="TTFB"
          value={vitals.TTFB?.value ?? '—'}
          unit={vitals.TTFB ? 'ms' : ''}
          rating={vitals.TTFB?.rating}
          ratingLabel={ratingText(vitals.TTFB?.rating)}
        />
        <MetricCard
          name="FPS"
          value={liveFps}
          rating={liveFps >= 55 ? 'good' : liveFps >= 30 ? 'needs-improvement' : 'poor'}
          ratingLabel={ratingText(
            liveFps >= 55 ? 'good' : liveFps >= 30 ? 'needs-improvement' : 'poor',
          )}
        />
      </div>

      {/* ════════════ 内存使用 ════════════ */}
      {metrics.memory && (
        <Card className="mb-10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🧠 {t('dashboard.memoryTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8 flex-wrap">
              <div>
                <div className="text-xs text-muted-foreground">{t('dashboard.usedHeap')}</div>
                <div className="text-xl font-semibold font-mono text-foreground">
                  {metrics.memory.usedJSHeapSize} MB
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t('dashboard.totalHeap')}</div>
                <div className="text-xl font-semibold font-mono text-muted-foreground">
                  {metrics.memory.totalJSHeapSize} MB
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t('dashboard.heapLimit')}</div>
                <div className="text-xl font-semibold font-mono text-muted-foreground">
                  {metrics.memory.jsHeapSizeLimit} MB
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ════════════ 渲染性能对比 Demo ════════════ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">
              ⚔️ {t('dashboard.renderBattle')} — {DEMO_COUNT.toLocaleString()}{' '}
              {t('dashboard.items')}
            </CardTitle>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm ${!useVirtual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
              >
                {t('dashboard.normal')}
              </span>
              <Switch
                checked={useVirtual}
                onCheckedChange={setUseVirtual}
                data-track="dashboard-toggle-virtual"
              />
              <span
                className={`text-sm ${useVirtual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
              >
                {t('dashboard.virtual')}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Badge variant={liveFps >= 50 ? 'secondary' : 'destructive'} className="font-mono">
              FPS: {liveFps}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Mode:{' '}
              {useVirtual ? `🟢 ${t('dashboard.modeVirtual')}` : `🔴 ${t('dashboard.modeNormal')}`}
            </span>
          </div>

          {/* 渲染区域 */}
          {useVirtual ? (
            <VirtualList
              items={DEMO_ITEMS}
              itemHeight={36}
              containerHeight={400}
              renderItem={(item) => (
                <span className="font-mono text-sm text-muted-foreground">{item.text}</span>
              )}
            />
          ) : (
            <div className="h-[400px] overflow-auto border rounded-lg bg-background">
              {DEMO_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="h-9 flex items-center px-4 border-b font-mono text-sm text-muted-foreground"
                >
                  {item.text}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════════════ Long Tasks ════════════ */}
      {metrics.longTasks.length > 0 && (
        <Card className="mt-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              ⚠️ {t('dashboard.longTasks')} ({metrics.longTasks.length} {t('dashboard.detected')})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {metrics.longTasks.slice(-20).map((task, i) => (
                <Badge
                  key={i}
                  variant={task.duration > 100 ? 'destructive' : 'secondary'}
                  className="font-mono"
                >
                  {task.duration}ms
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

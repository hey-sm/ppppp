// ============================================================================
// MSchedule 排期组件 Demo — /ui-lab/schedule
// ============================================================================

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MSchedule } from '@fluxp/ui'
import type { MScheduleValue } from '@fluxp/ui/types'
import { Badge } from '@/components/ui/badge'

/** 将 boolean[][] 格式化为 0/1 字符串，按行缩进 */
function formatAs01(grid: MScheduleValue): string {
  const rows = grid.map((row) => `  [${row.map((v) => (v ? '1' : '0')).join(',')}]`)
  return `[\n${rows.join(',\n')}\n]`
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function ScheduleDemo() {
  const { t } = useTranslation()
  const [value, setValue] = useState<MScheduleValue | undefined>()

  const selectedCount = value ? value.flat().filter(Boolean).length : 0

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t('uiLab.schedule.name')}</h2>
        <p className="text-muted-foreground mt-1">{t('uiLab.schedule.description')}</p>
        <div className="flex gap-2 flex-wrap mt-3">
          <Badge variant="secondary">{t('uiLab.tags.adSchedule')}</Badge>
          <Badge variant="secondary">{t('uiLab.tags.dragSelect')}</Badge>
          <Badge variant="secondary">{t('uiLab.tags.weeklyGrid')}</Badge>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{t('uiLab.schedule.demoHint')}</p>

      <MSchedule value={value} onChange={setValue} />

      {/* 0/1 格式化输出 */}
      {selectedCount > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">
            {t('uiLab.schedule.selectedOutput')}
            <span className="ml-2 text-muted-foreground font-normal">
              ({selectedCount}/168)
            </span>
          </p>
          <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-64 font-mono leading-relaxed">
            <span className="text-muted-foreground">{'// '}{DAYS.map((d) => d.padStart(3)).join('  ')}{'\n'}</span>
            {formatAs01(value!)}
          </pre>
        </div>
      )}
    </div>
  )
}

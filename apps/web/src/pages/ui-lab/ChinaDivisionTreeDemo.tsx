// ============================================================================
// MTree + province-city-china (data.min.json) Demo — /ui-lab/china-division-tree
// ============================================================================

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MTree } from '@fluxp/ui'
import type { ChinaDivisionMinItem } from '@fluxp/ui/types'
import { Badge } from '@/components/ui/badge'

export function ChinaDivisionTreeDemo() {
  const { t, i18n } = useTranslation()
  const [divisionData, setDivisionData] = useState<ChinaDivisionMinItem[] | null>(null)
  const [divisionError, setDivisionError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setDivisionError(null)
    setDivisionData(null)

    import('province-city-china/dist/data.min.json')
      .then((module) => {
        if (!active) return
        setDivisionData(module.default as ChinaDivisionMinItem[])
      })
      .catch(() => {
        if (!active) return
        setDivisionError(i18n.language === 'zh' ? '数据加载失败' : 'Data load failed')
      })

    return () => {
      active = false
    }
  }, [i18n.language])

  const counts = useMemo(() => {
    if (!divisionData) return null
    let provinces = 0
    let cities = 0
    let areas = 0
    let towns = 0
    const isZero = (v: any) => v === 0 || v === '0'
    for (const it of divisionData as any[]) {
      if (!isZero((it as any).t)) towns++
      else if (!isZero((it as any).a)) areas++
      else if (!isZero((it as any).y)) cities++
      else provinces++
    }
    return { provinces, cities, areas, towns }
  }, [divisionData])

  const loadingText = i18n.language === 'zh' ? '数据加载中...' : 'Loading data...'
  const loadFailedText = divisionError ?? loadingText
  const countsLabel = counts
    ? `p:${counts.provinces} c:${counts.cities} a:${counts.areas} t:${counts.towns}`
    : loadFailedText

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t('uiLab.chinaDivisionTree.name')}</h2>
        <p className="text-muted-foreground mt-1">
          {t('uiLab.chinaDivisionTree.description')}
        </p>
        <div className="flex gap-2 flex-wrap mt-3">
          <Badge variant="secondary">{t('uiLab.tags.treeSelect')}</Badge>
          <Badge variant="secondary">{t('uiLab.tags.virtualScroll')}</Badge>
          <Badge variant="secondary">{t('uiLab.tags.provinceCity')}</Badge>
          <Badge variant="secondary" className="font-mono">
            {countsLabel}
          </Badge>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{t('uiLab.chinaDivisionTree.demoHint')}</p>

      {divisionData ? (
        <MTree
          data={divisionData}
          renderMode="virtual"
          showModeToggle={false}
          height={520}
        />
      ) : (
        <div className="flex h-[520px] items-center justify-center text-sm text-muted-foreground">
          {loadFailedText}
        </div>
      )}
    </div>
  )
}

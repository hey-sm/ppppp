// ============================================================================
// MRegionTree 地域树选择 Demo — /ui-lab/region-tree
// ============================================================================

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MRegionTree } from '@fluxp/ui'
import type { MRegionTreeData, MRegionTreeValue } from '@fluxp/ui/types'
import { Badge } from '@/components/ui/badge'
import { loadProvinceCityData } from '@/data/provinceCity'
import { useSessionStorageState } from '@/lib/useSessionStorageState'

export function RegionTreeDemo() {
  const { t, i18n } = useTranslation()
  const [value, setValue] = useSessionStorageState<MRegionTreeValue>(
    'ui-lab:region-tree',
    [],
  )
  const [regionData, setRegionData] = useState<MRegionTreeData | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true
    setLoadError(false)
    setRegionData(null)

    loadProvinceCityData()
      .then((data) => {
        if (!active) return
        setRegionData(data)
      })
      .catch(() => {
        if (!active) return
        setLoadError(true)
      })

    return () => {
      active = false
    }
  }, [])

  const loadingText = i18n.language === 'zh' ? '数据加载中...' : 'Loading data...'
  const loadFailedText = i18n.language === 'zh' ? '数据加载失败' : 'Data load failed'
  const placeholderText = loadError ? loadFailedText : loadingText

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t('uiLab.regionTree.name')}</h2>
        <p className="text-muted-foreground mt-1">{t('uiLab.regionTree.description')}</p>
        <div className="flex gap-2 flex-wrap mt-3">
          <Badge variant="secondary">{t('uiLab.tags.treeSelect')}</Badge>
          <Badge variant="secondary">{t('uiLab.tags.provinceCity')}</Badge>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{t('uiLab.regionTree.demoHint')}</p>

      {regionData ? (
        <MRegionTree data={regionData} value={value} onChange={setValue} />
      ) : (
        <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
          {placeholderText}
        </div>
      )}
    </div>
  )
}

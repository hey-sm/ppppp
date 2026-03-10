// ============================================================================
// VirtualList 虚拟滚动 Demo — /ui-lab/virtual-list
// ============================================================================

import { useTranslation } from 'react-i18next'
import { VirtualList } from '@fluxp/ui'
import { Badge } from '@/components/ui/badge'

const DEMO_ITEMS = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item #${i + 1}`,
  value: Math.floor(Math.random() * 1000),
}))

export function VirtualListDemo() {
  const { t } = useTranslation()

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t('uiLab.virtualList.name')}</h2>
        <p className="text-muted-foreground mt-1">{t('uiLab.virtualList.description')}</p>
        <div className="flex gap-2 flex-wrap mt-3">
          <Badge variant="secondary">{t('uiLab.tags.perfOptimization')}</Badge>
          <Badge variant="secondary">{t('uiLab.tags.virtualScroll')}</Badge>
          <Badge variant="secondary">{t('uiLab.tags.domReuse')}</Badge>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{t('uiLab.virtualList.demoHint')}</p>

      <VirtualList
        items={DEMO_ITEMS}
        itemHeight={40}
        containerHeight={450}
        renderItem={(item) => (
          <div className="flex justify-between items-center w-full">
            <span>{item.name}</span>
            <span className="font-mono text-sm text-muted-foreground">{item.value}</span>
          </div>
        )}
      />
    </div>
  )
}

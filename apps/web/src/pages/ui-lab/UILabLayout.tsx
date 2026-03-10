// ============================================================================
// UI Lab 布局：左侧组件导航 + 右侧 <Outlet /> 渲染子路由
//
// 集成说明：
//   本文件作为 /ui-lab 的布局路由组件，在 router.tsx 中注册为 uiLabRoute 的 component。
//   每个组件 Demo（Schedule / VirtualList）各自是一个子路由，
//   挂载在 /ui-lab/:componentId 下，通过 <Outlet /> 渲染到右侧区域。
//   左侧导航使用 TanStack Router 的 <Link> 实现，点击时浏览器 URL 同步变化，
//   支持直接通过 URL 访问特定组件（如 /ui-lab/schedule）。
// ============================================================================

import { Link, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/ui-lab/schedule' as const, labelKey: 'uiLab.schedule.name', descKey: 'uiLab.schedule.description' },
  { to: '/ui-lab/virtual-list' as const, labelKey: 'uiLab.virtualList.name', descKey: 'uiLab.virtualList.description' },
]

export function UILabLayout() {
  const { t } = useTranslation()

  return (
    <div className="flex h-screen">
      {/* ── 左侧组件导航 ── */}
      <aside className="w-64 shrink-0 border-r border-border bg-muted/30 overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold">{t('uiLab.title')}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t('uiLab.subtitle')}</p>
        </div>
        <nav className="p-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.to} to={item.to}>
              {({ isActive }) => (
                <div
                  className={cn(
                    'w-full text-left rounded-md px-3 py-2.5 transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent text-foreground',
                  )}
                >
                  <div className="font-medium text-sm">{t(item.labelKey)}</div>
                  <div
                    className={cn(
                      'text-xs mt-0.5 line-clamp-2',
                      isActive ? 'text-primary-foreground/70' : 'text-muted-foreground',
                    )}
                  >
                    {t(item.descKey)}
                  </div>
                </div>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* ── 右侧 Demo 区域（由子路由填充） ── */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}

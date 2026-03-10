import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { House, FlaskConical, BarChart3, Sun, Moon, Monitor, Languages } from 'lucide-react'
import { useAppStore, type Theme } from '@/stores/appStore'
import { COLOR_SCALES, getThemeShade } from '@/lib/colors'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

const NAV_ITEMS = [
  { to: '/' as const, icon: House, labelKey: 'nav.home', track: 'nav-home' },
  {
    to: '/ui-lab' as const,
    icon: FlaskConical,
    labelKey: 'nav.uiLab',
    track: 'nav-uilab',
    newTab: true,
  },
  { to: '/dashboard' as const, icon: BarChart3, labelKey: 'nav.dashboard', track: 'nav-dashboard' },
]

const THEME_ICON: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const THEME_ORDER: Theme[] = ['light', 'dark', 'system']

export function AppSidebar() {
  const { t } = useTranslation()
  const { theme, setTheme, colorScale, setColorScale, language, setLanguage } = useAppStore()
  const { toggleSidebar } = useSidebar()

  const cycleTheme = () => {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]
    setTheme(next)
  }

  const toggleLang = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh')
  }

  const ThemeIcon = THEME_ICON[theme]

  return (
    <Sidebar collapsible="offcanvas">
      {/* ═══ Header: fluxp logo as toggle ═══ */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={toggleSidebar}>
              <img src="/favicon.svg" alt="" className="w-5 h-5 dark:invert shrink-0" />
              <span className="font-bold tracking-tight">{t('nav.brand')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* ═══ Navigation ═══ */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.navigation')}</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) =>
              'newTab' in item && item.newTab ? (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    data-track={item.track}
                    tooltip={t(item.labelKey)}
                    onClick={() => window.open('/ui-lab/schedule', 'ui-lab')}
                  >
                    <item.icon />
                    <span>{t(item.labelKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem key={item.to}>
                  <Link to={item.to} data-track={item.track}>
                    {({ isActive }) => (
                      <SidebarMenuButton isActive={isActive} tooltip={t(item.labelKey)}>
                        <item.icon />
                        <span>{t(item.labelKey)}</span>
                      </SidebarMenuButton>
                    )}
                  </Link>
                </SidebarMenuItem>
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* ═══ Color Scale Picker ═══ */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.colorScale')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="grid grid-cols-5 gap-2 px-2">
              {COLOR_SCALES.map((c) => (
                <button
                  key={c}
                  onClick={() => setColorScale(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                    colorScale === c
                      ? 'border-foreground scale-125 shadow-sm'
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-110'
                  }`}
                  style={{ backgroundColor: getThemeShade(c, 500) }}
                  title={c}
                />
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ═══ Footer: Theme + Language ═══ */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={cycleTheme}
              tooltip={t(`theme.${theme}`)}
              data-track="theme-toggle"
            >
              <ThemeIcon />
              <span>{t(`theme.${theme}`)}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleLang}
              tooltip={language === 'zh' ? 'English' : '中文'}
              data-track="lang-toggle"
            >
              <Languages />
              <span className="font-mono text-xs">{language === 'zh' ? 'En' : '中'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

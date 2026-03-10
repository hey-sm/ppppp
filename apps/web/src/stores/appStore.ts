import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import i18n from '@/i18n/i18n'
import type { ColorScale } from '@/lib/colors'

export type Theme = 'light' | 'dark' | 'system'
export type Language = 'zh' | 'en'

interface AppState {
  theme: Theme
  setTheme: (theme: Theme) => void

  colorScale: ColorScale
  setColorScale: (color: ColorScale) => void

  language: Language
  setLanguage: (lang: Language) => void

  /** 用户是否已关闭过侧边栏冒泡提示 */
  sidebarHintDismissed: boolean
  dismissSidebarHint: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      colorScale: 'blue',
      setColorScale: (colorScale) => set({ colorScale }),

      language: 'zh',
      setLanguage: (language) => {
        i18n.changeLanguage(language)
        set({ language })
      },

      sidebarHintDismissed: false,
      dismissSidebarHint: () => set({ sidebarHintDismissed: true }),
    }),
    {
      name: 'fluxp-app',
      onRehydrateStorage: () => (state) => {
        if (state?.language) {
          i18n.changeLanguage(state.language)
        }
      },
    },
  ),
)

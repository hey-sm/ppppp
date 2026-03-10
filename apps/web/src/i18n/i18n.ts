// ============================================================================
// i18n 配置：react-i18next 国际化
// ============================================================================
//
// 设计思路：
// 1. 使用 react-i18next 的 useTranslation hook 在组件中获取翻译
// 2. 默认语言为中文 (zh)
// 3. 翻译资源内联加载（小项目无需异步加载）
// 4. 页面主要用中文，技术名词（FPS、LCP、CLS 等）保留英文

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './zh.json'
import en from './en.json'

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: 'zh', // 默认中文
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false, // React 已自动转义
  },
})

export default i18n

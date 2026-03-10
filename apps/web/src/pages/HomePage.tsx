import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CardStack, type CardStackItem } from '@/components/ui/card-stack'
import { TextAnimate } from '@/components/ui/text-animate'
import { useAppStore } from '@/stores/appStore'
import { getThemeShade, SHADES_LIGHT, SHADES_DARK } from '@/lib/colors'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

interface ColorCardItem extends CardStackItem {
  colorScale: string
  shade: number
  darkShade: number
}

export function HomePage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const colorScale = useAppStore((s) => s.colorScale)

  const items = useMemo<ColorCardItem[]>(
    () =>
      SHADES_LIGHT.map((shade, i) => ({
        id: i + 1,
        title: `${colorScale}-${shade}`,
        description: getThemeShade(colorScale, shade),
        colorScale,
        shade,
        darkShade: SHADES_DARK[i],
      })),
    [colorScale],
  )

  return (
    <div className="min-h-screen">
      {/* ════════════ Hero 区域 ════════════ */}
      <section className="flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <motion.div
          className="text-center max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <TextAnimate
            as="h1"
            animation="blurInUp"
            by="word"
            once
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-3"
          >
            {t('home.heroTitle')}
          </TextAnimate>
          <WeatherWidget lang={lang} />
        </motion.div>
      </section>

      {/* ════════════ CardStack 色卡 ════════════ */}
      <section className="px-4 pb-20 max-w-6xl mx-auto">
        <CardStack
          items={items}
          initialIndex={0}
          autoAdvance
          intervalMs={4000}
          pauseOnHover
          showDots
          cardWidth={580}
          cardHeight={360}
          overlap={0.5}
          spreadDeg={40}
          depthPx={120}
          tiltXDeg={10}
          activeLiftPx={30}
          activeScale={1.02}
          inactiveScale={0.9}
          renderCard={(item, { active }) => (
            <ColorCard item={item as ColorCardItem} active={active} />
          )}
        />
      </section>
    </div>
  )
}

function ColorCard({ item, active }: { item: ColorCardItem; active: boolean }) {
  const idx = Number(item.id) - 1
  const lightHex = getThemeShade(item.colorScale, item.shade)
  const darkHex = getThemeShade(item.colorScale, item.darkShade)

  // 色阶 400+ 背景较深，需要亮色文字
  const needsLightText = idx >= 4

  return (
    <div
      style={{ '--bg-light': lightHex, '--bg-dark': darkHex } as React.CSSProperties}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] transition-colors duration-700"
    >
      <div
        className={`relative z-20 flex h-full flex-col justify-between p-6 sm:p-8 transition-opacity duration-500 ${
          !active ? 'opacity-30' : 'opacity-100'
        } ${needsLightText ? 'text-white' : 'text-foreground'}`}
      >
        {/* 编号 + 色阶名 */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${
              needsLightText ? 'bg-white/15' : 'bg-black/10'
            }`}
          >
            {ROMAN[idx]}
          </span>
          {active ? (
            <TextAnimate
              as="h2"
              animation="blurInUp"
              by="word"
              once={false}
              startOnView={false}
              className="text-lg sm:text-xl font-bold leading-snug flex-1"
            >
              {`${item.colorScale}-${item.shade}`}
            </TextAnimate>
          ) : (
            <h2 className="text-lg sm:text-xl font-bold leading-snug flex-1 truncate opacity-60">
              {`${item.colorScale}-${item.shade}`}
            </h2>
          )}
        </div>

        {/* 十六进制色号 */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {active ? (
            <TextAnimate
              as="p"
              animation="fadeIn"
              by="word"
              delay={0.2}
              duration={0.5}
              once={false}
              startOnView={false}
              className="font-mono text-3xl sm:text-4xl font-bold tracking-wider"
            >
              {lightHex.toUpperCase()}
            </TextAnimate>
          ) : (
            <p className="font-mono text-3xl sm:text-4xl font-bold tracking-wider opacity-60">
              {lightHex.toUpperCase()}
            </p>
          )}
          <p className="font-mono text-sm mt-2 opacity-60">dark: {darkHex.toUpperCase()}</p>
        </div>

        {/* 底部信息 */}
        <div
          className={`mt-3 pt-3 border-t ${needsLightText ? 'border-white/20' : 'border-black/10'} text-xs opacity-60 flex justify-between`}
        >
          <span>Light: {item.shade}</span>
          <span>Dark: {item.darkShade}</span>
        </div>
      </div>
    </div>
  )
}

/** 获取天气描述 */
function getWeatherDescription(code: number, lang: string) {
  const isZh = lang === 'zh'
  if (code === 0) return isZh ? '晴朗 ☀️' : 'Clear ☀️'
  if (code === 1 || code === 2 || code === 3) return isZh ? '多云 ⛅️' : 'Cloudy ⛅️'
  if (code >= 45 && code <= 48) return isZh ? '雾 🌫️' : 'Fog 🌫️'
  if (code >= 51 && code <= 55) return isZh ? '毛毛雨 🌧️' : 'Drizzle 🌧️'
  if (code >= 61 && code <= 65) return isZh ? '雨 🌧️' : 'Rain 🌧️'
  if (code >= 71 && code <= 77) return isZh ? '雪 ❄️' : 'Snow ❄️'
  if (code >= 80 && code <= 82) return isZh ? '阵雨 🌦️' : 'Showers 🌦️'
  if (code >= 95) return isZh ? '雷暴 ⛈️' : 'Thunderstorm ⛈️'
  return isZh ? '未知' : 'Unknown'
}

type WeatherDataType = { location: string; temp: number; code: number } | null

let globalWeatherPromise: Promise<WeatherDataType> | null = null

function prefetchWeather(): Promise<WeatherDataType> {
  if (globalWeatherPromise) return globalWeatherPromise

  globalWeatherPromise = (async () => {
    try {
      const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json')
      if (!ipRes.ok) throw new Error('IP fetch failed')
      const ipData = await ipRes.json()
      if (!ipData.latitude) throw new Error('Invalid IP data')

      const lat = ipData.latitude
      const lon = ipData.longitude
      const city = ipData.city || ipData.country || 'Unknown'

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
      )
      if (!weatherRes.ok) throw new Error('Weather fetch failed')
      const weatherData = await weatherRes.json()

      return {
        location: city,
        temp: Math.round(weatherData.current_weather.temperature),
        code: weatherData.current_weather.weathercode,
      }
    } catch (e) {
      console.error('Prefetch weather error:', e)
      return null
    }
  })()

  return globalWeatherPromise
}

prefetchWeather()

function WeatherWidget({ lang }: { lang: string }) {
  const [data, setData] = useState<{ location: string; temp: number; text: string } | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    let active = true

    async function loadData() {
      const result = await prefetchWeather()
      if (!active) return

      if (result) {
        setData({
          location: result.location,
          temp: result.temp,
          text: getWeatherDescription(result.code, lang),
        })
        setStatus('success')
      } else {
        setStatus('error')
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [lang])

  if (status === 'loading') {
    return (
      <div className="flex justify-center mb-2 h-7 py-1">
        <div className="w-48 h-full bg-muted/30 rounded-md animate-pulse" />
      </div>
    )
  }

  if (status === 'error' || !data) {
    const fallbackText = 'For the ultimate, to the extraordinary.'
    return (
      <TextAnimate
        key="fallback-weather"
        as="p"
        animation="fadeIn"
        by="word"
        once
        className="text-muted-foreground text-lg mb-2"
      >
        {fallbackText}
      </TextAnimate>
    )
  }

  const textToAnimate = `${data.location} · ${data.text} · ${data.temp}°C`

  return (
    <TextAnimate
      key={textToAnimate}
      as="p"
      animation="fadeIn"
      by="word"
      once
      className="text-muted-foreground text-lg mb-2"
    >
      {textToAnimate}
    </TextAnimate>
  )
}

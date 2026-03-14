import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { TextAnimate } from "@/components/ui/text-animate"

type WeatherData = {
  location: string
  temp: number
  code: number
}

const WEATHER_MAP_ZH: Record<string, string> = {
  "0": "晴朗 ☀️",
  "1": "多云 ⛅️",
  "2": "多云 ⛅️",
  "3": "多云 ⛅️",
}

const WEATHER_MAP_EN: Record<string, string> = {
  "0": "Clear ☀️",
  "1": "Cloudy ⛅️",
  "2": "Cloudy ⛅️",
  "3": "Cloudy ⛅️",
}

function getWeatherDescription(code: number, lang: string) {
  const isZh = lang === "zh"
  const map = isZh ? WEATHER_MAP_ZH : WEATHER_MAP_EN
  const exact = map[String(code)]
  if (exact) return exact

  if (code >= 45 && code <= 48) return isZh ? "雾 🌫️" : "Fog 🌫️"
  if (code >= 51 && code <= 55) return isZh ? "毛毛雨 🌧️" : "Drizzle 🌧️"
  if (code >= 61 && code <= 65) return isZh ? "雨 🌧️" : "Rain 🌧️"
  if (code >= 71 && code <= 77) return isZh ? "雪 ❄️" : "Snow ❄️"
  if (code >= 80 && code <= 82) return isZh ? "阵雨 🌦️" : "Showers 🌦️"
  if (code >= 95) return isZh ? "雷暴 ⛈️" : "Thunderstorm ⛈️"
  return isZh ? "未知" : "Unknown"
}

async function fetchWeather(): Promise<WeatherData> {
  const ipRes = await fetch("https://get.geojs.io/v1/ip/geo.json")
  if (!ipRes.ok) throw new Error("IP fetch failed")
  const ipData = await ipRes.json()
  if (!ipData.latitude) throw new Error("Invalid IP data")

  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${ipData.latitude}&longitude=${ipData.longitude}&current_weather=true`,
  )
  if (!weatherRes.ok) throw new Error("Weather fetch failed")
  const weatherData = await weatherRes.json()

  return {
    location: ipData.city || ipData.country || "Unknown",
    temp: Math.round(weatherData.current_weather.temperature),
    code: weatherData.current_weather.weathercode,
  }
}

export function WeatherWidget() {
  const { i18n } = useTranslation()
  const lang = i18n.language

  const { data, isLoading, isError } = useQuery({
    queryKey: ["weather"],
    queryFn: fetchWeather,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center mb-2 h-7 py-1">
        <div className="h-full w-48 animate-pulse rounded-md bg-muted/30" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <TextAnimate
        key="fallback-weather"
        as="p"
        animation="fadeIn"
        by="word"
        once
        className="mb-2 text-lg text-muted-foreground"
      >
        For the ultimate, to the extraordinary.
      </TextAnimate>
    )
  }

  const text = `${data.location} · ${getWeatherDescription(data.code, lang)} · ${data.temp}°C`

  return (
    <TextAnimate
      key={text}
      as="p"
      animation="fadeIn"
      by="word"
      once
      className="mb-2 text-lg text-muted-foreground"
    >
      {text}
    </TextAnimate>
  )
}

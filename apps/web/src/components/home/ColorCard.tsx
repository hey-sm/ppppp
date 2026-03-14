import type { CardStackItem } from "@/components/ui/card-stack"
import { TextAnimate } from "@/components/ui/text-animate"
import { getThemeShade } from "@/lib/colors"

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"]

export interface ColorCardItem extends CardStackItem {
  colorScale: string
  shade: number
  darkShade: number
}

export function ColorCard({
  item,
  active,
}: {
  item: ColorCardItem
  active: boolean
}) {
  const idx = Number(item.id) - 1
  const lightHex = getThemeShade(item.colorScale, item.shade)
  const darkHex = getThemeShade(item.colorScale, item.darkShade)

  const needsLightText = idx >= 4

  return (
    <div
      style={
        { "--bg-light": lightHex, "--bg-dark": darkHex } as React.CSSProperties
      }
      className="relative h-full w-full overflow-hidden rounded-2xl bg-[var(--bg-light)] transition-colors duration-700 dark:bg-[var(--bg-dark)]"
    >
      <div
        className={`relative z-20 flex h-full flex-col justify-between p-6 sm:p-8 transition-opacity duration-500 ${
          !active ? "opacity-30" : "opacity-100"
        } ${needsLightText ? "text-white" : "text-foreground"}`}
      >
        <div className="mb-3 flex items-center gap-3">
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
              needsLightText ? "bg-white/15" : "bg-black/10"
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
              className="flex-1 text-lg font-bold leading-snug sm:text-xl"
            >
              {`${item.colorScale}-${item.shade}`}
            </TextAnimate>
          ) : (
            <h2 className="flex-1 truncate text-lg font-bold leading-snug opacity-60 sm:text-xl">
              {`${item.colorScale}-${item.shade}`}
            </h2>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          {active ? (
            <TextAnimate
              as="p"
              animation="fadeIn"
              by="word"
              delay={0.2}
              duration={0.5}
              once={false}
              startOnView={false}
              className="font-mono text-3xl font-bold tracking-wider sm:text-4xl"
            >
              {lightHex.toUpperCase()}
            </TextAnimate>
          ) : (
            <p className="font-mono text-3xl font-bold tracking-wider opacity-60 sm:text-4xl">
              {lightHex.toUpperCase()}
            </p>
          )}
          <p className="mt-2 font-mono text-sm opacity-60">
            dark: {darkHex.toUpperCase()}
          </p>
        </div>

        <div
          className={`mt-3 flex justify-between border-t pt-3 text-xs opacity-60 ${needsLightText ? "border-white/20" : "border-black/10"}`}
        >
          <span>Light: {item.shade}</span>
          <span>Dark: {item.darkShade}</span>
        </div>
      </div>
    </div>
  )
}

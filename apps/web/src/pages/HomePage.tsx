import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CardStack } from "@/components/ui/card-stack";
import { PixelHeading } from "@/components/cult-ui/pixel-heading-character";
import { WeatherWidget } from "@/components/home/WeatherWidget";
import { ColorCard, type ColorCardItem } from "@/components/home/ColorCard";
import { useAppStore } from "@/stores/appStore";
import { getThemeShade, SHADES_LIGHT, SHADES_DARK } from "@/lib/colors";

export function HomePage() {
  const { t } = useTranslation();
  const colorScale = useAppStore((s) => s.colorScale);

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
  );

  return (
    <div>
      <section className="flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <motion.div
          className="text-center max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <PixelHeading className="text-6xl mb-2" autoPlay cycleInterval={1000}>
            {t("home.heroTitle")}
          </PixelHeading>
          <WeatherWidget />
        </motion.div>
      </section>

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
  );
}

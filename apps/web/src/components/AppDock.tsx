import { useEffect, useState } from "react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Bookmark,
  FlaskConical,
  House,
  Languages,
  Monitor,
  Moon,
  Settings2,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { FloatingDock, type FloatingDockItem } from "@/components/magicui/dock";
import { MorphSurface } from "@/components/cult-ui/morph-surface";
import { cn } from "@/lib/utils";
import { COLOR_SCALES, getThemeShade } from "@/lib/colors";
import { useAppStore, type Theme } from "@/stores/appStore";
import { useTranslation } from "react-i18next";

type NavItem = {
  id: string;
  label: string;
  to: "/" | "/dashboard" | "/links" | "/ui-lab/schedule";
  matchTo: "/" | "/dashboard" | "/links" | "/ui-lab";
  fuzzy: boolean;
  icon: LucideIcon;
  onClick?: () => void;
  active?: boolean;
  hideLabel?: boolean;
};

const THEME_OPTIONS: Array<{ value: Theme; label: string; icon: LucideIcon }> =
  [
    { value: "light", label: "浅色", icon: Sun },
    { value: "dark", label: "深色", icon: Moon },
    { value: "system", label: "系统", icon: Monitor },
  ];

export function AppDock() {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(360);
  const [panelHeight, setPanelHeight] = useState(320);
  const { theme, setTheme, colorScale, setColorScale, language, setLanguage } =
    useAppStore();

  useEffect(() => {
    const updatePanelSize = () => {
      const width = Math.min(window.innerWidth * 0.92, 448);
      const height = Math.min(window.innerHeight * 0.6, 360);
      setPanelWidth(Math.round(width));
      setPanelHeight(Math.round(height));
    };

    updatePanelSize();
    window.addEventListener("resize", updatePanelSize);
    return () => window.removeEventListener("resize", updatePanelSize);
  }, []);

  const navItems: NavItem[] = [
    {
      id: "home",
      label: t("nav.home"),
      to: "/",
      matchTo: "/",
      fuzzy: false,
      icon: House,
      active: Boolean(matchRoute({ to: "/", fuzzy: false })),
    },
    {
      id: "ui-lab",
      label: t("nav.uiLab"),
      to: "/ui-lab/schedule",
      matchTo: "/ui-lab",
      fuzzy: true,
      icon: FlaskConical,
      active: Boolean(matchRoute({ to: "/ui-lab", fuzzy: true })),
    },
    {
      id: "dashboard",
      label: t("nav.dashboard"),
      to: "/dashboard",
      matchTo: "/dashboard",
      fuzzy: false,
      icon: BarChart3,
      active: Boolean(matchRoute({ to: "/dashboard", fuzzy: false })),
    },
    {
      id: "links",
      label: t("nav.links"),
      to: "/links",
      matchTo: "/links",
      fuzzy: false,
      icon: Bookmark,
      active: Boolean(matchRoute({ to: "/links", fuzzy: false })),
    },
    {
      id: "settings",
      label: t("nav.settings", "设置"),
      to: "/",
      matchTo: "/",
      fuzzy: false,
      icon: Settings2,
      active: settingsOpen,
      onClick: () => setSettingsOpen((prev) => !prev),
      hideLabel: true,
    },
  ];

  const items: FloatingDockItem[] = navItems.map((item) => {
    const Icon = item.icon;
    return {
      id: item.id,
      label: item.label,
      active: item.active,
      hideLabel: item.hideLabel,
      icon: <Icon className="size-5" />,
      render: ({ className, children }) =>
        item.onClick ? (
          <button
            type="button"
            aria-label={item.label}
            onClick={item.onClick}
            className={className}
            data-active={item.active ? "true" : "false"}
          >
            {children}
          </button>
        ) : (
          <Link
            to={item.to}
            aria-label={item.label}
            className={className}
            data-active={item.active ? "true" : "false"}
          >
            {children}
          </Link>
        ),
    };
  });

  const panelContent = (
    <div className="flex h-full flex-col overflow-auto rounded-2xl border border-border/60 bg-background p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
      <div className="mt-4 grid gap-4">
        <div className="grid gap-2">
          <div className="text-[11px] tracking-[0.2em] text-muted-foreground">
            主题
          </div>
          <div className="flex flex-wrap gap-2">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
                    theme === option.value
                      ? "border-foreground/20 bg-foreground/8 text-foreground"
                      : "border-border/70 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2">
          <div className="text-[11px] tracking-[0.2em] text-muted-foreground">
            语言
          </div>
          <button
            type="button"
            onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
          >
            <Languages className="size-3.5" />
            {language === "zh" ? "简体中文" : "English"}
          </button>
        </div>

        <div className="grid gap-2">
          <div className="text-[11px] tracking-[0.2em] text-muted-foreground">
            色阶
          </div>
          <div className="flex flex-wrap gap-2">
            {COLOR_SCALES.map((scale) => (
              <button
                key={scale}
                type="button"
                onClick={() => setColorScale(scale)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 transition-all",
                  colorScale === scale
                    ? "border-foreground/50"
                    : "border-transparent opacity-75 hover:opacity-100",
                )}
                aria-label={scale}
                title={scale}
              >
                <span
                  className="block size-4.5 rounded-full"
                  style={{ backgroundColor: getThemeShade(scale, 500) }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const panel = (
    <MorphSurface
      isOpen={settingsOpen}
      onOpenChange={setSettingsOpen}
      onClose={() => setSettingsOpen(false)}
      expandedWidth={panelWidth}
      expandedHeight={panelHeight}
      collapsedWidth={44}
      collapsedHeight={44}
      surfaceLabel="设置"
      triggerLabel="设置"
      animationSpeed={5}
      placeholder="请输入内容…"
      submitLabel="提交"
      showDock={false}
      className="items-end justify-center"
      surfaceClassName="bg-transparent shadow-none dark:bg-transparent"
      contentClassName="h-full w-full"
      renderContent={() => <div className="h-full w-full">{panelContent}</div>}
    />
  );

  return (
    <FloatingDock
      items={items}
      panel={panel}
      panelOpen={settingsOpen}
      onClosePanel={() => setSettingsOpen(false)}
      keepVisible={settingsOpen}
      dockClassName="rounded-[1.35rem]"
    />
  );
}

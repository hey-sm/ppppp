// ============================================================================
// 性能监控大盘页面 (Performance Dashboard)
// ============================================================================
//
// 改造要点：
// 1. 指标卡片 → shadcn <Card>
// 2. Toggle → shadcn <Switch>
// 3. 所有文本使用 i18n t()
// 4. 去除旧 inline styles，使用 Tailwind + shadcn CSS 变量

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { usePerfStore } from "../stores/perfStore";
import { MTree } from "@fluxp/ui";
import type { ChinaDivisionMinItem } from "@fluxp/ui/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

/** FPS 计数器 hook：用 rAF 实时计算当前帧率 */
function useFPSCounter() {
  const [fps, setFps] = useState(0);
  const frameRef = useRef<number>(0);
  const lastRef = useRef<number>(performance.now());
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    function tick(now: number) {
      frameRef.current++;
      const delta = now - lastRef.current;
      if (delta >= 1000) {
        setFps(Math.round((frameRef.current / delta) * 1000));
        frameRef.current = 0;
        lastRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return fps;
}

/**
 * 单个 Web Vital 指标卡片
 */
function MetricCard({
  name,
  value,
  unit,
  rating,
  ratingLabel,
}: {
  name: string;
  value: number | string;
  unit?: string;
  rating?: "good" | "needs-improvement" | "poor";
  ratingLabel?: string;
}) {
  const colorClass =
    rating === "good"
      ? "metric-good"
      : rating === "poor"
        ? "metric-poor"
        : "metric-warn";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
    >
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            {name}
          </div>
          <div className={`metric-value ${colorClass}`}>
            {value}
            {unit && <span className="text-base font-normal">{unit}</span>}
          </div>
          {rating && ratingLabel && (
            <div className="text-xs mt-1 text-muted-foreground">
              {rating === "good" ? "✓" : rating === "poor" ? "✗" : "△"}{" "}
              {ratingLabel}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { metrics } = usePerfStore();
  const [useVirtual, setUseVirtual] = useState(true);
  const [divisionData, setDivisionData] = useState<
    ChinaDivisionMinItem[] | null
  >(null);
  const [divisionError, setDivisionError] = useState<string | null>(null);
  const liveFps = useFPSCounter();

  useEffect(() => {
    let active = true;
    setDivisionError(null);
    setDivisionData(null);

    import("province-city-china/dist/data.min.json")
      .then((module) => {
        if (!active) return;
        setDivisionData(module.default as ChinaDivisionMinItem[]);
      })
      .catch(() => {
        if (!active) return;
        setDivisionError(
          i18n.language === "zh" ? "数据加载失败" : "Data load failed",
        );
      });

    return () => {
      active = false;
    };
  }, [i18n.language]);

  const counts = useMemo(() => {
    if (!divisionData) return null;
    let provinces = 0;
    let cities = 0;
    let areas = 0;
    let towns = 0;
    for (const it of divisionData as any[]) {
      const y = (it as any).y;
      const a = (it as any).a;
      const t = (it as any).t;
      const isZero = (v: any) => v === 0 || v === "0";
      if (!isZero(t)) towns++;
      else if (!isZero(a)) areas++;
      else if (!isZero(y)) cities++;
      else provinces++;
    }
    return { provinces, cities, areas, towns };
  }, [divisionData]);

  // Web Vitals 数据
  const vitals = metrics.vitals;

  /** 根据 rating 获取翻译后的文本 */
  const ratingText = (rating?: "good" | "needs-improvement" | "poor") => {
    if (!rating) return "";
    if (rating === "good") return t("dashboard.good");
    if (rating === "poor") return t("dashboard.poor");
    return t("dashboard.needsImprovement");
  };

  const loadingText =
    i18n.language === "zh" ? "数据加载中..." : "Loading data...";
  const loadFailedText = divisionError ?? loadingText;
  const countsLabel = counts
    ? i18n.language === "zh"
      ? `省 ${counts.provinces} / 市 ${counts.cities} / 区 ${counts.areas} / 街道 ${counts.towns}`
      : `Provinces ${counts.provinces} / Cities ${counts.cities} / Areas ${counts.areas} / Towns ${counts.towns}`
    : loadFailedText;

  return (
    <div className="max-w-[1040px] mx-auto px-6 py-9">
      <motion.h1
        className="text-3xl font-bold mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        📊 {t("dashboard.title")}
      </motion.h1>
      <motion.p
        className="text-muted-foreground mb-7"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {t("dashboard.subtitle")}{" "}
        <code className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-mono text-sm">
          @fluxp/perf-monitor
        </code>
      </motion.p>

      {/* ════════════ Web Vitals 指标卡片 ════════════ */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 mb-7">
        <MetricCard
          name="FCP"
          value={vitals.FCP?.value ?? "—"}
          unit={vitals.FCP ? "ms" : ""}
          rating={vitals.FCP?.rating}
          ratingLabel={ratingText(vitals.FCP?.rating)}
        />
        <MetricCard
          name="LCP"
          value={vitals.LCP?.value ?? "—"}
          unit={vitals.LCP ? "ms" : ""}
          rating={vitals.LCP?.rating}
          ratingLabel={ratingText(vitals.LCP?.rating)}
        />
        <MetricCard
          name="CLS"
          value={vitals.CLS?.value ?? "—"}
          rating={vitals.CLS?.rating}
          ratingLabel={ratingText(vitals.CLS?.rating)}
        />
        <MetricCard
          name="TTFB"
          value={vitals.TTFB?.value ?? "—"}
          unit={vitals.TTFB ? "ms" : ""}
          rating={vitals.TTFB?.rating}
          ratingLabel={ratingText(vitals.TTFB?.rating)}
        />
        <MetricCard
          name="FPS"
          value={liveFps}
          rating={
            liveFps >= 55
              ? "good"
              : liveFps >= 30
                ? "needs-improvement"
                : "poor"
          }
          ratingLabel={ratingText(
            liveFps >= 55
              ? "good"
              : liveFps >= 30
                ? "needs-improvement"
                : "poor",
          )}
        />
      </div>

      {/* ════════════ 内存使用 ════════════ */}
      {metrics.memory && (
        <Card className="mb-7">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t("dashboard.memoryTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-8 flex-wrap">
              <div>
                <div className="text-xs text-muted-foreground">
                  {t("dashboard.usedHeap")}
                </div>
                <div className="text-xl font-semibold font-mono text-foreground">
                  {metrics.memory.usedJSHeapSize} MB
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  {t("dashboard.totalHeap")}
                </div>
                <div className="text-xl font-semibold font-mono text-muted-foreground">
                  {metrics.memory.totalJSHeapSize} MB
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  {t("dashboard.heapLimit")}
                </div>
                <div className="text-xl font-semibold font-mono text-muted-foreground">
                  {metrics.memory.jsHeapSizeLimit} MB
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/*  Demo */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">
              {t("dashboard.renderBattle")}
              <br />
              {countsLabel}
            </CardTitle>
            <div className="flex items-center">
              <span
                className={`text-sm ${!useVirtual ? "text-foreground font-medium" : "text-muted-foreground"}`}
              >
                {t("dashboard.normal")}
              </span>
              <Switch
                checked={useVirtual}
                onCheckedChange={setUseVirtual}
                data-track="dashboard-toggle-virtual"
              />
              <span
                className={`text-sm ${useVirtual ? "text-foreground font-medium" : "text-muted-foreground"}`}
              >
                {t("dashboard.virtual")}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Badge
              variant={liveFps >= 50 ? "secondary" : "destructive"}
              className="font-mono"
            >
              FPS: {liveFps}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Mode:{" "}
              {useVirtual
                ? ` ${t("dashboard.modeVirtual")}`
                : ` ${t("dashboard.modeNormal")}`}
            </span>
          </div>

          {/* ???? */}
          {divisionData ? (
            <MTree
              data={divisionData}
              renderMode={useVirtual ? "virtual" : "normal"}
              showModeToggle={false}
              height={400}
              expandAllOnNormal
            />
          ) : (
            <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
              {loadFailedText}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════════════ Long Tasks ════════════ */}
      {metrics.longTasks.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              ⚠️ {t("dashboard.longTasks")} ({metrics.longTasks.length}{" "}
              {t("dashboard.detected")})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {metrics.longTasks.slice(-20).map((task, i) => (
                <Badge
                  key={i}
                  variant={task.duration > 100 ? "destructive" : "secondary"}
                  className="font-mono"
                >
                  {task.duration}ms
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

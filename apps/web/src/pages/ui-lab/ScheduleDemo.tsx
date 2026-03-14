// ============================================================================
// MSchedule 排期组件 Demo — /ui-lab/schedule
// ============================================================================

import { useTranslation } from "react-i18next";
import { MSchedule } from "@fluxp/ui";
import type { MScheduleValue } from "@fluxp/ui/types";
import { Badge } from "@/components/ui/badge";
import { useSessionStorageState } from "@/lib/useSessionStorageState";

export function ScheduleDemo() {
  const { t } = useTranslation();
  const [storedValue, setStoredValue] = useSessionStorageState<
    MScheduleValue | null
  >("ui-lab:schedule", null);
  const value = storedValue ?? undefined;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t("uiLab.schedule.name")}</h2>
        <p className="text-muted-foreground mt-1">
          {t("uiLab.schedule.description")}
        </p>
        <div className="flex gap-2 flex-wrap mt-3">
          <Badge variant="secondary">{t("uiLab.tags.adSchedule")}</Badge>
          <Badge variant="secondary">{t("uiLab.tags.dragSelect")}</Badge>
          <Badge variant="secondary">{t("uiLab.tags.weeklyGrid")}</Badge>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {t("uiLab.schedule.demoHint")}
      </p>

      <MSchedule
        value={value}
        onChange={(next) => setStoredValue(next ?? null)}
      />
    </div>
  );
}

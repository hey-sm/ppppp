import { useCallback, useEffect, useRef, useState } from "react";

export type MScheduleValue = boolean[][];

export interface MScheduleProps {
  value?: MScheduleValue;
  defaultValue?: MScheduleValue;
  onChange?: (value: MScheduleValue) => void;
  disabled?: boolean;
  className?: string;
}

const DAYS = [
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
  "星期日",
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const rootStyles =
  "rounded-[var(--radius)] border border-border bg-card p-4 text-foreground select-none [box-shadow:var(--surface-shadow)]";

const legendStyles =
  "mb-3 flex items-center gap-4 text-[0.8rem] text-foreground";
const legendItemStyles = "flex items-center gap-[0.35rem]";
const legendDotBase = "inline-block h-1 w-5 rounded-sm";
const clearButtonStyles =
  "ml-auto rounded-[calc(var(--radius)-0.125rem)] border border-border bg-card px-2.5 py-[0.15rem] text-[0.75rem] text-muted-foreground transition-[background-color,color,border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground";

const headerCellStyles = "bg-muted text-foreground font-semibold";
const hourCellStyles =
  "bg-muted px-0 py-[0.3rem] text-[0.7rem] font-medium text-muted-foreground";
const dayCellStyles =
  "bg-muted px-1 text-[0.75rem] font-medium whitespace-nowrap text-foreground";
const emptyCellStyles =
  "h-6 cursor-pointer bg-[color-mix(in_srgb,var(--card)_92%,var(--background))] transition-[background-color,box-shadow,opacity] duration-100 ease-out hover:[box-shadow:inset_0_0_0_1.5px_var(--selection)]";
const selectedCellStyles =
  "h-6 cursor-pointer bg-[var(--selection)] transition-[background-color,box-shadow,opacity] duration-100 ease-out hover:[box-shadow:inset_0_0_0_1.5px_var(--selection)]";

function createEmptyGrid(): MScheduleValue {
  return Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => false),
  );
}

function cloneGrid(grid: MScheduleValue): MScheduleValue {
  return grid.map((row) => [...row]);
}

function getRange(a: number, b: number): [number, number] {
  return a <= b ? [a, b] : [b, a];
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function hourToTimeLabel(hour: number) {
  // allow end=24 -> "24:00"
  return `${pad2(hour)}:00`;
}

function getSelectedRanges(row: boolean[]) {
  const ranges: Array<[number, number]> = [];
  let start: number | null = null;

  for (let h = 0; h < row.length; h++) {
    if (row[h]) {
      if (start === null) start = h;
    } else if (start !== null) {
      ranges.push([start, h]);
      start = null;
    }
  }

  if (start !== null) ranges.push([start, row.length]);
  return ranges;
}

export function MSchedule({
  value,
  defaultValue,
  onChange,
  disabled = false,
  className,
}: MScheduleProps) {
  const [internal, setInternal] = useState<MScheduleValue>(
    () => defaultValue ?? createEmptyGrid(),
  );
  const grid = value ?? internal;

  const commit = useCallback(
    (next: MScheduleValue) => {
      if (!value) setInternal(next);
      onChange?.(next);
    },
    [value, onChange],
  );

  // drag state：使用 ref 避免鼠标拖动时频繁触发重渲染
  const dragging = useRef(false);
  const startCell = useRef<[number, number]>([0, 0]);
  const endCell = useRef<[number, number]>([0, 0]);
  const selecting = useRef(true);
  const [preview, setPreview] = useState<{
    minDay: number;
    maxDay: number;
    minHour: number;
    maxHour: number;
  } | null>(null);

  const tableRef = useRef<HTMLTableElement>(null);

  const onCellMouseDown = useCallback(
    (day: number, hour: number) => {
      if (disabled) return;
      dragging.current = true;
      startCell.current = [day, hour];
      endCell.current = [day, hour];
      selecting.current = !grid[day][hour];
      setPreview({ minDay: day, maxDay: day, minHour: hour, maxHour: hour });
    },
    [disabled, grid],
  );

  const onCellMouseEnter = useCallback((day: number, hour: number) => {
    if (!dragging.current) return;
    endCell.current = [day, hour];
    const [minDay, maxDay] = getRange(startCell.current[0], day);
    const [minHour, maxHour] = getRange(startCell.current[1], hour);
    setPreview({ minDay, maxDay, minHour, maxHour });
  }, []);

  const finishDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    const [minDay, maxDay] = getRange(startCell.current[0], endCell.current[0]);
    const [minHour, maxHour] = getRange(
      startCell.current[1],
      endCell.current[1],
    );
    const next = cloneGrid(grid);
    for (let d = minDay; d <= maxDay; d++) {
      for (let h = minHour; h <= maxHour; h++) {
        next[d][h] = selecting.current;
      }
    }
    commit(next);
    setPreview(null);
  }, [grid, commit]);

  useEffect(() => {
    const handleUp = () => finishDrag();
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, [finishDrag]);

  const isInPreview = (day: number, hour: number) =>
    preview !== null &&
    day >= preview.minDay &&
    day <= preview.maxDay &&
    hour >= preview.minHour &&
    hour <= preview.maxHour;

  const cellClass = (day: number, hour: number) => {
    const inPreview = isInPreview(day, hour);
    const willBeSelected = inPreview ? selecting.current : grid[day][hour];

    return [
      willBeSelected ? selectedCellStyles : emptyCellStyles,
      inPreview ? "opacity-75" : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  const hasSelected = grid.some((row) => row.some(Boolean));

  const clearAll = useCallback(() => {
    if (disabled) return;
    commit(createEmptyGrid());
  }, [disabled, commit]);

  const selectedSummary = DAYS.map((label, dayIdx) => {
    const ranges = getSelectedRanges(grid[dayIdx])
      .filter(([start, end]) => end > start)
      .map(([start, end]) => {
        const startLabel = hourToTimeLabel(start);
        const endLabel = hourToTimeLabel(end);
        return `${startLabel}-${endLabel}`;
      });

    return { label, ranges };
  }).filter((item) => item.ranges.length > 0);

  const rootCls = [
    rootStyles,
    disabled ? "pointer-events-none opacity-50" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootCls}>
      {/* 图例 */}
      <div className={legendStyles}>
        <span className={legendItemStyles}>
          <span
            className={[legendDotBase, "bg-[var(--selection)]"].join(" ")}
          />
          {"已选"}
        </span>
        <span className={legendItemStyles}>
          <span className={[legendDotBase, "bg-border"].join(" ")} />
          {"未选"}
        </span>
      </div>

      {/* 表格 */}
      <table
        ref={tableRef}
        className="w-full table-fixed border-collapse text-[0.75rem]"
        onDragStart={(e) => e.preventDefault()}
      >
        <thead>
          <tr>
            <th
              className={`w-[70px] min-w-[70px] text-[0.7rem] ${headerCellStyles}`}
              rowSpan={2}
            >
              {"星期/时间"}
            </th>
            <th className={`py-[0.35rem] ${headerCellStyles}`} colSpan={12}>
              00:00 - 12:00
            </th>
            <th className={`py-[0.35rem] ${headerCellStyles}`} colSpan={12}>
              12:00 - 24:00
            </th>
          </tr>
          <tr>
            {HOURS.map((h) => (
              <th key={h} className={`border border-border ${hourCellStyles}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((label, dayIdx) => (
            <tr key={dayIdx}>
              <td className={`border border-border ${dayCellStyles}`}>
                {label}
              </td>
              {HOURS.map((h) => (
                <td
                  key={h}
                  className={`border border-border ${cellClass(dayIdx, h)}`}
                  onMouseDown={() => onCellMouseDown(dayIdx, h)}
                  onMouseEnter={() => onCellMouseEnter(dayIdx, h)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 底部提示 */}
      <div className="mt-3 text-center text-[0.8rem] text-muted-foreground">
        {"可拖动鼠标选择时间段"}
      </div>

      {/* 已选择时间段 */}
      <div className="mt-6 rounded-[calc(var(--radius)-0.125rem)] border border-border bg-[color-mix(in_srgb,var(--card)_88%,var(--background))] p-4">
        <div className="flex items-center gap-3">
          <div className="text-[0.85rem] font-semibold text-foreground">
            {"已选择时间段"}
          </div>
          {hasSelected && !disabled && (
            <button
              type="button"
              className={clearButtonStyles}
              onClick={clearAll}
            >
              {"清空"}
            </button>
          )}
        </div>

        {selectedSummary.length === 0 ? (
          <div className="mt-3 text-[0.8rem] text-muted-foreground">
            {"暂无选择"}
          </div>
        ) : (
          <div className="mt-4 space-y-2 text-[0.85rem]">
            {selectedSummary.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {item.label}
                </span>
                <span className="text-foreground">
                  {item.ranges.join("、 ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

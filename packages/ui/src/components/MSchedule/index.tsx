import { useCallback, useEffect, useRef, useState } from "react";
import "./index.css";

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

  // --- drag state (refs to avoid re-render per mousemove) ---
  const dragging = useRef(false);
  const startCell = useRef<[number, number]>([0, 0]);
  const endCell = useRef<[number, number]>([0, 0]);
  const selecting = useRef(true); // true = paint selected; false = paint unselected
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
    const inPrev = isInPreview(day, hour);
    const willBeSelected = inPrev ? selecting.current : grid[day][hour];
    const base = "fluxp-schedule-cell";
    const state = willBeSelected ? `${base}--selected` : `${base}--empty`;
    const prev = inPrev ? `${base}--preview` : "";
    return `${base} ${state} ${prev}`.trim();
  };

  const hasSelected = grid.some((row) => row.some(Boolean));

  const clearAll = useCallback(() => {
    if (disabled) return;
    commit(createEmptyGrid());
  }, [disabled, commit]);

  const rootCls = [
    "fluxp-schedule",
    disabled && "fluxp-schedule--disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootCls}>
      {/* 图例 + 清空按钮 */}
      <div className="fluxp-schedule-legend">
        <span className="fluxp-schedule-legend-item">
          <span className="fluxp-schedule-legend-dot fluxp-schedule-legend-dot--selected" />
          已选
        </span>
        <span className="fluxp-schedule-legend-item">
          <span className="fluxp-schedule-legend-dot fluxp-schedule-legend-dot--empty" />
          未选
        </span>
        {hasSelected && !disabled && (
          <button
            type="button"
            className="fluxp-schedule-clear"
            onClick={clearAll}
          >
            清空
          </button>
        )}
      </div>

      {/* 表格 */}
      <table
        ref={tableRef}
        className="fluxp-schedule-table"
        onDragStart={(e) => e.preventDefault()}
      >
        <thead>
          <tr>
            <th className="fluxp-schedule-corner" rowSpan={2}>
              星期/时间
            </th>
            <th className="fluxp-schedule-period" colSpan={12}>
              00:00 - 12:00
            </th>
            <th className="fluxp-schedule-period" colSpan={12}>
              12:00 - 24:00
            </th>
          </tr>
          <tr>
            {HOURS.map((h) => (
              <th key={h} className="fluxp-schedule-hour">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((label, dayIdx) => (
            <tr key={dayIdx}>
              <td className="fluxp-schedule-day">{label}</td>
              {HOURS.map((h) => (
                <td
                  key={h}
                  className={cellClass(dayIdx, h)}
                  onMouseDown={() => onCellMouseDown(dayIdx, h)}
                  onMouseEnter={() => onCellMouseEnter(dayIdx, h)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 底部提示 */}
      <div className="fluxp-schedule-footer">可拖动鼠标选择时间段</div>
    </div>
  );
}

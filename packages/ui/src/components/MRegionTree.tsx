import { useCallback, useEffect, useMemo, useState } from "react";

export type MRegionTreeValue = Array<{
  code: string;
  name: string;
  /**
   * 省份本身被选中（勾选省 checkbox）时为 true。
   * 当 checked 为 true 且未提供 children 时，组件会按“选中全省”处理。
   */
  checked?: true;
  children?: Array<{ code: string; name: string }>;
}>;

export type MRegionTreeData = Array<{
  code: string;
  name: string;
  children?: Array<{ code: string; name: string }>;
}>;

export interface MRegionTreeProps {
  data: MRegionTreeData;
  value?: MRegionTreeValue;
  defaultValue?: MRegionTreeValue;
  onChange?: (value: MRegionTreeValue) => void;
  disabled?: boolean;
  className?: string;
}

type RegionCityNode = { code: string; name: string };
type RegionProvinceNode = {
  code: string;
  name: string;
  children: RegionCityNode[];
};

const rootStyles =
  "rounded-[var(--radius)] border border-border bg-card p-4 text-foreground select-none [box-shadow:var(--surface-shadow)]";

const paneStyles =
  "rounded-[calc(var(--radius)-0.125rem)] border border-border bg-[color-mix(in_srgb,var(--card)_92%,var(--background))]";

const listStyles = "max-h-[420px] overflow-auto";

const rowBaseStyles =
  "flex w-full items-center gap-2 px-3 py-2 text-[0.9rem] transition-colors";

const rowHoverStyles =
  "hover:bg-[color-mix(in_srgb,var(--muted)_65%,var(--card))]";

const checkboxStyles =
  "size-4 rounded-[0.25rem] border border-border bg-card [accent-color:var(--selection)] disabled:opacity-50";

const clearButtonStyles =
  "ml-auto rounded-[calc(var(--radius)-0.125rem)] border border-border bg-card px-2.5 py-[0.15rem] text-[0.75rem] text-muted-foreground transition-[background-color,color,border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground";

function Chevron({
  direction,
  className,
}: {
  direction: "right" | "down";
  className?: string;
}) {
  const rotate = direction === "down" ? "rotate-90" : "";
  return (
    <svg
      viewBox="0 0 20 20"
      className={[
        "size-4 text-muted-foreground transition-transform",
        rotate,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M7.6 4.8a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L12.2 10 7.6 5.4a1 1 0 0 1 0-1.4Z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={["size-4", className ?? ""].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M5.3 5.3a1 1 0 0 1 1.4 0L10 8.6l3.3-3.3a1 1 0 1 1 1.4 1.4L11.4 10l3.3 3.3a1 1 0 0 1-1.4 1.4L10 11.4l-3.3 3.3a1 1 0 1 1-1.4-1.4L8.6 10 5.3 6.7a1 1 0 0 1 0-1.4Z"
      />
    </svg>
  );
}

function normalizeData(data: MRegionTreeData): RegionProvinceNode[] {
  return (data ?? [])
    .map((p) => ({
      code: p.code,
      name: p.name,
      children: (p.children ?? []).map((c) => ({ code: c.code, name: c.name })),
    }))
    .filter((p) => Boolean(p.code) && Boolean(p.name))
    .sort((a, b) => a.code.localeCompare(b.code));
}

function normalizeValue(tree: RegionProvinceNode[], input: Set<string>) {
  const out = new Set<string>(input);

  for (const p of tree) {
    const cityCodes = p.children.map((c) => c.code);
    const selectedCities = cityCodes.filter((c) => out.has(c));
    const provinceSelected = out.has(p.code);

    if (provinceSelected) {
      // Province selected means full selection: ensure all its cities are present.
      for (const c of cityCodes) out.add(c);
      continue;
    }

    // If all cities are selected, promote to province selected.
    if (cityCodes.length > 0 && selectedCities.length === cityCodes.length) {
      out.add(p.code);
    }
  }

  return out;
}

function valueToCodeSet(value: MRegionTreeValue) {
  const out = new Set<string>();
  for (const p of value) {
    if (p.checked) out.add(p.code);
    if (p.children) for (const c of p.children) out.add(c.code);
  }
  return out;
}

function codeSetToValue(
  tree: RegionProvinceNode[],
  selected: Set<string>,
): MRegionTreeValue {
  const out: MRegionTreeValue = [];

  for (const p of tree) {
    if (selected.has(p.code)) {
      out.push({
        code: p.code,
        name: p.name,
        checked: true,
        children: p.children.map((c) => ({ code: c.code, name: c.name })),
      });
      continue;
    }

    const selectedCities = p.children
      .filter((c) => selected.has(c.code))
      .map((c) => ({ code: c.code, name: c.name }));

    if (selectedCities.length > 0) {
      out.push({ code: p.code, name: p.name, children: selectedCities });
    }
  }

  return out;
}

export function MRegionTree({
  data,
  value,
  defaultValue,
  onChange,
  disabled = false,
  className,
}: MRegionTreeProps) {
  const tree = useMemo(() => normalizeData(data), [data]);
  const [internal, setInternal] = useState<MRegionTreeValue>(
    () => defaultValue ?? [],
  );
  const rawValue = value ?? internal;
  const [activeProvinceCode, setActiveProvinceCode] = useState("");

  useEffect(() => {
    if (tree.length === 0) {
      if (activeProvinceCode !== "") setActiveProvinceCode("");
      return;
    }

    const exists = tree.some((p) => p.code === activeProvinceCode);
    if (!exists) setActiveProvinceCode(tree[0].code);
  }, [activeProvinceCode, tree]);

  const selected = useMemo(
    () => normalizeValue(tree, valueToCodeSet(rawValue)),
    [rawValue, tree],
  );

  const commit = useCallback(
    (next: Set<string>) => {
      const normalized = normalizeValue(tree, next);
      const nextValue = codeSetToValue(tree, normalized);
      if (!value) setInternal(nextValue);
      onChange?.(nextValue);
    },
    [onChange, tree, value],
  );

  const isProvinceChecked = useCallback(
    (p: RegionProvinceNode) => selected.has(p.code),
    [selected],
  );

  const getProvinceCheckState = useCallback(
    (p: RegionProvinceNode) => {
      const cityCodes = p.children.map((c) => c.code);
      const selectedCities = cityCodes.filter((c) => selected.has(c)).length;
      const checked = selected.has(p.code);
      const indeterminate =
        !checked && selectedCities > 0 && selectedCities < cityCodes.length;
      return { checked, indeterminate };
    },
    [selected],
  );

  const onToggleProvince = useCallback(
    (p: RegionProvinceNode) => {
      if (disabled) return;
      // When toggling province checkbox, also switch active province to show its cities.
      setActiveProvinceCode(p.code);
      const next = new Set(selected);
      const { checked } = getProvinceCheckState(p);

      if (checked) {
        next.delete(p.code);
        for (const c of p.children) next.delete(c.code);
      } else {
        next.add(p.code);
        for (const c of p.children) next.add(c.code);
      }

      commit(next);
    },
    [commit, disabled, getProvinceCheckState, selected, setActiveProvinceCode],
  );

  const onToggleCity = useCallback(
    (p: RegionProvinceNode, c: RegionCityNode) => {
      if (disabled) return;
      const next = new Set(selected);

      if (next.has(c.code)) next.delete(c.code);
      else next.add(c.code);

      // Recompute province selection based on all city selections.
      const allSelected =
        p.children.length > 0 && p.children.every((it) => next.has(it.code));
      if (allSelected) next.add(p.code);
      else next.delete(p.code);

      commit(next);
    },
    [commit, disabled, selected],
  );

  const clearAll = useCallback(() => {
    if (disabled) return;
    commit(new Set());
  }, [commit, disabled]);

  const selectedTree = useMemo(() => {
    const byProvince: Array<{
      province: RegionProvinceNode;
      fullySelected: boolean;
      cities: RegionCityNode[];
    }> = [];

    for (const p of tree) {
      const fullySelected = isProvinceChecked(p);
      const selectedCities = p.children.filter((c) => selected.has(c.code));
      if (!fullySelected && selectedCities.length === 0) continue;
      byProvince.push({
        province: p,
        fullySelected,
        cities: fullySelected ? [] : selectedCities,
      });
    }

    return byProvince;
  }, [isProvinceChecked, selected, tree]);

  const hasSelected = selected.size > 0;
  const activeProvince =
    tree.find((p) => p.code === activeProvinceCode) ?? tree[0] ?? null;

  const provinceAllState = useMemo(() => {
    const provinceCodes = tree.map((p) => p.code);
    const selectedCount = provinceCodes.filter((code) =>
      selected.has(code),
    ).length;
    const checked =
      provinceCodes.length > 0 && selectedCount === provinceCodes.length;
    const indeterminate =
      selectedCount > 0 && selectedCount < provinceCodes.length;
    return { checked, indeterminate };
  }, [selected, tree]);

  const cityAllState = useMemo(() => {
    if (!activeProvince) return { checked: false, indeterminate: false };
    return getProvinceCheckState(activeProvince);
  }, [activeProvince, getProvinceCheckState]);

  const rootCls = [
    rootStyles,
    disabled ? "pointer-events-none opacity-50" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootCls}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className={paneStyles}>
          <div className="border-b border-border px-3 py-2 text-[0.85rem] font-semibold">
            地域
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="border-r border-border">
              <div className={listStyles}>
                <div className="border-b border-border">
                  <div className={[rowBaseStyles, rowHoverStyles].join(" ")}>
                    <input
                      type="checkbox"
                      className={checkboxStyles}
                      checked={provinceAllState.checked}
                      ref={(el) => {
                        if (!el) return;
                        el.indeterminate = provinceAllState.indeterminate;
                      }}
                      onChange={() => {
                        if (disabled) return;
                        if (provinceAllState.checked) {
                          clearAll();
                          return;
                        }
                        const next = new Set(selected);
                        for (const p of tree) {
                          next.add(p.code);
                          for (const c of p.children) next.add(c.code);
                        }
                        commit(next);
                      }}
                      disabled={disabled}
                      aria-label="全选省份"
                    />
                    <button
                      type="button"
                      className="flex flex-1 items-center gap-2 text-left"
                      onClick={() => {
                        if (disabled) return;
                        if (provinceAllState.checked) clearAll();
                        else {
                          const next = new Set(selected);
                          for (const p of tree) {
                            next.add(p.code);
                            for (const c of p.children) next.add(c.code);
                          }
                          commit(next);
                        }
                      }}
                      disabled={disabled}
                    >
                      <span className="font-medium text-foreground">全选</span>
                    </button>
                  </div>
                </div>

                {tree.map((p) => {
                  const { checked, indeterminate } = getProvinceCheckState(p);
                  const isActive = p.code === activeProvinceCode;
                  return (
                    <div
                      key={p.code}
                      className="border-b border-border last:border-b-0"
                    >
                      <div
                        className={[
                          rowBaseStyles,
                          rowHoverStyles,
                          isActive
                            ? "bg-[color-mix(in_srgb,var(--muted)_55%,var(--card))]"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <input
                          type="checkbox"
                          className={checkboxStyles}
                          checked={checked}
                          ref={(el) => {
                            if (!el) return;
                            el.indeterminate = indeterminate;
                          }}
                          onChange={() => onToggleProvince(p)}
                          disabled={disabled}
                          aria-label={`选择${p.name}`}
                        />

                        <button
                          type="button"
                          className="flex flex-1 items-center gap-2 text-left"
                          onClick={() => setActiveProvinceCode(p.code)}
                          disabled={disabled}
                        >
                          <span
                            className={[
                              "font-medium",
                              isActive
                                ? "text-[color:var(--selection)]"
                                : "text-foreground",
                            ].join(" ")}
                          >
                            {p.name}
                          </span>
                          <span className="ml-auto flex items-center">
                            {p.children.length > 0 && (
                              <Chevron direction="right" />
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className={`${listStyles} mt-2`}>
                {!activeProvince || activeProvince.children.length === 0 ? (
                  <div className="px-3 py-3 text-[0.85rem] text-muted-foreground">
                    暂无市级选项
                  </div>
                ) : (
                  activeProvince.children.map((c) => (
                    <label
                      key={c.code}
                      className={[rowBaseStyles, rowHoverStyles].join(" ")}
                    >
                      <input
                        type="checkbox"
                        className={checkboxStyles}
                        checked={selected.has(c.code)}
                        onChange={() => onToggleCity(activeProvince, c)}
                        disabled={disabled}
                        aria-label={`选择${activeProvince.name}${c.name}`}
                      />
                      <span className="text-foreground">{c.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={paneStyles}>
          <div className="flex items-center border-b border-border px-3 py-2">
            <div className="text-[0.85rem] font-semibold">已选</div>
            {hasSelected && !disabled && (
              <button
                type="button"
                className={clearButtonStyles}
                onClick={clearAll}
              >
                清空
              </button>
            )}
          </div>
          {selectedTree.length === 0 ? (
            <div className="flex h-[420px] flex-col items-center justify-center gap-2 text-muted-foreground">
              <svg
                viewBox="0 0 64 64"
                className="h-12 w-12 opacity-60"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M20 10h24a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4Zm2 10a2 2 0 0 1 2-2h16a2 2 0 1 1 0 4H24a2 2 0 0 1-2-2Zm0 10a2 2 0 0 1 2-2h20a2 2 0 1 1 0 4H24a2 2 0 0 1-2-2Zm0 10a2 2 0 0 1 2-2h14a2 2 0 1 1 0 4H24a2 2 0 0 1-2-2Z"
                />
              </svg>
              <div className="text-[0.9rem]">暂无选项</div>
            </div>
          ) : (
            <div className={listStyles}>
              {selectedTree.map(
                ({ province, fullySelected, cities: selectedCities }) => (
                  <div
                    key={province.code}
                    className="border-b border-border last:border-b-0"
                  >
                    {fullySelected ? (
                      <div className={[rowBaseStyles, "py-2"].join(" ")}>
                        <span className="font-medium text-foreground">
                          {province.name}
                          <span className="ml-2 text-[0.75rem] text-muted-foreground">
                            （全省）
                          </span>
                        </span>
                        <button
                          type="button"
                          className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => {
                            if (disabled) return;
                            const next = new Set(selected);
                            next.delete(province.code);
                            for (const c of province.children)
                              next.delete(c.code);
                            commit(next);
                          }}
                          aria-label={`移除${province.name}`}
                          disabled={disabled}
                        >
                          <XIcon />
                        </button>
                      </div>
                    ) : (
                      <div className="px-3 py-2 text-[0.85rem] font-medium text-foreground">
                        {province.name}
                      </div>
                    )}

                    {selectedCities.length > 0 && (
                      <div className="pl-6 pb-2">
                        {selectedCities.map((c) => (
                          <div
                            key={c.code}
                            className={[rowBaseStyles, "py-1.5"].join(" ")}
                          >
                            <span className="text-foreground">{c.name}</span>
                            <button
                              type="button"
                              className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                              onClick={() => {
                                if (disabled) return;
                                const next = new Set(selected);
                                next.delete(c.code);
                                next.delete(province.code);
                                commit(next);
                              }}
                              aria-label={`移除${province.name}${c.name}`}
                              disabled={disabled}
                            >
                              <XIcon />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

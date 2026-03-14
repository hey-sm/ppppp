import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { VirtualList } from "./VirtualList";

export type MTreeNodeId = string;

export interface MTreeNode {
  id: MTreeNodeId;
  label: string;
  hasChildren?: boolean;
}

export interface MTreeDataSource {
  getRoots: () => MTreeNode[];
  getChildren: (id: MTreeNodeId) => MTreeNode[];
  getNode?: (id: MTreeNodeId) => MTreeNode | undefined;
  getAncestors?: (id: MTreeNodeId) => MTreeNodeId[];
  search?: (query: string, limit: number) => MTreeNodeId[];
}

export type MTreeRenderMode = "virtual" | "normal";

/**
 * province-city-china/dist/data.min.json item shape (minified keys)
 * - c: code (6 digits for province/city/area; repeats for town level)
 * - n: name
 * - p/y/a/t: province/city/area/town codes (town is 6 digits)
 */
export type ChinaDivisionMinItem = {
  c: string;
  n: string;
  p: string;
  y: string | number;
  a: string | number;
  t: string | number;
};

export interface MTreeProps {
  /**
   * Pre-indexed tree data source.
   * If you have province-city-china `data.min.json`, prefer passing `data` instead.
   */
  dataSource?: MTreeDataSource;
  /**
   * Flat data from `province-city-china/dist/data.min.json`.
   * MTree will build an internal dataSource with correct unique ids.
   */
  data?: ChinaDivisionMinItem[];
  defaultRenderMode?: MTreeRenderMode;
  renderMode?: MTreeRenderMode;
  onRenderModeChange?: (mode: MTreeRenderMode) => void;
  showModeToggle?: boolean;
  height?: number;
  className?: string;
  /** Auto-expand nodes up to this depth on first mount (0 = collapsed). */
  defaultExpandedDepth?: number;
  /**
   * When switching to normal render mode, expand the whole tree (once).
   * This is mainly for perf demos (virtual vs full DOM).
   */
  expandAllOnNormal?: boolean;
}

type VisibleNode = {
  id: MTreeNodeId;
  label: string;
  level: number;
  hasChildren: boolean;
  expanded: boolean;
};

const rootStyles =
  "rounded-[var(--radius)] border border-border bg-card text-foreground [box-shadow:var(--surface-shadow)]";

const headerStyles = "border-b border-border p-3";
const titleStyles = "text-[0.85rem] font-semibold";

const inputStyles =
  "mt-2 w-full rounded-[calc(var(--radius)-0.125rem)] border border-border bg-background px-3 py-2 text-[0.85rem] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_var(--selection-hover)]";

const listStyles = "overflow-auto";

const rowBaseStyles =
  "group flex w-full items-center gap-2 px-3 py-1.5 text-[0.9rem] whitespace-nowrap transition-colors hover:bg-[color-mix(in_srgb,var(--muted)_65%,var(--card))]";

const iconButtonStyles =
  "inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground";

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={[
        "size-4 text-muted-foreground transition-transform",
        expanded ? "rotate-90" : "",
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

function useProgressiveCount(total: number, enabled: boolean, max?: number) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (total <= 0) {
      setCount(0);
      return;
    }

    let canceled = false;
    let rendered = 0;
    const MAX = max && max > 0 ? max : 3000;
    const STEP = 250;
    const target = Math.min(total, MAX);

    const schedule = (cb: () => void) => {
      // Prefer idle to keep UI responsive in "normal" mode.
      const ric = (window as any).requestIdleCallback as
        | ((fn: () => void) => number)
        | undefined;
      if (ric) {
        const id = ric(cb);
        return () => (window as any).cancelIdleCallback?.(id);
      }
      const id = window.setTimeout(cb, 16);
      return () => window.clearTimeout(id);
    };

    let cancelSchedule: undefined | (() => void);
    const tick = () => {
      if (canceled) return;
      rendered = Math.min(rendered + STEP, target);
      setCount(rendered);
      if (rendered < target) {
        cancelSchedule = schedule(tick);
      }
    };

    // Start with a small chunk immediately to avoid blank screen.
    rendered = Math.min(STEP, target);
    setCount(rendered);
    cancelSchedule = schedule(tick);

    return () => {
      canceled = true;
      cancelSchedule?.();
    };
  }, [enabled, total, max]);

  return count;
}

function createChinaDivisionMinDataSource(
  data: readonly ChinaDivisionMinItem[],
): MTreeDataSource {
  const nodeById = new Map<string, MTreeNode>();
  const parentById = new Map<string, string | null>();
  const childrenById = new Map<string, string[]>();
  const labelById = new Map<string, string>();

  const isZero = (v: unknown) =>
    v === 0 ||
    v === "0" ||
    v === "00" ||
    v === "0000" ||
    v === "000000" ||
    v == null;

  const pad = (v: unknown, len: number) => {
    const s = String(v ?? "");
    return s.length >= len ? s : s.padStart(len, "0");
  };

  // Pass 1: collect best-known labels for each level id.
  for (const item of data) {
    const p = pad(item.p, 2);
    const y0 = isZero(item.y);
    const a0 = isZero(item.a);
    const t0 = isZero(item.t);
    const y = y0 ? "00" : pad(item.y, 2);
    const a = a0 ? "00" : pad(item.a, 2);
    const t = t0 ? "000000" : pad(item.t, 6);

    const provinceId = `${p}0000`;
    const cityId = `${p}${y}00`;
    const areaId = `${p}${y}${a}`;
    const townId = `${p}${y}${a}${t}`;
    const label = String(item.n ?? item.c ?? "");

    if (y0 && a0 && t0) labelById.set(provinceId, label);
    else if (!y0 && a0 && t0) labelById.set(cityId, label);
    else if (!a0 && t0) labelById.set(areaId, label);
    else if (!t0) labelById.set(townId, label);
  }

  const addNode = (id: string, label: string) => {
    if (!id) return;
    if (!nodeById.has(id)) nodeById.set(id, { id, label, hasChildren: false });
  };

  const addEdge = (parentId: string | null, childId: string) => {
    if (!childId) return;
    if (!parentById.has(childId)) parentById.set(childId, parentId);
    if (!parentId) return;
    const list = childrenById.get(parentId) ?? [];
    list.push(childId);
    childrenById.set(parentId, list);
  };

  // Pass 2: build hierarchy. Also create intermediate nodes even if the dataset
  // doesn't contain explicit "city" rows (common for municipalities in some builds).
  for (const item of data) {
    const p = pad(item.p, 2);
    const y0 = isZero(item.y);
    const a0 = isZero(item.a);
    const t0 = isZero(item.t);
    const y = y0 ? "00" : pad(item.y, 2);
    const a = a0 ? "00" : pad(item.a, 2);
    const t = t0 ? "000000" : pad(item.t, 6);

    const provinceId = `${p}0000`;
    const cityId = `${p}${y}00`;
    const areaId = `${p}${y}${a}`;
    const townId = `${p}${y}${a}${t}`;

    const provinceLabel = labelById.get(provinceId) ?? provinceId;
    addNode(provinceId, provinceLabel);
    addEdge(null, provinceId);

    if (!y0) {
      const cityLabel =
        labelById.get(cityId) ?? labelById.get(provinceId) ?? cityId;
      addNode(cityId, cityLabel);
      addEdge(provinceId, cityId);
    }

    if (!a0) {
      const areaLabel = labelById.get(areaId) ?? areaId;
      addNode(areaId, areaLabel);
      addEdge(y0 ? provinceId : cityId, areaId);
    }

    if (!t0) {
      // Town-level `c` repeats (same as area code), so use synthetic unique id.
      const townLabel = labelById.get(townId) ?? townId;
      addNode(townId, townLabel);
      addEdge(areaId, townId);
    }
  }

  for (const [pid, list] of childrenById) {
    const uniq = Array.from(new Set(list));
    uniq.sort((x, y) => x.localeCompare(y));
    childrenById.set(pid, uniq);
    const parent = nodeById.get(pid);
    if (parent) parent.hasChildren = uniq.length > 0;
  }

  const roots = Array.from(nodeById.keys())
    .filter((id) => (parentById.get(id) ?? null) === null)
    .sort((a, b) => a.localeCompare(b))
    .map((id) => nodeById.get(id)!)
    .filter(Boolean);

  const index: Array<{ id: string; label: string }> = [];
  for (const [id, node] of nodeById) index.push({ id, label: node.label });

  const getAncestors = (id: string) => {
    const out: string[] = [];
    let cur: string | null | undefined = parentById.get(id);
    while (cur) {
      out.push(cur);
      cur = parentById.get(cur) ?? null;
    }
    out.reverse();
    return out;
  };

  return {
    getRoots: () => roots,
    getChildren: (id) => {
      const list = childrenById.get(id) ?? [];
      return list.map((cid) => nodeById.get(cid)!).filter(Boolean);
    },
    getNode: (id) => nodeById.get(id),
    getAncestors,
    search: (query, limit) => {
      const q = query.trim();
      if (!q) return [];
      const out: string[] = [];
      for (const it of index) {
        if (it.label.includes(q)) {
          out.push(it.id);
          if (out.length >= limit) break;
        }
      }
      return out;
    },
  };
}

function buildVisible(
  dataSource: MTreeDataSource,
  expanded: Set<MTreeNodeId>,
): VisibleNode[] {
  const out: VisibleNode[] = [];
  const stack: Array<{
    node: MTreeNode;
    level: number;
    idx: number;
    list: MTreeNode[];
  }> = [];

  const roots = dataSource.getRoots() ?? [];
  for (let i = roots.length - 1; i >= 0; i--) {
    stack.push({ node: roots[i], level: 0, idx: 0, list: [] });
  }

  while (stack.length > 0) {
    const cur = stack.pop()!;
    const node = cur.node;
    const level = cur.level;
    const isExpanded = expanded.has(node.id);
    const children = isExpanded ? (dataSource.getChildren(node.id) ?? []) : [];
    const hasChildren = Boolean(node.hasChildren ?? children.length > 0);

    out.push({
      id: node.id,
      label: node.label,
      level,
      hasChildren,
      expanded: isExpanded,
    });

    if (isExpanded && children.length > 0) {
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push({ node: children[i], level: level + 1, idx: 0, list: [] });
      }
    }
  }

  return out;
}

export function MTree({
  dataSource: propDataSource,
  data,
  defaultRenderMode = "virtual",
  renderMode,
  onRenderModeChange,
  showModeToggle = true,
  height = 520,
  className,
  defaultExpandedDepth = 0,
  expandAllOnNormal = false,
}: MTreeProps) {
  const dataSource = useMemo(() => {
    if (propDataSource) return propDataSource;
    if (data) return createChinaDivisionMinDataSource(data);
    return null;
  }, [propDataSource, data]);

  const [internalMode, setInternalMode] =
    useState<MTreeRenderMode>(defaultRenderMode);
  const mode = renderMode ?? internalMode;
  const [expanded, setExpanded] = useState<Set<MTreeNodeId>>(() => new Set());
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MTreeNodeId[]>([]);
  const [searchSuppressed, setSearchSuppressed] = useState(false);
  const [focusId, setFocusId] = useState<MTreeNodeId | null>(null);
  const [scrollToIndex, setScrollToIndex] = useState<number | null>(null);
  const seededRef = useRef(false);
  const expandedAllRef = useRef(false);

  const visible = useMemo(() => {
    if (!dataSource) return [];
    return buildVisible(dataSource, expanded);
  }, [dataSource, expanded]);

  const normalMax =
    mode === "normal" && expandAllOnNormal ? visible.length : 3000;
  const normalCount = useProgressiveCount(
    visible.length,
    mode === "normal",
    normalMax,
  );

  useEffect(() => {
    if (!dataSource) return;
    if (mode !== "normal") return;
    if (!expandAllOnNormal) return;
    if (expandedAllRef.current) return;

    const next = new Set<MTreeNodeId>();
    const visited = new Set<MTreeNodeId>();
    const stack: MTreeNode[] = [...(dataSource.getRoots() ?? [])];

    while (stack.length > 0) {
      const n = stack.pop()!;
      if (visited.has(n.id)) continue;
      visited.add(n.id);

      const children = dataSource.getChildren(n.id) ?? [];
      if (children.length > 0) {
        next.add(n.id);
        for (const c of children) stack.push(c);
      }
    }

    setExpanded(next);
    expandedAllRef.current = true;
  }, [dataSource, mode, expandAllOnNormal]);

  useEffect(() => {
    if (seededRef.current) return;
    if (!dataSource) return;
    if (!defaultExpandedDepth || defaultExpandedDepth <= 0) {
      seededRef.current = true;
      return;
    }

    // Expand all nodes up to the given depth.
    const next = new Set<MTreeNodeId>();
    let frontier = dataSource.getRoots();
    for (let d = 0; d < defaultExpandedDepth; d++) {
      const nextFrontier: MTreeNode[] = [];
      for (const n of frontier) {
        const children = dataSource.getChildren(n.id) ?? [];
        if (children.length > 0) {
          next.add(n.id);
          nextFrontier.push(...children);
        }
      }
      frontier = nextFrontier;
      if (frontier.length === 0) break;
    }

    setExpanded(next);
    seededRef.current = true;
  }, [dataSource, defaultExpandedDepth]);

  const toggle = useCallback((id: MTreeNodeId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandTo = useCallback(
    (id: MTreeNodeId) => {
      if (!dataSource) return;
      const ancestors = dataSource.getAncestors?.(id) ?? [];
      setExpanded((prev) => {
        const next = new Set(prev);
        for (const a of ancestors) next.add(a);
        next.add(id);
        return next;
      });
      setFocusId(id);
    },
    [dataSource],
  );

  useEffect(() => {
    if (mode !== "virtual") return;
    if (!focusId) return;
    const idx = visible.findIndex((v) => v.id === focusId);
    if (idx < 0) return;
    setScrollToIndex((prev) => (prev === idx ? prev : idx));
  }, [mode, focusId, visible]);

  useEffect(() => {
    if (!dataSource) {
      setSearchResults([]);
      return;
    }
    if (searchSuppressed) {
      setSearchResults([]);
      return;
    }
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    const limit = 200;
    const ids =
      dataSource.search?.(q, limit) ??
      // Fallback: naive scan over currently visible nodes.
      visible
        .filter((n) => n.label.includes(q))
        .slice(0, limit)
        .map((n) => n.id);

    setSearchResults(ids);
  }, [dataSource, query, visible, searchSuppressed]);

  const headerCls = [headerStyles].filter(Boolean).join(" ");
  const rootCls = [rootStyles, className ?? ""].filter(Boolean).join(" ");

  const setMode = useCallback(
    (next: MTreeRenderMode) => {
      if (renderMode) onRenderModeChange?.(next);
      else setInternalMode(next);
    },
    [onRenderModeChange, renderMode],
  );

  const renderRow = (node: VisibleNode) => {
    const isFocused = focusId === node.id;
    return (
      <div
        className={[
          rowBaseStyles,
          isFocused
            ? "bg-[color-mix(in_srgb,var(--selection)_16%,var(--card))]"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ paddingLeft: 12 + node.level * 16 }}
        data-node-id={node.id}
      >
        {node.hasChildren ? (
          <button
            type="button"
            className={iconButtonStyles}
            onClick={() => toggle(node.id)}
            aria-label={node.expanded ? "Collapse" : "Expand"}
          >
            <Chevron expanded={node.expanded} />
          </button>
        ) : (
          <span className="inline-block size-6" aria-hidden="true" />
        )}

        <button
          type="button"
          className="flex-1 min-w-0 text-left"
          onClick={() =>
            node.hasChildren ? toggle(node.id) : setFocusId(node.id)
          }
          title={node.label}
        >
          <span className="block truncate text-foreground">{node.label}</span>
        </button>
      </div>
    );
  };

  return (
    <div className={rootCls}>
      <div className={headerCls}>
        <div className="flex items-center gap-3">
          <div className={titleStyles}>Tree</div>
          {showModeToggle && (
            <div className="ml-auto flex items-center gap-2 text-[0.8rem]">
              <button
                type="button"
                className={[
                  "rounded px-2 py-1 border border-border",
                  mode === "virtual"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted",
                ].join(" ")}
                onClick={() => setMode("virtual")}
              >
                Virtual
              </button>
              <button
                type="button"
                className={[
                  "rounded px-2 py-1 border border-border",
                  mode === "normal"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted",
                ].join(" ")}
                onClick={() => setMode("normal")}
              >
                Normal
              </button>
            </div>
          )}
        </div>

        <input
          className={inputStyles}
          placeholder="Search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchSuppressed(false);
          }}
        />

        {searchResults.length > 0 && (
          <div className="mt-2 rounded-[calc(var(--radius)-0.125rem)] border border-border bg-background overflow-hidden">
            <div className="max-h-56 overflow-auto">
              {searchResults.map((id) => {
                const node =
                  dataSource?.getNode?.(id) ??
                  visible.find((v) => v.id === id) ??
                  null;
                const label = node ? (node as any).label : id;
                return (
                  <button
                    key={id}
                    type="button"
                    className="flex w-full items-center px-3 py-2 text-left text-[0.85rem] hover:bg-muted"
                    onClick={() => {
                      expandTo(id);
                      // Close the dropdown after choosing a result.
                      setSearchResults([]);
                      setSearchSuppressed(true);
                    }}
                    title={label}
                  >
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!dataSource ? (
        <div className="p-4 text-sm text-muted-foreground">
          Missing tree data. Provide `dataSource` or pass `data` from
          `province-city-china/dist/data.min.json`.
        </div>
      ) : mode === "virtual" ? (
        <VirtualList
          items={visible}
          itemHeight={34}
          containerHeight={height}
          overscan={8}
          unstyled
          itemUnstyled
          itemClassName="px-0 py-0 border-0 bg-transparent"
          scrollToIndex={scrollToIndex}
          renderItem={(n) => renderRow(n)}
        />
      ) : (
        <div className={listStyles} style={{ height }}>
          <div className="p-1">
            {visible.slice(0, Math.max(0, normalCount)).map((n) => (
              <div key={n.id}>{renderRow(n)}</div>
            ))}
            {visible.length > normalCount && (
              <div className="px-3 py-3 text-[0.8rem] text-muted-foreground">
                {mode === "normal" && expandAllOnNormal
                  ? "Progressively rendering " +
                    normalCount +
                    "/" +
                    visible.length +
                    "..."
                  : "Progressively rendering " +
                    normalCount +
                    "/" +
                    Math.min(visible.length, normalMax) +
                    "..."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

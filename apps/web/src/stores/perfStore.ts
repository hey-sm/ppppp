// ============================================================================
// Zustand Store：性能指标状态管理
// ============================================================================
//
// 设计思路：
// PerfMonitor SDK 的 subscribe 回调将指标推送到这个 store
// Dashboard 页面的各图表组件订阅这个 store 实现实时渲染

import { create } from 'zustand'
import type { PerfMetrics } from '@fluxp/perf-monitor'

interface PerfState {
  /** 当前性能指标快照 */
  metrics: PerfMetrics
  /** 更新指标 */
  updateMetrics: (metrics: PerfMetrics) => void
}

export const usePerfStore = create<PerfState>((set) => ({
  metrics: {
    vitals: {},
    fps: 0,
    memory: null,
    longTasks: [],
  },

  updateMetrics: (metrics) => set({ metrics }),
}))

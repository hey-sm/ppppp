// ============================================================================
// Zustand Store：日志状态管�?
// ============================================================================
//
// 设计思路�?
// Logger SDK �?onLog 回调将日志推送到这个 store
// DevTools 浮窗组件订阅这个 store 实现实时渲染
//
// 数据流：
// Logger SDK onLog �?useLogStore.addLog() �?DevTools UI 自动重渲�?
//
// 为什么用 Zustand 而不�?Context�?
// 1. 日志数据更新频率高（每秒可能几十条），Context 会导致所�?consumer 重渲�?
// 2. Zustand 的选择性订阅（selector）可以精确控制重渲染范围
// 3. 跨组件访问（logger 初始化在 main.tsx，DevTools 在组件树中）更方�?

import { create } from 'zustand'
import type { LogEntry } from '@fluxp/logger-sdk'

/** 日志 store 的最大容量，防止内存无限增长 */
const MAX_LOGS = 200

/** 日志等级过滤选项 */
export type LogFilter = 'all' | 'info' | 'warn' | 'error' | 'debug'

interface LogState {
  logs: LogEntry[]
  filter: LogFilter
  /** DevTools 面板是否展开 */
  isOpen: boolean
  /** DevTools 触发器是否可见（关闭后通过三次 Shift 唤醒） */
  isVisible: boolean
  addLog: (entry: LogEntry) => void
  setFilter: (filter: LogFilter) => void
  togglePanel: () => void
  clearLogs: () => void
  /** 隐藏整个 DevTools（触发器 + 面板） */
  hideDevTools: () => void
  /** 显示 DevTools 触发器 */
  showDevTools: () => void
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  filter: 'all',
  isOpen: false,
  isVisible: true,

  addLog: (entry) =>
    set((state) => ({
      logs: [...state.logs, entry].slice(-MAX_LOGS),
    })),

  setFilter: (filter) => set({ filter }),

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

  clearLogs: () => set({ logs: [] }),

  hideDevTools: () => set({ isVisible: false, isOpen: false }),

  showDevTools: () => set({ isVisible: true }),
}))

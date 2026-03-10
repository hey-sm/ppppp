// ============================================================================
// Web Vitals 采集器
// ============================================================================
//
// 实现思路：使用 PerformanceObserver API
//
// PerformanceObserver 是浏览器原生提供的性能指标观察器
// 它比 performance.getEntries() 更高效：
// 1. 异步回调，不会阻塞主线程
// 2. 支持 buffered: true，可以获取页面加载时已经产生的指标
//    （比如 FCP 在你注册 observer 之前就已经触发了，buffered 确保不会遗漏）
//
// 各指标的采集方法：
// - FCP: 观察 'paint' 类型，取 name 为 'first-contentful-paint' 的条目
// - LCP: 观察 'largest-contentful-paint' 类型，取最后一个条目
//         （LCP 可能多次更新，最终值以最后一个为准）
// - CLS: 观察 'layout-shift' 类型，累加所有 hadRecentInput=false 的偏移值
//         （排除用户操作引起的布局偏移，如点击展开菜单）
// - TTFB: 从 performance.getEntriesByType('navigation') 获取

import type { WebVital, WebVitalName } from './types'

/**
 * Web Vitals 评级阈值
 * 参考 Google 官方标准：https://web.dev/vitals/
 */
const THRESHOLDS: Record<WebVitalName, [number, number]> = {
  //          [good, poor]  — good 以下为绿，poor 以上为红，中间为黄
  FCP: [1800, 3000], // 单位 ms
  LCP: [2500, 4000], // 单位 ms
  CLS: [0.1, 0.25], // 无单位（累积分数）
  TTFB: [800, 1800], // 单位 ms
}

/** 根据阈值计算评级 */
function getRating(name: WebVitalName, value: number): WebVital['rating'] {
  const [good, poor] = THRESHOLDS[name]
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

/**
 * 观察核心 Web 指标
 *
 * @param onVital - 每采集到一个指标就调用一次
 * @returns cleanup 函数，调用后停止观察
 *
 * @example
 * ```ts
 * const cleanup = observeWebVitals((vital) => {
 *   console.log(`${vital.name}: ${vital.value} (${vital.rating})`)
 * })
 * // 稍后清理
 * cleanup()
 * ```
 */
export function observeWebVitals(onVital: (vital: WebVital) => void): () => void {
  const observers: PerformanceObserver[] = []

  // ── FCP：首次内容渲染 ──
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          const value = Math.round(entry.startTime)
          onVital({ name: 'FCP', value, rating: getRating('FCP', value) })
        }
      }
    })
    // buffered: true — 获取页面加载初期已产生但尚未被观察的指标
    fcpObserver.observe({ type: 'paint', buffered: true })
    observers.push(fcpObserver)
  } catch {
    // Safari 等浏览器可能不支持某些 entry type，静默忽略
  }

  // ── LCP：最大内容渲染 ──
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      // LCP 可能报告多次（随着更大元素的渲染），取最后一个值
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) {
        const value = Math.round(lastEntry.startTime)
        onVital({ name: 'LCP', value, rating: getRating('LCP', value) })
      }
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    observers.push(lcpObserver)
  } catch {
    /* 不支持则跳过 */
  }

  // ── CLS：累计布局偏移 ──
  let clsValue = 0
  try {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // hadRecentInput: 排除用户操作（如点击按钮）引起的布局偏移
        // 只统计非用户操作导致的意外偏移
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
          onVital({
            name: 'CLS',
            value: parseFloat(clsValue.toFixed(4)),
            rating: getRating('CLS', clsValue),
          })
        }
      }
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })
    observers.push(clsObserver)
  } catch {
    /* 不支持则跳过 */
  }

  // ── TTFB：首字节时间 ──
  // TTFB 直接从 navigation timing 获取，不需要 PerformanceObserver
  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (navEntries.length > 0) {
      const value = Math.round(navEntries[0].responseStart)
      onVital({ name: 'TTFB', value, rating: getRating('TTFB', value) })
    }
  } catch {
    /* 不支持则跳过 */
  }

  // 返回清理函数
  return () => {
    observers.forEach((obs) => obs.disconnect())
  }
}

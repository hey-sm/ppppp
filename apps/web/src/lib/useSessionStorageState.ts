import { useEffect, useState } from 'react'

export function useSessionStorageState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const raw = window.sessionStorage.getItem(key)
      if (raw === null) return initial
      return JSON.parse(raw) as T
    } catch {
      return initial
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const serialized = JSON.stringify(state)
      window.sessionStorage.setItem(key, serialized ?? 'null')
    } catch {
      // ignore write errors
    }
  }, [key, state])

  return [state, setState] as const
}

"use client"

import { useRef, useEffect, useCallback } from "react"

// Polyfill for useEffectEvent which is not available in React 18
export function useEffectEvent<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn)

  useEffect(() => {
    ref.current = fn
  })

  return useCallback((...args: Parameters<T>): ReturnType<T> => {
    return ref.current(...args)
  }, []) as T
}

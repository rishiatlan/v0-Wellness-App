"use client"

import React from "react"

import { useRef, useEffect, useCallback } from "react"

// This is a polyfill for the useEffectEvent hook that Radix UI is trying to use
export function useEffectEvent<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn)

  useEffect(() => {
    ref.current = fn
  })

  return useCallback((...args: Parameters<T>): ReturnType<T> => {
    return ref.current(...args)
  }, []) as T
}

// Export this so it can be used as a replacement for the missing React hook
if (typeof window !== "undefined") {
  // @ts-ignore
  window.React = window.React || {}
  // @ts-ignore
  window.React.useEffectEvent = useEffectEvent
}

// Also add it to the global React object for SSR
// @ts-ignore
if (typeof React !== "undefined" && !React.useEffectEvent) {
  // @ts-ignore
  React.useEffectEvent = useEffectEvent
}

"use client"

// This file provides global polyfills for React 18 compatibility

// Create a global React object if it doesn't exist
if (typeof window !== "undefined") {
  window.React = window.React || {}

  // Add useEffectEvent polyfill
  if (!window.React.useEffectEvent) {
    window.React.useEffectEvent = function useEffectEvent(fn: any) {
      const ref = window.React.useRef(fn)
      window.React.useEffect(() => {
        ref.current = fn
      })
      return window.React.useCallback((...args: any[]) => ref.current(...args), [])
    }
  }

  // Add cache polyfill if needed
  if (!window.React.cache) {
    window.React.cache = function cache(fn: any) {
      const cache = new Map()
      return (...args: any[]) => {
        const key = JSON.stringify(args)
        if (cache.has(key)) return cache.get(key)
        const result = fn(...args)
        cache.set(key, result)
        return result
      }
    }
  }

  // Add any other missing React 19 features as needed
}

export {}

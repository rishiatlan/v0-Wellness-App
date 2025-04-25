// Global polyfill for React.useEffectEvent
if (typeof window !== "undefined") {
  window.React = window.React || {}

  // Add useEffectEvent polyfill if it doesn't exist
  if (!window.React.useEffectEvent) {
    window.React.useEffectEvent = (fn) => {
      // Simple implementation that just returns the function
      // This works for most basic use cases
      return fn
    }
  }
}

// Export a function that can be used as a polyfill
export function useEffectEvent(fn) {
  // Return the function as-is
  return fn
}

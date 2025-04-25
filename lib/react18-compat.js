// This file provides compatibility with React 18
// It doesn't modify any global objects or import any modules

// Export a simple function that can be used in place of useEffectEvent
export function useEffectEvent(fn) {
  return fn
}

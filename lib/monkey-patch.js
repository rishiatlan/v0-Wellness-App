// This file will be executed at runtime to monkey patch React.useEffectEvent

// Wait for React to be defined
;(function checkAndPatch() {
  if (typeof window !== "undefined") {
    if (window.React) {
      // Add useEffectEvent if it doesn't exist
      if (!window.React.useEffectEvent) {
        window.React.useEffectEvent = (fn) => fn
        console.log("Successfully monkey patched React.useEffectEvent")
      }
    } else {
      // If React is not defined yet, wait and try again
      setTimeout(checkAndPatch, 50)
    }
  }
})()

// Export a function that can be used as a polyfill
export function useEffectEvent(fn) {
  return fn
}

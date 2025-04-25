// This is a standalone polyfill file with no imports
// It will be loaded directly in _document.js and layout.tsx

// Define the polyfill function
function createUseEffectEventPolyfill() {
  if (typeof window !== "undefined") {
    // Create React object if it doesn't exist
    window.React = window.React || {}

    // Add useEffectEvent if it doesn't exist
    if (!window.React.useEffectEvent) {
      window.React.useEffectEvent = (fn) => fn
      console.log("React.useEffectEvent polyfill applied")
    }
  }
}

// Run the polyfill immediately
createUseEffectEventPolyfill()

// Export for ESM imports
export default createUseEffectEventPolyfill

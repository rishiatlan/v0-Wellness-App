"use client"

// This file provides polyfills for better browser compatibility

// Polyfill for Object.hasOwn for older browsers
if (!Object.hasOwn) {
  Object.defineProperty(Object, "hasOwn", {
    value: (object: any, property: PropertyKey) => {
      if (object === null || object === undefined) {
        throw new TypeError("Cannot convert undefined or null to object")
      }
      return Object.prototype.hasOwnProperty.call(Object(object), property)
    },
    configurable: true,
    writable: true,
  })
}

// Polyfill for Array.prototype.at for older browsers
if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, "at", {
    value: function (n: number) {
      n = Math.trunc(n) || 0
      if (n < 0) n += this.length
      if (n < 0 || n >= this.length) return undefined
      return this[n]
    },
    configurable: true,
    writable: true,
  })
}

// Add more polyfills as needed

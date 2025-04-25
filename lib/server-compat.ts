// This file provides compatibility helpers for Server Components

/**
 * A compatibility wrapper for React.cache
 * This provides a similar API but works with React 18
 */
export function serverCache<T extends (...args: any[]) => Promise<any>>(fn: T) {
  const cache = new Map()

  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = await fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * A compatibility wrapper for data fetching in Server Components
 * This provides a similar API but works with React 18
 */
export async function fetchData<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error
  }
}

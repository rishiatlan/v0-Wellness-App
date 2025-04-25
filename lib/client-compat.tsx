"use client"

import { useState, useEffect } from "react"

/**
 * A compatibility replacement for useActionState
 * This provides a similar API but works with React 18
 */
export function useCompatActionState<T, U>(action: (formData: FormData) => Promise<T>, initialState?: U) {
  const [state, setState] = useState<U | T | undefined>(initialState)
  const [isPending, setIsPending] = useState(false)

  const actionWrapper = async (formData: FormData) => {
    setIsPending(true)
    try {
      const result = await action(formData)
      setState(result)
      return result
    } catch (error) {
      console.error("Action error:", error)
      throw error
    } finally {
      setIsPending(false)
    }
  }

  return [state, actionWrapper, isPending] as const
}

/**
 * A compatibility wrapper for async data in Client Components
 * This provides a similar API but works with React 18
 */
export function useAsyncData<T>(fetchFn: () => Promise<T>, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      setLoading(true)
      try {
        const result = await fetchFn()
        if (isMounted) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setData(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, dependencies)

  return { data, error, loading }
}

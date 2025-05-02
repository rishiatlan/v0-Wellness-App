"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"

export function React18Test() {
  const [count, setCount] = useState(0)
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    // Use React 18's automatic batching
    setCount(count + 1)

    // Use React 18's useTransition for non-blocking updates
    startTransition(() => {
      // This update is marked as non-urgent and won't block the UI
      console.log("Transition completed", count)
    })
  }

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-lg font-bold mb-2">React 18 Feature Test</h2>
      <p className="mb-2">Count: {count}</p>
      <p className="mb-2">Transition state: {isPending ? "Pending" : "Complete"}</p>
      <Button onClick={handleClick}>Increment</Button>
    </div>
  )
}

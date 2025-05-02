"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Sun, Moon, RotateCcw, Eye } from "lucide-react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AccessibilityFeatures() {
  const { setTheme, theme } = useTheme()
  const [fontSize, setFontSize] = useState(1)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Try to load saved font size from localStorage
    const savedFontSize = Number.parseFloat(localStorage.getItem("accessibility-font-size") || "1")
    if (!isNaN(savedFontSize)) {
      setFontSize(savedFontSize)
      document.documentElement.style.fontSize = `${savedFontSize * 100}%`
    }
  }, [])

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 0.1, 1.5)
    setFontSize(newSize)
    document.documentElement.style.fontSize = `${newSize * 100}%`
    localStorage.setItem("accessibility-font-size", newSize.toString())
  }

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 0.1, 0.8)
    setFontSize(newSize)
    document.documentElement.style.fontSize = `${newSize * 100}%`
    localStorage.setItem("accessibility-font-size", newSize.toString())
  }

  const resetFontSize = () => {
    setFontSize(1)
    document.documentElement.style.fontSize = "100%"
    localStorage.setItem("accessibility-font-size", "1")
  }

  if (!mounted) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full" aria-label="Accessibility options">
          <Eye className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Accessibility</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark Mode</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={increaseFontSize}>
          <ZoomIn className="mr-2 h-4 w-4" />
          <span>Increase Font Size</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={decreaseFontSize}>
          <ZoomOut className="mr-2 h-4 w-4" />
          <span>Decrease Font Size</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={resetFontSize}>
          <RotateCcw className="mr-2 h-4 w-4" />
          <span>Reset Font Size</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import type React from "react"
import { cn } from "@/lib/utils"

interface DataDisplayProps {
  label: string
  value: string | number | React.ReactNode
  icon?: React.ReactNode
  className?: string
  valueClassName?: string
}

export function DataDisplay({ label, value, icon, className, valueClassName }: DataDisplayProps) {
  return (
    <div className={cn("rounded-lg bg-navy-900/50 p-4 border border-navy-800", className)}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-sm text-slate-400">{label}</p>
      </div>
      <div className={cn("text-xl font-semibold", valueClassName)}>{value}</div>
    </div>
  )
}

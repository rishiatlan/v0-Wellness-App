import type React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface SectionHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  className?: string
  action?: React.ReactNode
}

export function SectionHeader({ title, description, icon: Icon, className, action }: SectionHeaderProps) {
  return (
    <div className={cn("mb-8 flex justify-between items-start", className)}>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
          {Icon && <Icon className="h-6 w-6 text-primary" />}
          {title}
        </h2>
        {description && <p className="text-slate-400 max-w-3xl">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

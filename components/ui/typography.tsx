import type React from "react"
import { cn } from "@/lib/utils"

interface TypographyProps {
  children: React.ReactNode
  className?: string
}

export function TypographyH1({ children, className }: TypographyProps) {
  return <h1 className={cn("scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl", className)}>{children}</h1>
}

export function TypographyH2({ children, className }: TypographyProps) {
  return <h2 className={cn("scroll-m-20 text-2xl font-semibold tracking-tight lg:text-3xl", className)}>{children}</h2>
}

export function TypographyH3({ children, className }: TypographyProps) {
  return <h3 className={cn("scroll-m-20 text-xl font-semibold tracking-tight", className)}>{children}</h3>
}

export function TypographyH4({ children, className }: TypographyProps) {
  return <h4 className={cn("scroll-m-20 text-lg font-semibold tracking-tight", className)}>{children}</h4>
}

export function TypographyP({ children, className }: TypographyProps) {
  return <p className={cn("leading-7 [&:not(:first-child)]:mt-4", className)}>{children}</p>
}

export function TypographyLead({ children, className }: TypographyProps) {
  return <p className={cn("text-lg text-muted-foreground", className)}>{children}</p>
}

export function TypographyLarge({ children, className }: TypographyProps) {
  return <div className={cn("text-lg font-semibold", className)}>{children}</div>
}

export function TypographySmall({ children, className }: TypographyProps) {
  return <small className={cn("text-sm font-medium leading-none", className)}>{children}</small>
}

export function TypographyMuted({ children, className }: TypographyProps) {
  return <p className={cn("text-sm text-slate-400", className)}>{children}</p>
}

import type React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface EnhancedCardProps {
  children: React.ReactNode
  className?: string
}

export function EnhancedCard({ children, className }: EnhancedCardProps) {
  return <Card className={cn("border-navy-800 bg-navy-900/80 backdrop-blur-sm shadow-md", className)}>{children}</Card>
}

export function EnhancedCardHeader({ children, className }: EnhancedCardProps) {
  return <CardHeader className={cn("border-b border-navy-800", className)}>{children}</CardHeader>
}

export function EnhancedCardTitle({ children, className }: EnhancedCardProps) {
  return <CardTitle className={cn("text-xl font-semibold tracking-tight text-white", className)}>{children}</CardTitle>
}

export function EnhancedCardDescription({ children, className }: EnhancedCardProps) {
  return <CardDescription className={cn("text-slate-400 mt-1", className)}>{children}</CardDescription>
}

export function EnhancedCardContent({ children, className }: EnhancedCardProps) {
  return <CardContent className={cn("pt-6", className)}>{children}</CardContent>
}

export function EnhancedCardFooter({ children, className }: EnhancedCardProps) {
  return (
    <CardFooter className={cn("border-t border-navy-800 bg-navy-950/50 px-6 py-4", className)}>{children}</CardFooter>
  )
}

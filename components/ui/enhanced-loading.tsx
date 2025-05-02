import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedLoadingProps {
  size?: "sm" | "md" | "lg" | "xl"
  text?: string
  className?: string
  fullPage?: boolean
}

export function EnhancedLoading({ size = "md", text, className, fullPage = false }: EnhancedLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  const containerClasses = fullPage
    ? "container flex h-[calc(100vh-200px)] items-center justify-center"
    : "flex flex-col items-center justify-center py-8"

  return (
    <div className={cn(containerClasses, className)}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary mb-3")} />
      {text && <p className="text-slate-300 text-sm mt-2">{text}</p>}
    </div>
  )
}

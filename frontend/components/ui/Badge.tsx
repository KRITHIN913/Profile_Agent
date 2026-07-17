import * as React from "react"
import { cn } from "./Card"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  
  const variants = {
    default: "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
    success: "border-transparent bg-success/10 text-success hover:bg-success/20",
    warning: "border-transparent bg-warning/10 text-warning hover:bg-warning/20",
    destructive: "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
    outline: "text-foreground border border-gray-200",
  }

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  )
}

export { Badge }

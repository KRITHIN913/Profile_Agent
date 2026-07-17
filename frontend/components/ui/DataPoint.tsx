import * as React from "react"
import { Badge } from "./Badge"

interface DataPointProps {
  label?: string
  value: string | undefined | null
  className?: string
  valueClassName?: string
}

const SENTINEL_NULL = "Not publicly available"
const UNVERIFIED_FLAG = "[UNVERIFIED: Weak source match]"

export function DataPoint({ label, value, className = "", valueClassName = "" }: DataPointProps) {
  if (!value) return null

  const isMissing = value === SENTINEL_NULL
  const isUnverified = typeof value === 'string' && value.startsWith(UNVERIFIED_FLAG)
  
  let displayValue = value
  if (isUnverified) {
    displayValue = value.replace(UNVERIFIED_FLAG, "").trim()
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <span className="text-xs font-medium text-muted uppercase tracking-wider">{label}</span>}
      <div className="flex items-start gap-2">
        {isUnverified && (
          <Badge variant="warning" className="mt-0.5 shrink-0 whitespace-nowrap">
            Unverified
          </Badge>
        )}
        <span 
          className={`
            text-sm leading-relaxed
            ${isMissing ? "italic text-muted" : "text-brand-text"} 
            ${valueClassName}
          `}
        >
          {displayValue}
        </span>
      </div>
    </div>
  )
}

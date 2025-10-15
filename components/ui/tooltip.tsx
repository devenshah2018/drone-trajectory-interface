"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TooltipProps {
  children: React.ReactNode
  content: string
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}

export function Tooltip({ children, content, side = "top", className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  const tooltipClasses = cn(
    "absolute z-50 px-4 py-3 text-sm font-medium text-foreground bg-card border border-border rounded-lg shadow-lg opacity-0 invisible transition-all duration-200 backdrop-blur-sm",
    "max-w-sm w-80 leading-relaxed whitespace-normal",
    "before:absolute before:w-0 before:h-0 before:border-4 before:border-solid before:border-transparent",
    {
      "bottom-full left-1/2 transform -translate-x-1/2 mb-3 before:top-full before:left-1/2 before:-translate-x-1/2 before:border-t-border": side === "top",
      "top-full left-1/2 transform -translate-x-1/2 mt-3 before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-b-border": side === "bottom",
      "right-full top-1/2 transform -translate-y-1/2 mr-3 before:left-full before:top-1/2 before:-translate-y-1/2 before:border-l-border": side === "left",
      "left-full top-1/2 transform -translate-y-1/2 ml-3 before:right-full before:top-1/2 before:-translate-y-1/2 before:border-r-border": side === "right",
    },
    isVisible && "opacity-100 visible",
    className
  )

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        tabIndex={0}
        className="cursor-help"
      >
        {children}
      </div>
      <div className={tooltipClasses}>
        <div className="relative z-10">
          {content}
        </div>
      </div>
    </div>
  )
}

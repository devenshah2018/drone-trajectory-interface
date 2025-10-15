"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SpeedometerProps {
  currentSpeed: number
  maxSpeed?: number
  className?: string
}

export function Speedometer({ currentSpeed, maxSpeed = 20, className }: SpeedometerProps) {
  // Ensure speed is within bounds
  const speed = Math.max(0, Math.min(currentSpeed, maxSpeed))
  const speedPercentage = (speed / maxSpeed) * 100
  
  // Calculate needle angle (from -90° to 90°, covering 180° total)
  const needleAngle = -90 + (speedPercentage / 100) * 180
  
  // Generate tick marks for the speedometer
  const tickMarks = []
  for (let i = 0; i <= 10; i++) {
    const angle = -90 + (i / 10) * 180
    const isMainTick = i % 2 === 0
    const tickLength = isMainTick ? 15 : 8
    const tickWidth = isMainTick ? 2 : 1
    
    const x1 = 100 + (85 - tickLength) * Math.cos((angle * Math.PI) / 180)
    const y1 = 100 + (85 - tickLength) * Math.sin((angle * Math.PI) / 180)
    const x2 = 100 + 85 * Math.cos((angle * Math.PI) / 180)
    const y2 = 100 + 85 * Math.sin((angle * Math.PI) / 180)
    
    tickMarks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="currentColor"
        strokeWidth={tickWidth}
        className="text-muted-foreground"
      />
    )
    
    // Add speed labels for main ticks
    if (isMainTick) {
      const labelSpeed = (i / 10) * maxSpeed
      const labelX = 100 + 65 * Math.cos((angle * Math.PI) / 180)
      const labelY = 100 + 65 * Math.sin((angle * Math.PI) / 180)
      
      tickMarks.push(
        <text
          key={`label-${i}`}
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-muted-foreground font-mono"
        >
          {Math.round(labelSpeed)}
        </text>
      )
    }
  }
  
  return (
    <Card className={`border-border bg-card ${className || ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-center">Drone Speed</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        {/* Speedometer Gauge */}
        <div className="relative">
          <svg width="200" height="130" viewBox="0 0 200 130" className="overflow-visible">
            {/* Background arc */}
            <path
              d="M 15 100 A 85 85 0 0 1 185 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            
            {/* Speed arc */}
            <path
              d="M 15 100 A 85 85 0 0 1 185 100"
              fill="none"
              stroke="url(#speedGradient)"
              strokeWidth="8"
              strokeDasharray={`${(speedPercentage / 100) * 267.04} 267.04`}
              className="transition-all duration-300"
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className="stop-color-green-500" />
                <stop offset="50%" className="stop-color-yellow-500" />
                <stop offset="100%" className="stop-color-red-500" />
              </linearGradient>
            </defs>
            
            {/* Tick marks and labels */}
            {tickMarks}
            
            {/* Center dot */}
            <circle
              cx="100"
              cy="100"
              r="4"
              fill="currentColor"
              className="text-foreground"
            />
            
            {/* Needle */}
            <line
              x1="100"
              y1="100"
              x2={100 + 70 * Math.cos((needleAngle * Math.PI) / 180)}
              y2={100 + 70 * Math.sin((needleAngle * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="text-foreground transition-all duration-300"
            />
          </svg>
        </div>
        
        {/* Digital Speed Display */}
        <div className="text-center">
          <div className="text-3xl font-bold font-mono text-foreground">
            {speed.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">m/s</div>
        </div>
        
        {/* Speed Status */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${
            speed === 0 ? 'bg-gray-500' : 
            speed < maxSpeed * 0.3 ? 'bg-green-500' : 
            speed < maxSpeed * 0.7 ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-muted-foreground">
            {speed === 0 ? 'Stationary' : 
             speed < maxSpeed * 0.3 ? 'Low Speed' : 
             speed < maxSpeed * 0.7 ? 'Cruise Speed' : 'High Speed'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

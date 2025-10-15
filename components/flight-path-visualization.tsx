"use client"

import type { Waypoint } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square, RotateCcw } from "lucide-react"
import type { SimulationState } from "./flight-simulation-controller"

interface FlightPathVisualizationProps {
  waypoints: Waypoint[]
  simulationState?: SimulationState
  onStartSimulation?: () => void
  onPauseSimulation?: () => void
  onStopSimulation?: () => void
  onResetSimulation?: () => void
  className?: string
}

export function FlightPathVisualization({ 
  waypoints, 
  simulationState, 
  onStartSimulation,
  onPauseSimulation,
  onStopSimulation,
  onResetSimulation,
  className 
}: FlightPathVisualizationProps) {
  if (waypoints.length === 0) {
    return (
      <Card className={`border-border bg-card ${className || ""}`}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Flight Path Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">No flight plan generated</p>
              <p className="text-sm">Configure your mission parameters and click "Generate Flight Plan"</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate bounds for visualization
  const xs = waypoints.map((w) => w.x)
  const ys = waypoints.map((w) => w.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  const padding = 40
  const width = 800
  const height = 600

  // Scale points to fit in SVG
  const scaleX = (x: number) => ((x - minX) / rangeX) * (width - 2 * padding) + padding
  const scaleY = (y: number) => ((y - minY) / rangeY) * (height - 2 * padding) + padding

  // Speedometer component (inline for this visualization)
  const SpeedometerGauge = ({ speed, maxSpeed = 20 }: { speed: number; maxSpeed?: number }) => {
    const safeSpeed = Math.max(0, Math.min(speed, maxSpeed))
    const speedPercentage = (safeSpeed / maxSpeed) * 100
    const needleAngle = -90 + (speedPercentage / 100) * 180
    
    return (
      <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
        <div className="text-center mb-2">
          <h3 className="text-sm font-semibold text-foreground">Speed</h3>
        </div>
        <svg width="120" height="80" viewBox="0 0 200 120">
          {/* Speedometer arc */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          
          {/* Speed progress arc */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${(speedPercentage / 100) * 220} 220`}
            className="text-primary"
          />
          
          {/* Tick marks */}
          {Array.from({ length: 6 }, (_, i) => {
            const angle = -90 + (i / 5) * 180
            const isMainTick = i % 1 === 0
            const tickLength = isMainTick ? 12 : 8
            
            const x1 = 100 + (70 - tickLength) * Math.cos((angle * Math.PI) / 180)
            const y1 = 100 + (70 - tickLength) * Math.sin((angle * Math.PI) / 180)
            const x2 = 100 + 70 * Math.cos((angle * Math.PI) / 180)
            const y2 = 100 + 70 * Math.sin((angle * Math.PI) / 180)
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted-foreground"
              />
            )
          })}
          
          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2={100 + 60 * Math.cos((needleAngle * Math.PI) / 180)}
            y2={100 + 60 * Math.sin((needleAngle * Math.PI) / 180)}
            stroke="currentColor"
            strokeWidth="3"
            className="text-destructive"
          />
          
          {/* Center circle */}
          <circle
            cx="100"
            cy="100"
            r="4"
            fill="currentColor"
            className="text-destructive"
          />
          
          {/* Speed text */}
          <text
            x="100"
            y="115"
            textAnchor="middle"
            className="text-sm font-bold fill-foreground"
          >
            {safeSpeed.toFixed(1)} m/s
          </text>
        </svg>
      </div>
    )
  }

  return (
    <Card className={`border-border bg-card ${className || ""}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Flight Path Visualization</CardTitle>
        <p className="text-sm text-muted-foreground">{waypoints.length} waypoints in lawn-mower pattern</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Flight Controls and Speedometer */}
        {waypoints.length > 0 && (
          <div className="flex items-start justify-between gap-4 p-4 bg-muted/30 rounded-lg">
            {/* Left side: Flight Controls and Status */}
            <div className="flex flex-col gap-3">
              {/* Flight Control Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={onStartSimulation}
                  disabled={simulationState?.isRunning && !simulationState?.isPaused}
                  size="sm"
                  variant={simulationState?.isRunning && !simulationState?.isPaused ? "secondary" : "default"}
                  className="cursor-pointer"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {simulationState?.isRunning && !simulationState?.isPaused ? "Running" : "Start"}
                </Button>
                
                <Button
                  onClick={onPauseSimulation}
                  disabled={!simulationState?.isRunning || simulationState?.isPaused}
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </Button>
                
                <Button
                  onClick={onStopSimulation}
                  disabled={!simulationState?.isRunning}
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                >
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </Button>
                
                <Button
                  onClick={onResetSimulation}
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Flight Progress Metrics - Under buttons */}
              {simulationState?.isRunning && (
                <div className="flex items-center gap-6 text-md">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">Waypoint</p>
                    <p className="font-mono font-bold">
                      {simulationState.currentWaypointIndex + 1} / {waypoints.length}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">Progress</p>
                    <p className="font-mono font-bold">
                      {Math.round((simulationState.currentWaypointIndex / (waypoints.length - 1)) * 100)}%
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">Photos Taken</p>
                    <p className="font-mono font-bold text-green-600">
                      {simulationState.currentWaypointIndex + 1}
                    </p>
                  </div>
                </div>
              )}
              
              {!simulationState?.isRunning && (
                <div className="text-sm text-muted-foreground">
                  <p>{waypoints.length} waypoints loaded • Ready to simulate</p>
                </div>
              )}
            </div>

            {/* Right side: Speedometer */}
            {simulationState?.isRunning && (
              <SpeedometerGauge speed={simulationState.currentSpeed} />
            )}
          </div>
        )}

        <div className="w-full flex justify-center relative">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="bg-background/50 rounded-lg border max-w-full">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-muted/30"
                />
              </pattern>
            </defs>
            <rect width={width} height={height} fill="url(#grid)" />

            {/* Survey area boundary */}
            <rect
              x={padding}
              y={padding}
              width={width - 2 * padding}
              height={height - 2 * padding}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="text-muted-foreground/50"
            />

          {/* Flight path lines */}
          {waypoints.map((waypoint, i) => {
            if (i === waypoints.length - 1) return null
            const next = waypoints[i + 1]
            return (
              <line
                key={i}
                x1={scaleX(waypoint.x)}
                y1={scaleY(waypoint.y)}
                x2={scaleX(next.x)}
                y2={scaleY(next.y)}
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary"
              />
            )
          })}

          {/* Waypoint markers */}
          {waypoints.map((waypoint, i) => (
            <g key={i}>
              <circle
                cx={scaleX(waypoint.x)}
                cy={scaleY(waypoint.y)}
                r={i === 0 ? 6 : i === waypoints.length - 1 ? 6 : 3}
                fill="currentColor"
                className={i === 0 ? "text-accent" : i === waypoints.length - 1 ? "text-destructive" : "text-primary"}
              />
              {(i === 0 || i === waypoints.length - 1) && (
                <text
                  x={scaleX(waypoint.x)}
                  y={scaleY(waypoint.y) - 12}
                  textAnchor="middle"
                  className="text-xs fill-foreground font-mono"
                >
                  {i === 0 ? "START" : "END"}
                </text>
              )}
            </g>
          ))}

          {/* Drone Position - only show during simulation */}
          {simulationState?.isRunning && (
            <g>
              {/* Drone shadow/trail */}
              <circle
                cx={scaleX(simulationState.currentPosition.x)}
                cy={scaleY(simulationState.currentPosition.y)}
                r="12"
                fill="currentColor"
                className="text-primary/20"
              />
              {/* Drone body */}
              <circle
                cx={scaleX(simulationState.currentPosition.x)}
                cy={scaleY(simulationState.currentPosition.y)}
                r="8"
                fill="currentColor"
                className="text-orange-500"
                stroke="currentColor"
                strokeWidth="2"
              />
              {/* Drone center */}
              <circle
                cx={scaleX(simulationState.currentPosition.x)}
                cy={scaleY(simulationState.currentPosition.y)}
                r="3"
                fill="currentColor"
                className="text-orange-700"
              />
              {/* Drone propellers (rotating effect) */}
              <g className={simulationState.isPaused ? "" : "animate-spin"} 
                 style={{ transformOrigin: `${scaleX(simulationState.currentPosition.x)}px ${scaleY(simulationState.currentPosition.y)}px` }}>
                <line
                  x1={scaleX(simulationState.currentPosition.x) - 6}
                  y1={scaleY(simulationState.currentPosition.y) - 6}
                  x2={scaleX(simulationState.currentPosition.x) + 6}
                  y2={scaleY(simulationState.currentPosition.y) + 6}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-orange-600"
                />
                <line
                  x1={scaleX(simulationState.currentPosition.x) - 6}
                  y1={scaleY(simulationState.currentPosition.y) + 6}
                  x2={scaleX(simulationState.currentPosition.x) + 6}
                  y2={scaleY(simulationState.currentPosition.y) - 6}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-orange-600"
                />
              </g>
              {/* Drone label */}
              <text
                x={scaleX(simulationState.currentPosition.x)}
                y={scaleY(simulationState.currentPosition.y) - 20}
                textAnchor="middle"
                className="text-xs fill-foreground font-bold"
              >
                DRONE
              </text>
            </g>
          )}

          {/* Camera capture indicators - show when drone is taking photos */}
          {simulationState?.isRunning && waypoints.map((waypoint, i) => {
            const isCurrentOrPassed = i <= simulationState.currentWaypointIndex
            if (!isCurrentOrPassed) return null
            
            return (
              <g key={`camera-${i}`}>
                <circle
                  cx={scaleX(waypoint.x)}
                  cy={scaleY(waypoint.y)}
                  r="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  className="text-green-500/60"
                />
                <text
                  x={scaleX(waypoint.x)}
                  y={scaleY(waypoint.y) + 25}
                  textAnchor="middle"
                  className="text-xs fill-green-600 font-mono"
                >
                  📷
                </text>
              </g>
            )
          })}
        </svg>
        </div>
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span>Start Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Waypoints</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span>End Point</span>
          </div>
          {simulationState?.isRunning && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Drone Position</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

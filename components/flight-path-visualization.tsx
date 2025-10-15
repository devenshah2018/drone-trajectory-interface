"use client"

import type { Waypoint } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square, RotateCcw } from "lucide-react"
import type { SimulationState } from "./flight-simulation-controller"

/**
 * Props for FlightPathVisualization component.
 *
 * @param waypoints - Array of waypoints defining the flight path
 * @param simulationState - Optional live simulation state used for rendering drone position and progress
 * @param onStartSimulation - Optional callback to start the simulation
 * @param onPauseSimulation - Optional callback to pause the simulation
 * @param onStopSimulation - Optional callback to stop the simulation
 * @param onResetSimulation - Optional callback to reset the simulation
 * @param className - Optional additional className applied to the root card
 */
interface FlightPathVisualizationProps {
  waypoints: Waypoint[]
  simulationState?: SimulationState
  onStartSimulation?: () => void
  onPauseSimulation?: () => void
  onStopSimulation?: () => void
  onResetSimulation?: () => void
  className?: string
}

/**
 * Small inline speedometer used inside the visualization.
 *
 * @param props.speed - Current speed to display (m/s)
 * @param props.maxSpeed - Maximum gauge value
 * @param props.size - Visual size (px) of the gauge container
 * @returns A small SVG-based speed gauge element
 */
const SpeedometerGauge = ({
    speed,
    maxSpeed = 20,
    size = 140,
}: {
    speed: number
    maxSpeed?: number
    size?: number
}) => {
    const safeSpeed = Math.max(0, Math.min(speed, maxSpeed))
    const speedPercentage = maxSpeed > 0 ? safeSpeed / maxSpeed : 0

    // SVG sizing and geometry (kept in viewBox units for easy responsive scaling)
    const viewBoxWidth = 200
    const viewBoxHeight = 120
    const cx = 100
    const cy = 100
    const radius = 70
    const startAngle = -90
    const endAngle = 90
    const semicircumference = Math.PI * radius // length of semicircle arc

    const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
        const angleRad = ((angleDeg - 90) * Math.PI) / 180.0
        return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) }
    }

    const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(cx, cy, r, endAngle)
        const end = polarToCartesian(cx, cy, r, startAngle)
        const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1"
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
    }

    const arcPath = describeArc(cx, cy, radius, startAngle, endAngle)

    // Needle geometry
    const needleAngle = startAngle + speedPercentage * (endAngle - startAngle) // -90..90
    const needleLength = radius - 14

    // Ticks
    const majorTicks = 5
    const ticks = Array.from({ length: majorTicks + 1 }, (_, i) => {
        const t = i / majorTicks
        const angle = startAngle + t * (endAngle - startAngle)
        const outer = polarToCartesian(cx, cy, radius, angle)
        const inner = polarToCartesian(cx, cy, radius - (i % 1 === 0 ? 12 : 8), angle)
        return { angle, outer, inner, value: Math.round(t * maxSpeed) }
    })

    return (
        <div
            className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3"
            // allow the card layout to control sizing but prevent overflow
            style={{ width: size, maxWidth: "100%", boxSizing: "border-box", display: "inline-block" }}
            aria-hidden={false}
        >
            <div className="text-center mb-2">
                <h3 className="text-sm font-semibold text-foreground">Speed</h3>
            </div>

            {/* Make the SVG responsive: use width:100% and an appropriate aspect ratio */}
            <svg
                width="100%"
                height="auto"
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={`Current speed ${safeSpeed.toFixed(1)} meters per second`}
            >
                <title>Speedometer</title>

                {/* Background arc */}
                <path
                    d={arcPath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="text-muted-foreground/40"
                />

                {/* Progress arc (using semicircumference to compute dash lengths) */}
                <path
                    d={arcPath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${semicircumference * speedPercentage} ${semicircumference}`}
                    strokeDashoffset={0}
                    className="text-primary"
                    style={{ transition: "stroke-dasharray 280ms ease" }}
                />

                {/* Tick marks & labels */}
                {ticks.map((tick, i) => (
                    <g key={i}>
                        <line
                            x1={tick.inner.x}
                            y1={tick.inner.y}
                            x2={tick.outer.x}
                            y2={tick.outer.y}
                            stroke="currentColor"
                            strokeWidth={2}
                            className="text-muted-foreground"
                            strokeLinecap="round"
                        />
                        <text
                            x={polarToCartesian(cx, cy, radius + 16, tick.angle).x}
                            y={polarToCartesian(cx, cy, radius + 16, tick.angle).y + 4}
                            textAnchor="middle"
                            className="text-xs fill-foreground font-mono"
                        >
                            {tick.value}
                        </text>
                    </g>
                ))}

                {/* Needle (rotates around center) */}
                <g
                    transform={`rotate(${needleAngle} ${cx} ${cy})`}
                    style={{ transition: "transform 300ms cubic-bezier(.2,.9,.2,1)" }}
                >
                    <line
                        x1={cx}
                        y1={cy - 6}
                        x2={cx}
                        y2={cy - needleLength}
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="text-destructive"
                    />
                    <circle cx={cx} cy={cy} r={6} fill="currentColor" className="text-destructive" />
                </g>

                {/* Center cap */}
                <circle cx={cx} cy={cy} r={3} fill="currentColor" className="text-foreground" />

                {/* Speed numeric readout */}
                <text
                    x={cx}
                    y={cy + 20}
                    textAnchor="middle"
                    className="text-sm font-bold fill-foreground"
                    aria-live="polite"
                >
                    {safeSpeed.toFixed(1)} m/s
                </text>


            </svg>
        </div>
    )
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
  // If no waypoints, render an informative empty state
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

  // --- Calculate bounds for visualization ---
  // Extract coordinate ranges to compute scaling and padding
  const xs = waypoints.map((w) => w.x)
  const ys = waypoints.map((w) => w.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  // Prevent zero-range by defaulting to 1 when all points align
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  const padding = 40
  const width = 800
  const height = 600

  // Scale helper functions map world coordinates into SVG viewport
  const scaleX = (x: number) => ((x - minX) / rangeX) * (width - 2 * padding) + padding
  const scaleY = (y: number) => ((y - minY) / rangeY) * (height - 2 * padding) + padding

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
                <div className="grid grid-cols-4 gap-8 text-md">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">Mission Time</p>
                    <p className="font-mono font-bold text-lg">
                      {(() => {
                        const totalSeconds = Math.floor(simulationState.elapsedTime)
                        const hours = Math.floor(totalSeconds / 3600)
                        const minutes = Math.floor((totalSeconds % 3600) / 60)
                        const seconds = totalSeconds % 60
                        
                        if (hours > 0) {
                          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                        }
                        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                      })()}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {simulationState.isPaused ? (
                        <>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          <span className="text-xs text-muted-foreground">Paused</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs text-muted-foreground">Running</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">Waypoint</p>
                    <p className="font-mono font-bold">
                      {simulationState.currentWaypointIndex + 1} / {waypoints.length}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">Photos Taken</p>
                    <p className="font-mono font-bold text-green-600">
                      {simulationState.currentWaypointIndex + 1}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm mb-2">Mission Progress</p>
                    <div className="space-y-2">
                      <p className="font-mono font-bold">
                        {Math.round((simulationState.currentWaypointIndex / (waypoints.length - 1)) * 100)}%
                      </p>
                      <div className="w-full bg-muted rounded-full h-2 mx-auto">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${Math.round((simulationState.currentWaypointIndex / (waypoints.length - 1)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
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
                  className="text-green-600/60"
                />
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

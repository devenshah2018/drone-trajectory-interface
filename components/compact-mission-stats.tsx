"use client"

import type { MissionStats, Waypoint } from "@/lib/types"
import type { SimulationState } from "./flight-simulation-controller"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Clock, MapPin, Camera, Navigation } from "lucide-react"
import { useCallback, useRef, useEffect } from "react"

interface CompactMissionStatsProps {
  stats: MissionStats | null
  waypoints: Waypoint[]
  simulationState?: SimulationState
}

export function CompactMissionStats({ stats, waypoints, simulationState }: CompactMissionStatsProps) {
  const tableRef = useRef<HTMLDivElement>(null)
  const currentWaypointRef = useRef<HTMLDivElement>(null)

  const handleKeyNavigation = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!tableRef.current) return

    const focusableElements = tableRef.current.querySelectorAll('[tabindex="0"]')
    const currentIndex = Array.from(focusableElements).indexOf(event.target as HTMLElement)
    
    if (currentIndex === -1) return

    let nextIndex = currentIndex
    const columns = 4 // Number of columns in our table

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        nextIndex = Math.min(currentIndex + 1, focusableElements.length - 1)
        break
      case 'ArrowLeft':
        event.preventDefault()
        nextIndex = Math.max(currentIndex - 1, 0)
        break
      case 'ArrowDown':
        event.preventDefault()
        nextIndex = Math.min(currentIndex + columns, focusableElements.length - 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        nextIndex = Math.max(currentIndex - columns, 0)
        break
      case 'Home':
        event.preventDefault()
        const rowStart = Math.floor(currentIndex / columns) * columns
        nextIndex = rowStart
        break
      case 'End':
        event.preventDefault()
        const rowEnd = Math.floor(currentIndex / columns) * columns + (columns - 1)
        nextIndex = Math.min(rowEnd, focusableElements.length - 1)
        break
      default:
        return
    }

    const nextElement = focusableElements[nextIndex] as HTMLElement
    nextElement?.focus()
  }, [])

  // Auto-scroll to current waypoint during simulation
  useEffect(() => {
    if (simulationState?.isRunning && currentWaypointRef.current && tableRef.current) {
      const currentElement = currentWaypointRef.current
      const container = tableRef.current
      
      // Calculate if the current waypoint is visible
      const containerRect = container.getBoundingClientRect()
      const elementRect = currentElement.getBoundingClientRect()
      
      // Check if element is outside the visible area
      const isAboveViewport = elementRect.top < containerRect.top
      const isBelowViewport = elementRect.bottom > containerRect.bottom
      
      if (isAboveViewport || isBelowViewport) {
        // Smooth scroll to keep current waypoint in view
        currentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }
    }
  }, [simulationState?.currentWaypointIndex, simulationState?.isRunning])

  if (!stats) {
    return (
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold text-foreground">Mission Statistics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm font-medium mb-1">No Mission Data</p>
            <p className="text-xs">Generate a flight plan to see statistics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m ${secs}s`
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold text-foreground">Mission Statistics</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">Waypoints</p>
            </div>
            <p className="text-lg font-bold text-foreground">{stats.totalWaypoints}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">Duration</p>
            </div>
            <p className="text-lg font-bold text-foreground">{formatTime(stats.estimatedTime)}</p>
          </div>
        </div>

        {/* Distance & Coverage */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Flight Distance</span>
            <span className="text-lg font-bold text-foreground">{(stats.totalDistance / 1000).toFixed(1)} km</span>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Coverage Area</span>
            <span className="text-lg font-bold text-foreground">{(stats.coverageArea / 10000).toFixed(2)} ha</span>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Ground Sampling</span>
            <span className="text-lg font-bold text-foreground">{(stats.gsd * 100).toFixed(1)} cm/px</span>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Image Footprint</span>
            <span className="text-lg font-bold text-foreground">
              {stats.imageFootprint[0].toFixed(0)} × {stats.imageFootprint[1].toFixed(0)}m
            </span>
          </div>
        </div>

        {/* Waypoints Table */}
        {waypoints && waypoints.length > 0 && (
          <div className="space-y-4" role="region" aria-labelledby="waypoints-heading">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Navigation className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <h3 id="waypoints-heading" className="text-sm font-medium text-foreground">
                Waypoint Positions
              </h3>
            </div>
            <div 
              ref={tableRef}
              className="max-h-80 overflow-y-auto border border-border/50 [scrollbar-gutter:stable] rounded-lg focus-within:ring-2 focus-within:ring-primary/50"
              role="table"
              aria-label={`Flight path waypoints table with ${waypoints.length} waypoints`}
              aria-describedby="waypoints-description"
              onKeyDown={handleKeyNavigation}
            >
              <div 
                className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border/50 pr-3"
                role="rowgroup"
                aria-label="Table headers"
              >
                <div 
                  className="grid grid-cols-4 gap-2 p-3 text-xs font-medium text-muted-foreground"
                  role="row"
                >
                  <div role="columnheader" className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1">
                    Point
                  </div>
                  <div role="columnheader" className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1">
                    X (m)
                  </div>
                  <div role="columnheader" className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1">
                    Y (m)
                  </div>
                  <div role="columnheader" className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1">
                    Speed (m/s)
                  </div>
                </div>
              </div>
              <div 
                className="divide-y divide-border/30"
                role="rowgroup"
                aria-label="Table data"
              >
                {waypoints.map((waypoint, index) => {
                  // Determine waypoint status for highlighting
                  const isCurrent = simulationState?.isRunning && index === simulationState.currentWaypointIndex
                  const isCompleted = simulationState?.isRunning && index < simulationState.currentWaypointIndex
                  const isUpcoming = simulationState?.isRunning && index > simulationState.currentWaypointIndex
                  const isInactive = !simulationState?.isRunning
                  
                  // Create dynamic classes for row highlighting
                  let rowClasses = "grid grid-cols-4 gap-2 p-3 text-xs font-mono relative"
                  
                  if (isCurrent) {
                    // Current waypoint - green highlighting for arrived
                    rowClasses += " bg-emerald-50/60 dark:bg-emerald-950/25"
                    rowClasses += " border-l-3 border-emerald-500/70"
                    rowClasses += " ring-1 ring-emerald-200/40 ring-inset"
                  } else if (isCompleted) {
                    // Completed waypoints - gray with subtle highlighting
                    rowClasses += " bg-muted/50 dark:bg-muted/30"
                    rowClasses += " border-l-2 border-muted-foreground/40"
                    rowClasses += " opacity-80"
                  } else if (isUpcoming) {
                    // Upcoming waypoints - very subtle gray
                    rowClasses += " bg-muted/25 dark:bg-muted/15"
                    rowClasses += " border-l-1 border-muted-foreground/25"
                  } else if (isInactive) {
                    // Default state when simulation is not running
                    rowClasses += " hover:bg-muted/30 focus-within:bg-muted/40"
                  }
                  
                  return (
                    <div
                      key={index}
                      ref={isCurrent ? currentWaypointRef : undefined}
                      className={rowClasses}
                      role="row"
                      aria-rowindex={index + 1}
                      tabIndex={-1}
                      aria-label={isCurrent ? `Current waypoint ${index + 1}` : isCompleted ? `Completed waypoint ${index + 1}` : `Waypoint ${index + 1}`}
                    >
                      {/* Waypoint number cell with status indicator */}
                      <div 
                        role="cell"
                        className="text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1 flex items-center gap-2"
                        aria-label={`Waypoint ${index + 1}`}
                        tabIndex={0}
                      >
                        <span className="flex-shrink-0">#{index + 1}</span>
                        {/* Status indicator */}
                        {isCurrent && (
                          <div className="w-3 h-3 bg-emerald-500 rounded-sm flex items-center justify-center flex-shrink-0" 
                               aria-label="Current position - arrived">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {isCompleted && (
                          <div className="w-3 h-3 bg-muted-foreground/60 rounded-sm flex items-center justify-center flex-shrink-0" 
                               aria-label="Completed">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {isUpcoming && !isCurrent && (
                          <div className="w-2 h-2 bg-muted-foreground/30 rounded-full flex-shrink-0" 
                               aria-label="Upcoming" />
                        )}
                      </div>
                      
                      {/* X coordinate */}
                      <div 
                        role="cell"
                        className={`focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1 ${
                          isCurrent ? 'text-foreground font-semibold' : 
                          isCompleted ? 'text-muted-foreground/80' :
                          'text-foreground'
                        }`}
                        aria-label={`X coordinate: ${waypoint.x.toFixed(1)} meters`}
                        tabIndex={0}
                      >
                        {waypoint.x.toFixed(1)}
                      </div>
                      
                      {/* Y coordinate */}
                      <div 
                        role="cell"
                        className={`focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1 ${
                          isCurrent ? 'text-foreground font-semibold' : 
                          isCompleted ? 'text-muted-foreground/80' :
                          'text-foreground'
                        }`}
                        aria-label={`Y coordinate: ${waypoint.y.toFixed(1)} meters`}
                        tabIndex={0}
                      >
                        {waypoint.y.toFixed(1)}
                      </div>
                      
                      {/* Speed */}
                      <div 
                        role="cell"
                        className={`focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1 ${
                          isCurrent ? 'text-foreground font-semibold' : 
                          isCompleted ? 'text-muted-foreground/80' :
                          'text-foreground'
                        }`}
                        aria-label={`Flight speed: ${waypoint.speed.toFixed(1)} meters per second`}
                        tabIndex={0}
                      >
                        {waypoint.speed.toFixed(1)}
                      </div>
                      
                      {/* Enhanced highlighting overlay for current waypoint */}
                      {isCurrent && (
                        <>
                          <div className="absolute inset-0 bg-emerald-100/20 dark:bg-emerald-800/10 pointer-events-none rounded" />
                          {/* Progress indicator for current segment */}
                          {simulationState?.progress !== undefined && (
                            <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/70 rounded-b"
                                 style={{ width: `${(simulationState.progress * 100).toFixed(1)}%` }}
                                 aria-label={`${(simulationState.progress * 100).toFixed(1)}% progress to next waypoint`} />
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Legend for simulation highlighting */}
            {simulationState?.isRunning && (
              <div className="mt-4 p-3 bg-muted/20 rounded-lg border border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-foreground">Flight Progress</h4>
                  <div className="text-xs text-muted-foreground font-mono">
                    {simulationState.isPaused ? (
                      <span className="text-muted-foreground">⏸ Paused</span>
                    ) : (
                      <span className="text-primary">▶ Active</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm flex items-center justify-center">
                      <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">Current Position</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-muted-foreground/60 rounded-sm flex items-center justify-center">
                      <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                    <span className="text-muted-foreground">Upcoming</span>
                  </div>
                </div>
                {simulationState.currentWaypointIndex < waypoints.length && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <div className="text-xs text-muted-foreground">
                      Flying to waypoint {simulationState.currentWaypointIndex + 2}/{waypoints.length}
                      {simulationState.progress > 0 && (
                        <span className="ml-2">({(simulationState.progress * 100).toFixed(0)}% complete)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div 
              id="waypoints-description" 
              className="sr-only"
              aria-live="polite"
            >
              Table showing {waypoints.length} flight path waypoints with their coordinates and flight speeds.
              {simulationState?.isRunning ? 
                ` During simulation, waypoints are subtly highlighted: primary theme for current position, muted for completed, and subtle for upcoming waypoints.` :
                ''
              } Use Tab to enter the table, then arrow keys to navigate between cells. Use Home and End to jump to the beginning or end of each row.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

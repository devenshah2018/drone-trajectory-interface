"use client"

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import type { Waypoint } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, Square, RotateCcw } from "lucide-react"

export interface SimulationState {
  isRunning: boolean
  isPaused: boolean
  currentPosition: { x: number; y: number; z: number }
  currentSpeed: number
  currentWaypointIndex: number
  progress: number // 0-1 between current and next waypoint
  elapsedTime: number
  totalDistance: number
  distanceTraveled: number
}

export interface FlightSimulationRef {
  startSimulation: () => void
  pauseSimulation: () => void
  stopSimulation: () => void
  resetSimulation: () => void
}

interface FlightSimulationControllerProps {
  waypoints: Waypoint[]
  onSimulationUpdate: (state: SimulationState) => void
  className?: string
}

export const FlightSimulationController = forwardRef<FlightSimulationRef, FlightSimulationControllerProps>(({ 
  waypoints, 
  onSimulationUpdate, 
  className 
}, ref) => {
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: false,
    isPaused: false,
    currentPosition: { x: 0, y: 0, z: 0 },
    currentSpeed: 0,
    currentWaypointIndex: 0,
    progress: 0,
    elapsedTime: 0,
    totalDistance: 0,
    distanceTraveled: 0
  })

  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const isAnimatingRef = useRef<boolean>(false)

  // Calculate total distance
  const calculateTotalDistance = (waypoints: Waypoint[]): number => {
    let total = 0
    for (let i = 0; i < waypoints.length - 1; i++) {
      const dx = waypoints[i + 1].x - waypoints[i].x
      const dy = waypoints[i + 1].y - waypoints[i].y
      const dz = waypoints[i + 1].z - waypoints[i].z
      total += Math.sqrt(dx * dx + dy * dy + dz * dz)
    }
    return total
  }

  // Calculate distance between two waypoints
  const getDistance = (wp1: Waypoint, wp2: Waypoint): number => {
    const dx = wp2.x - wp1.x
    const dy = wp2.y - wp1.y
    const dz = wp2.z - wp1.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  // Interpolate between two waypoints
  const interpolatePosition = (wp1: Waypoint, wp2: Waypoint, progress: number) => {
    return {
      x: wp1.x + (wp2.x - wp1.x) * progress,
      y: wp1.y + (wp2.y - wp1.y) * progress,
      z: wp1.z + (wp2.z - wp1.z) * progress
    }
  }

  // Animation loop
  const animate = (currentTime: number) => {
    if (!isAnimatingRef.current) return

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = currentTime
      startTimeRef.current = currentTime
    }

    const deltaTime = (currentTime - lastTimeRef.current) / 1000 // Convert to seconds
    lastTimeRef.current = currentTime

    if (waypoints.length < 2) return

    setSimulationState(prevState => {
      if (!prevState.isRunning || prevState.isPaused) return prevState

      const currentWP = waypoints[prevState.currentWaypointIndex]
      const nextWPIndex = prevState.currentWaypointIndex + 1

      // Check if we've reached the end
      if (nextWPIndex >= waypoints.length) {
        isAnimatingRef.current = false
        return {
          ...prevState,
          isRunning: false,
          currentSpeed: 0,
          progress: 1
        }
      }

      const nextWP = waypoints[nextWPIndex]
      const segmentDistance = getDistance(currentWP, nextWP)
      const currentSpeed = Math.min(currentWP.speed, nextWP.speed) // Use minimum speed for safety
      
      // Calculate how much distance we cover in this frame
      const distanceThisFrame = currentSpeed * deltaTime
      const progressIncrement = segmentDistance > 0 ? distanceThisFrame / segmentDistance : 1

      let newProgress = prevState.progress + progressIncrement
      let newWaypointIndex = prevState.currentWaypointIndex
      let newDistanceTraveled = prevState.distanceTraveled + distanceThisFrame

      // Check if we've reached the next waypoint
      if (newProgress >= 1) {
        newProgress = 0
        newWaypointIndex = nextWPIndex
      }

      // Calculate current position
      const currentPosition = interpolatePosition(
        waypoints[newWaypointIndex],
        waypoints[Math.min(newWaypointIndex + 1, waypoints.length - 1)],
        newProgress
      )

      return {
        ...prevState,
        currentPosition,
        currentSpeed,
        currentWaypointIndex: newWaypointIndex,
        progress: newProgress,
        elapsedTime: (currentTime - startTimeRef.current) / 1000,
        distanceTraveled: newDistanceTraveled
      }
    })

    // Continue animation
    if (isAnimatingRef.current) {
      animationRef.current = requestAnimationFrame(animate)
    }
  }

  // Update parent component with simulation state
  useEffect(() => {
    onSimulationUpdate(simulationState)
  }, [simulationState, onSimulationUpdate])

  // Start simulation
  const startSimulation = () => {
    if (waypoints.length < 2) return

    const totalDistance = calculateTotalDistance(waypoints)
    
    // Reset timing references
    lastTimeRef.current = 0
    startTimeRef.current = 0
    isAnimatingRef.current = true

    setSimulationState({
      isRunning: true,
      isPaused: false,
      currentPosition: { x: waypoints[0].x, y: waypoints[0].y, z: waypoints[0].z },
      currentSpeed: waypoints[0].speed,
      currentWaypointIndex: 0,
      progress: 0,
      elapsedTime: 0,
      totalDistance,
      distanceTraveled: 0
    })

    // Start the animation loop
    animationRef.current = requestAnimationFrame(animate)
  }

  // Pause simulation
  const pauseSimulation = () => {
    setSimulationState(prev => ({ ...prev, isPaused: !prev.isPaused }))
    
    if (simulationState.isPaused) {
      // Resume animation
      isAnimatingRef.current = true
      animationRef.current = requestAnimationFrame(animate)
    } else {
      // Pause animation
      isAnimatingRef.current = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }

  // Stop simulation
  const stopSimulation = () => {
    isAnimatingRef.current = false
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setSimulationState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      currentSpeed: 0
    }))
  }

  // Reset simulation
  const resetSimulation = () => {
    isAnimatingRef.current = false
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    lastTimeRef.current = 0
    startTimeRef.current = 0
    
    setSimulationState({
      isRunning: false,
      isPaused: false,
      currentPosition: waypoints.length > 0 ? { x: waypoints[0].x, y: waypoints[0].y, z: waypoints[0].z } : { x: 0, y: 0, z: 0 },
      currentSpeed: 0,
      currentWaypointIndex: 0,
      progress: 0,
      elapsedTime: 0,
      totalDistance: calculateTotalDistance(waypoints),
      distanceTraveled: 0
    })
  }

  // Expose control functions via ref
  useImperativeHandle(ref, () => ({
    startSimulation,
    pauseSimulation,
    stopSimulation,
    resetSimulation
  }), [])

  // Expose control functions via ref
  useImperativeHandle(ref, () => ({
    startSimulation,
    pauseSimulation,
    stopSimulation,
    resetSimulation
  }), [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Reset when waypoints change
  useEffect(() => {
    resetSimulation()
  }, [waypoints])

  const canSimulate = waypoints.length >= 2

  return (
    <Card className={`border-border bg-card ${className || ""}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Flight Simulation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={startSimulation}
            disabled={!canSimulate || simulationState.isRunning}
            className="flex items-center gap-2"
            variant={simulationState.isRunning ? "secondary" : "default"}
          >
            <Play className="w-4 h-4" />
            Start
          </Button>
          
          <Button
            onClick={pauseSimulation}
            disabled={!simulationState.isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Pause className="w-4 h-4" />
            {simulationState.isPaused ? "Resume" : "Pause"}
          </Button>
          
          <Button
            onClick={stopSimulation}
            disabled={!simulationState.isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>
          
          <Button
            onClick={resetSimulation}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        {/* Simulation Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Elapsed Time:</span>
            <div className="font-mono font-medium">
              {Math.floor(simulationState.elapsedTime / 60)}:{(simulationState.elapsedTime % 60).toFixed(1).padStart(4, '0')}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Progress:</span>
            <div className="font-mono font-medium">
              {simulationState.totalDistance > 0 
                ? ((simulationState.distanceTraveled / simulationState.totalDistance) * 100).toFixed(1)
                : 0}%
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Distance:</span>
            <div className="font-mono font-medium">
              {simulationState.distanceTraveled.toFixed(1)}m / {simulationState.totalDistance.toFixed(1)}m
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Waypoint:</span>
            <div className="font-mono font-medium">
              {simulationState.currentWaypointIndex + 1} / {waypoints.length}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Mission Progress</span>
            <span>{simulationState.totalDistance > 0 
              ? ((simulationState.distanceTraveled / simulationState.totalDistance) * 100).toFixed(1)
              : 0}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${simulationState.totalDistance > 0 
                  ? (simulationState.distanceTraveled / simulationState.totalDistance) * 100 
                  : 0}%` 
              }}
            />
          </div>
        </div>

        {!canSimulate && (
          <div className="text-center text-muted-foreground text-sm p-4 bg-muted/30 rounded-lg">
            Generate a flight plan with at least 2 waypoints to start simulation
          </div>
        )}
      </CardContent>
    </Card>
  )
})

FlightSimulationController.displayName = "FlightSimulationController"

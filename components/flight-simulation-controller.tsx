"use client";

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { Waypoint } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Square, RotateCcw } from "lucide-react";

/**
 * Live simulation state representing the drone's runtime status.
 *
 * @remarks
 * Holds flags for running/paused state, current 3D position, speed, waypoint
 * progress, elapsed time and distance metrics used by the UI and visualizers.
 */
export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentPosition: { x: number; y: number; z: number };
  currentSpeed: number;
  currentWaypointIndex: number;
  progress: number; // 0-1 between current and next waypoint
  elapsedTime: number;
  totalDistance: number;
  distanceTraveled: number;
}

/**
 * Imperative API exposed by the simulation controller to parent components.
 */
export interface FlightSimulationRef {
  startSimulation: () => void;
  pauseSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
}

interface FlightSimulationControllerProps {
  waypoints: Waypoint[];
  onSimulationUpdate: (state: SimulationState) => void;
  className?: string;
}

export const FlightSimulationController = forwardRef<
  FlightSimulationRef,
  FlightSimulationControllerProps
>(({ waypoints, onSimulationUpdate, className }, ref) => {
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: false,
    isPaused: false,
    currentPosition: { x: 0, y: 0, z: 0 },
    currentSpeed: 0,
    currentWaypointIndex: 0,
    progress: 0,
    elapsedTime: 0,
    totalDistance: 0,
    distanceTraveled: 0,
  });

  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const isRunningRef = useRef<boolean>(false);

  // Calculate total distance of the waypoint path.
  const calculateTotalDistance = (waypoints: Waypoint[]): number => {
    // Sum Euclidean distances between consecutive waypoints
    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const dx = waypoints[i + 1].x - waypoints[i].x;
      const dy = waypoints[i + 1].y - waypoints[i].y;
      const dz = waypoints[i + 1].z - waypoints[i].z;
      total += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return total;
  };

  // Compute distance between two waypoints.
  const getDistance = (wp1: Waypoint, wp2: Waypoint): number => {
    const dx = wp2.x - wp1.x;
    const dy = wp2.y - wp1.y;
    const dz = wp2.z - wp1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  // Linear interpolation between two 3D waypoints.
  const interpolatePosition = (wp1: Waypoint, wp2: Waypoint, progress: number) => {
    return {
      x: wp1.x + (wp2.x - wp1.x) * progress,
      y: wp1.y + (wp2.y - wp1.y) * progress,
      z: wp1.z + (wp2.z - wp1.z) * progress,
    };
  };

  /**
   * Core animation loop driven by requestAnimationFrame.
   *
   * @param currentTime - High-resolution timestamp provided by RAF
   * @remarks Uses refs to avoid re-subscribing on every render and updates
   * the simulation state in-place to minimize React render churn.
   */
  const animate = (currentTime: number) => {
    // Bail out quickly if animation is stopped
    if (!isAnimatingRef.current) return;

    // Initialize timing on first frame
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = currentTime;
      startTimeRef.current = currentTime;
    }

    // Compute frame delta in seconds
    const deltaTime = (currentTime - lastTimeRef.current) / 1000;
    lastTimeRef.current = currentTime;

    if (waypoints.length < 2) return;

    // Update simulation state with a functional setState to avoid stale closures
    setSimulationState((prevState) => {
      // Respect running/paused flags
      if (!prevState.isRunning || prevState.isPaused) return prevState;

      const currentWP = waypoints[prevState.currentWaypointIndex];
      const nextWPIndex = prevState.currentWaypointIndex + 1;

      // If at end of the path, stop animation and mark progress complete
      if (nextWPIndex >= waypoints.length) {
        isAnimatingRef.current = false;
        return {
          ...prevState,
          isRunning: false,
          currentSpeed: 0,
          progress: 1,
        };
      }

      const nextWP = waypoints[nextWPIndex];
      const segmentDistance = getDistance(currentWP, nextWP);

      // Use safe speed (min of segment endpoints) to avoid unrealistic jumps
      const currentSpeed = Math.min(currentWP.speed, nextWP.speed);

      // Distance covered this frame (meters)
      const distanceThisFrame = currentSpeed * deltaTime;
      const progressIncrement = segmentDistance > 0 ? distanceThisFrame / segmentDistance : 1;

      let newProgress = prevState.progress + progressIncrement;
      let newWaypointIndex = prevState.currentWaypointIndex;
      let newDistanceTraveled = prevState.distanceTraveled + distanceThisFrame;

      // When segment completes, advance waypoint index and reset progress
      if (newProgress >= 1) {
        newProgress = 0;
        newWaypointIndex = nextWPIndex;
      }

      // Compute interpolated position along active segment
      const currentPosition = interpolatePosition(
        waypoints[newWaypointIndex],
        waypoints[Math.min(newWaypointIndex + 1, waypoints.length - 1)],
        newProgress
      );

      return {
        ...prevState,
        currentPosition,
        currentSpeed,
        currentWaypointIndex: newWaypointIndex,
        progress: newProgress,
        elapsedTime: (currentTime - startTimeRef.current) / 1000,
        distanceTraveled: newDistanceTraveled,
      };
    });

    // Queue next frame if animation still active
    if (isAnimatingRef.current) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  // Update parent component whenever simulation state changes
  useEffect(() => {
    onSimulationUpdate(simulationState);
  }, [simulationState, onSimulationUpdate]);

  /**
   * Start or resume the simulation.
   *
   * @remarks If the simulation is paused, this resumes from current state.
   * If not running, starts from the first waypoint and resets timing.
   */
  const startSimulation = () => {
    if (waypoints.length < 2) return;

    const totalDistance = calculateTotalDistance(waypoints);

    // If currently paused, resume without resetting position or progress
    if (isRunningRef.current && isPausedRef.current) {
      console.log("Resuming from pause - keeping position:", simulationState.currentPosition);
      // Resume timing references but keep elapsed time intact
      lastTimeRef.current = 0;
      isAnimatingRef.current = true;
      isPausedRef.current = false;
      setSimulationState((prev) => ({ ...prev, isPaused: false }));
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    console.log("Starting fresh simulation");

    // Start a fresh simulation run
    lastTimeRef.current = 0;
    startTimeRef.current = 0;
    isAnimatingRef.current = true;
    isRunningRef.current = true;
    isPausedRef.current = false;

    setSimulationState({
      isRunning: true,
      isPaused: false,
      currentPosition: { x: waypoints[0].x, y: waypoints[0].y, z: waypoints[0].z },
      currentSpeed: waypoints[0].speed,
      currentWaypointIndex: 0,
      progress: 0,
      elapsedTime: 0,
      totalDistance,
      distanceTraveled: 0,
    });

    // Kick off the animation
    animationRef.current = requestAnimationFrame(animate);
  };

  /**
   * Pause the simulation. The animation loop is stopped but the current state
   * is preserved so it can be resumed via startSimulation.
   */
  const pauseSimulation = () => {
    // Only pause if currently running and not already paused
    if (!isRunningRef.current || isPausedRef.current) {
      return;
    }
    
    // Set paused flag
    isPausedRef.current = true;
    setSimulationState((prev) => ({ ...prev, isPaused: true }));

    // Stop animation frames
    isAnimatingRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  /**
   * Stop the simulation and clear the running/paused flags. State remains so
   * UI can show the last position if desired.
   */
  const stopSimulation = () => {
    isAnimatingRef.current = false;
    isRunningRef.current = false;
    isPausedRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setSimulationState((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      currentSpeed: 0,
    }));
  };

  /**
   * Reset the simulation state to defaults using the first waypoint as origin.
   * @returns void
   */
  const resetSimulation = () => {
    isAnimatingRef.current = false;
    isRunningRef.current = false;
    isPausedRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    lastTimeRef.current = 0;
    startTimeRef.current = 0;

    setSimulationState({
      isRunning: false,
      isPaused: false,
      currentPosition:
        waypoints.length > 0
          ? { x: waypoints[0].x, y: waypoints[0].y, z: waypoints[0].z }
          : { x: 0, y: 0, z: 0 },
      currentSpeed: 0,
      currentWaypointIndex: 0,
      progress: 0,
      elapsedTime: 0,
      totalDistance: calculateTotalDistance(waypoints),
      distanceTraveled: 0,
    });
  };

  // Expose control functions via ref
  useImperativeHandle(
    ref,
    () => ({
      startSimulation,
      pauseSimulation,
      stopSimulation,
      resetSimulation,
    }),
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Reset when waypoints change
  useEffect(() => {
    resetSimulation();
  }, [waypoints]);

  const canSimulate = waypoints.length >= 2;

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
            disabled={!canSimulate || (simulationState.isRunning && !simulationState.isPaused)}
            className="flex items-center gap-2"
            variant={simulationState.isRunning && !simulationState.isPaused ? "secondary" : "default"}
          >
            <Play className="h-4 w-4" />
            {simulationState.isPaused ? "Resume" : "Start"}
          </Button>

          <Button
            onClick={pauseSimulation}
            disabled={!simulationState.isRunning || simulationState.isPaused}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Pause className="h-4 w-4" />
            Pause
          </Button>

          <Button
            onClick={stopSimulation}
            disabled={!simulationState.isRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Stop
          </Button>

          <Button onClick={resetSimulation} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Simulation Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Elapsed Time:</span>
            <div className="font-mono font-medium">
              {Math.floor(simulationState.elapsedTime / 60)}:
              {(simulationState.elapsedTime % 60).toFixed(1).padStart(4, "0")}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Progress:</span>
            <div className="font-mono font-medium">
              {simulationState.totalDistance > 0
                ? (
                    (simulationState.distanceTraveled / simulationState.totalDistance) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Distance:</span>
            <div className="font-mono font-medium">
              {simulationState.distanceTraveled.toFixed(1)}m /{" "}
              {simulationState.totalDistance.toFixed(1)}m
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
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>Mission Progress</span>
            <span>
              {simulationState.totalDistance > 0
                ? (
                    (simulationState.distanceTraveled / simulationState.totalDistance) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </span>
          </div>
          <div className="bg-muted h-2 w-full rounded-full">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  simulationState.totalDistance > 0
                    ? (simulationState.distanceTraveled / simulationState.totalDistance) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {!canSimulate && (
          <div className="text-muted-foreground bg-muted/30 rounded-lg p-4 text-center text-sm">
            Generate a flight plan with at least 2 waypoints to start simulation
          </div>
        )}
      </CardContent>
    </Card>
  );
});

FlightSimulationController.displayName = "FlightSimulationController";

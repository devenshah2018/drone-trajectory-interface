"use client";

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { Waypoint } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { computePlanTime } from "@/lib/flight-planner";

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
  currentWaypointIndex: number; // index of the waypoint the drone is at or heading from
  currentSegmentIndex: number; // index of the active segment between waypoints (i -> i+1)
  progress: number; // 0-1 between current and next waypoint (segment progress)
  segmentElapsedTime: number; // seconds into the active segment
  segments?: Record<string, any>[]; // segment profiles computed for UI and simulation
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
  // Optional drone kinematic limits
  droneConfig?: { vMax?: number; aMax?: number };
}

export const FlightSimulationController = forwardRef<
  FlightSimulationRef,
  FlightSimulationControllerProps
>(({ waypoints, onSimulationUpdate, className, droneConfig }, ref) => {
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: false,
    isPaused: false,
    currentPosition: { x: 0, y: 0, z: 0 },
    currentSpeed: 0,
    currentWaypointIndex: 0,
    currentSegmentIndex: 0,
    progress: 0,
    segmentElapsedTime: 0,
    elapsedTime: 0,
    totalDistance: 0,
    distanceTraveled: 0,
  });

  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0); // Track when pause started
  const isAnimatingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const isRunningRef = useRef<boolean>(false);

  // Keep segment profiles and distances in refs for fast access in RAF loop
  const segmentsRef = useRef<Record<string, any>[]>([]);
  const segmentDistancesRef = useRef<number[]>([]);
  const segmentElapsedRef = useRef<number>(0);
  const prevSpeedRef = useRef<number>(0);

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

  // Prepare segments (profiles and distances) when waypoints change
  useEffect(() => {
    if (!waypoints || waypoints.length < 2) {
      segmentsRef.current = [];
      segmentDistancesRef.current = [];
      return;
    }

    // Use waypoint positions to compute profiles; vPhoto is taken from first waypoint speed
    const positions = waypoints.map((w) => [w.x, w.y, w.z]);
    const vPhotoBase = waypoints[0]?.speed ?? 0;
    // If a drone vMax is configured, use it as an upper bound for both starting speed
    // and cruise speed passed into the planner. Otherwise use waypoint speed as vPhoto.
    const vMax = typeof droneConfig?.vMax === 'number' ? droneConfig.vMax : 16.0;
    const vPhoto = typeof droneConfig?.vMax === 'number' ? Math.min(vPhotoBase, droneConfig.vMax) : vPhotoBase;
    const aMax = droneConfig?.aMax ?? 3.5;

    // computePlanTime signature: (positions, vPhoto, exposureTimeS, vMax, aMax)
    const [totalTime, segments] = computePlanTime(positions, vPhoto, 0.0, vMax, aMax);

    segmentsRef.current = segments;
    segmentDistancesRef.current = segments.map((s) => Number(s.distance) || 0);

    // Attach segments into the public simulation state so UI can render them
    setSimulationState((prev) => ({ ...prev, segments }));
  }, [waypoints, droneConfig]);

  // Compute distance between two waypoints.
  const getDistance = (wp1: Waypoint, wp2: Waypoint): number => {
    const dx = wp2.x - wp1.x;
    const dy = wp2.y - wp1.y;
    const dz = wp2.z - wp1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  const getInstantaneousSpeedForProfile = (
    profile: Record<string, any>,
    t: number,
    vPhoto: number,
    aMax: number
  ) => {
    if (!profile || profile.type === "degenerate") return vPhoto;

    if (profile.type === "triangular" || profile.type === "triangular_fallback") {
      const vPeak = Number(profile.v_peak || 0);
      const tAcc = Number(profile.t_acc || 0);
      if (t <= 0) return vPhoto;
      if (t < tAcc) return vPhoto + aMax * t;
      // decel phase
      const tDec = t - tAcc;
      return Math.max(0, vPeak - aMax * tDec);
    }

    if (profile.type === "trapezoidal") {
      const vCruise = Number(profile.v_cruise || vPhoto);
      const tAcc = Number(profile.t_acc || 0);
      const tCruise = Number(profile.t_cruise || 0);
      if (t <= 0) return vPhoto;
      if (t < tAcc) return vPhoto + aMax * t;
      if (t < tAcc + tCruise) return vCruise;
      const tDec = t - tAcc - tCruise;
      return Math.max(0, vCruise - aMax * tDec);
    }

    return vPhoto;
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
      prevSpeedRef.current = simulationState.currentSpeed || 0;
    }

    // Compute frame delta in seconds
    const deltaTime = (currentTime - lastTimeRef.current) / 1000;
    lastTimeRef.current = currentTime;

    if (waypoints.length < 2) return;

    // Update simulation state with a functional setState to avoid stale closures
    setSimulationState((prevState) => {
      // Respect running/paused flags
      if (!prevState.isRunning || prevState.isPaused) return prevState;

      const wpIndex = prevState.currentWaypointIndex;
      const segIndex = prevState.currentSegmentIndex >= 0 ? prevState.currentSegmentIndex : wpIndex;

      // If at end of the path, stop animation and mark progress complete
      if (wpIndex >= waypoints.length - 1) {
        isAnimatingRef.current = false;
        return {
          ...prevState,
          isRunning: false,
          currentSpeed: 0,
          progress: 1,
        };
      }

      const currentWP = waypoints[wpIndex];
      const nextWP = waypoints[wpIndex + 1];
      const segmentDistance = segmentDistancesRef.current[segIndex] ?? getDistance(currentWP, nextWP);

      // Get profile for active segment
      const profile = segmentsRef.current[segIndex] || { type: "degenerate" };
      // Respect drone-configured vMax for the instantaneous profile calculation. Use the
      // waypoint's nominal speed but clamp to droneConfig.vMax when present so the
      // starting speed used in profile interpolation doesn't exceed the selected limit.
      const vPhoto = typeof droneConfig?.vMax === 'number' ? Math.min(currentWP.speed, droneConfig.vMax) : currentWP.speed;

      // Advance segment elapsed time
      const newSegmentElapsed = (prevState.segmentElapsedTime ?? 0) + deltaTime;

      // Compute instantaneous speed at segment time t (s)
      const aMaxUsed = typeof profile?.a_max === 'number' ? profile.a_max : (droneConfig?.aMax ?? 3.5);
      let instSpeed = getInstantaneousSpeedForProfile(profile.profile ?? profile, newSegmentElapsed, vPhoto, aMaxUsed);
      // Never exceed configured drone vMax if present
      if (typeof droneConfig?.vMax === 'number') instSpeed = Math.min(instSpeed, droneConfig.vMax);

      // Approximate distance covered this frame using trapezoidal integration of speeds
      const prevSpeed = prevSpeedRef.current ?? instSpeed;
      const avgSpeed = (prevSpeed + instSpeed) / 2;
      const distanceThisFrame = avgSpeed * deltaTime;
      prevSpeedRef.current = instSpeed;

      // Progress increment along segment
      const progressIncrement = segmentDistance > 0 ? distanceThisFrame / segmentDistance : 1;

      let newProgress = prevState.progress + progressIncrement;
      let newWaypointIndex = prevState.currentWaypointIndex;
      let newSegmentIndex = segIndex;
      let newDistanceTraveled = prevState.distanceTraveled + distanceThisFrame;
      let resetSegmentElapsed = newSegmentElapsed;

      // When segment completes, advance waypoint index and reset segment elapsed
      if (newProgress >= 1) {
        // Carry over leftover time into the next segment
        const overflow = (newProgress - 1) * segmentDistance; // meters overflow
        newProgress = 0;
        newWaypointIndex = wpIndex + 1;
        newSegmentIndex = newWaypointIndex; // next segment corresponds to arrival index
        resetSegmentElapsed = 0;
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
        currentSpeed: instSpeed,
        currentWaypointIndex: newWaypointIndex,
        currentSegmentIndex: newSegmentIndex,
        progress: newProgress,
        segmentElapsedTime: resetSegmentElapsed,
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
    const maxWaypoints = 1000;
    if (waypoints.length < 2 || waypoints.length > maxWaypoints) {
      // Prevent starting simulation if there are too few or too many waypoints.
      console.warn(`Simulation cannot start: waypoints=${waypoints.length} (allowed 2..${maxWaypoints})`);
      return;
    }

    const totalDistance = calculateTotalDistance(waypoints);

    // If currently paused, resume without resetting position or progress
    if (isRunningRef.current && isPausedRef.current) {
      console.log("Resuming from pause - keeping position:", simulationState.currentPosition);
      
      // Calculate how long we were paused and adjust startTimeRef to account for it
      const pauseDuration = performance.now() - pauseTimeRef.current;
      startTimeRef.current += pauseDuration;
      
      // Resume timing: reset lastTimeRef so deltaTime calculation starts fresh
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
      currentSpeed: typeof droneConfig?.vMax === 'number' ? Math.min(waypoints[0].speed, droneConfig.vMax) : waypoints[0].speed,
      currentWaypointIndex: 0,
      currentSegmentIndex: 0,
      progress: 0,
      segmentElapsedTime: 0,
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
    
    // Record the pause time so we can adjust startTimeRef on resume
    pauseTimeRef.current = performance.now();
    
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
      currentSegmentIndex: 0,
      progress: 0,
      segmentElapsedTime: 0,
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

  const WAYPOINT_LIMIT = 1000; // single canonical limit
  const canSimulate = waypoints.length >= 2 && waypoints.length <= WAYPOINT_LIMIT;
  const isTooManyWaypoints = waypoints.length > WAYPOINT_LIMIT;
  console.log("FlightSimulationController render - waypoints:", waypoints.length, "canSimulate:", canSimulate);

  // Defensive early return: if we detect too many waypoints, render only the disclaimer
  if (isTooManyWaypoints) {
    console.warn(`FlightSimulationController: rendering disclaimer - waypoints=${waypoints.length} exceeds limit=${WAYPOINT_LIMIT}`);
    return (
      <Card className={`border-border bg-card ${className || ""}`}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Flight Simulation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Debug badge: visible indicator of what this component sees (helps diagnose visibility mismatches) */}
          <div className="text-xs text-muted-foreground mb-2" data-testid="flight-sim-debug">
            Debug: waypoints={waypoints.length} • limit={WAYPOINT_LIMIT} • canSimulate={String(canSimulate)} • tooMany={String(isTooManyWaypoints)}
          </div>

          <div className="w-full rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1 text-yellow-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M10.29 3.86L1.82 18a1 1 0 0 0 .87 1.5h18.62a1 1 0 0 0 .87-1.5L13.71 3.86a1 1 0 0 0-1.42 0z" fill="currentColor" />
                  <rect x="11" y="8" width="2" height="6" fill="white" />
                  <rect x="11" y="15" width="2" height="2" fill="white" />
                </svg>
              </div>
              <div>
                <div className="text-foreground font-semibold">Simulation disabled for large plans</div>
                <p className="text-muted-foreground text-sm mt-1">
                  This flight plan contains <span className="font-medium">{waypoints.length}</span> waypoints, which exceeds the simulation limit of <span className="font-medium">{WAYPOINT_LIMIT}</span>.
                  Running a browser-based simulation with very large waypoint counts may cause performance problems.
                </p>
                <p className="text-muted-foreground text-sm mt-2">Reduce the number of waypoints or run an offline simulation tool for large-scale plans.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-border bg-card ${className || ""}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Flight Simulation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Debug badge: visible indicator of what this component sees (helps diagnose visibility mismatches) */}
        <div className="text-xs text-muted-foreground mb-2" data-testid="flight-sim-debug">
          Debug: waypoints={waypoints.length} • limit={WAYPOINT_LIMIT} • canSimulate={String(canSimulate)} • tooMany={String(isTooManyWaypoints)}
        </div>

        {/* Control Buttons */}
        { !isTooManyWaypoints ? (
          <div className="w-full" data-controls-visible="true">
            {/* Mobile: 2x2-ish simplified controls (Start | Pause on first row, Reset full-width second row). Hide Stop on mobile. */}
            <div className="md:hidden">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={startSimulation}
                  disabled={isTooManyWaypoints || !canSimulate || (simulationState.isRunning && !simulationState.isPaused)}
                  className="h-12 w-full text-center flex items-center justify-center gap-2"
                  variant={simulationState.isRunning && !simulationState.isPaused ? "secondary" : "default"}
                >
                  <Play className="h-5 w-5" />
                  <span className="font-medium">{simulationState.isPaused ? "Resume" : "Start"}</span>
                </Button>

                <Button
                  onClick={pauseSimulation}
                  disabled={!simulationState.isRunning || simulationState.isPaused}
                  variant="outline"
                  className="h-12 w-full text-center flex items-center justify-center gap-2"
                >
                  <Pause className="h-5 w-5" />
                  <span className="font-medium">Pause</span>
                </Button>
              </div>

              <div className="mt-2">
                <Button
                  onClick={resetSimulation}
                  variant="outline"
                  className="h-12 w-full text-center flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span className="font-medium">Reset</span>
                </Button>
              </div>
            </div>

            {/* Desktop / tablet: full control set in a row (Start, Pause, Stop, Reset) */}
            <div className="hidden md:flex md:items-center md:gap-3">
              <Button
                onClick={startSimulation}
                disabled={isTooManyWaypoints || !canSimulate || (simulationState.isRunning && !simulationState.isPaused)}
                className="md:w-auto flex items-center justify-center gap-2"
                variant={simulationState.isRunning && !simulationState.isPaused ? "secondary" : "default"}
              >
                <Play className="h-4 w-4" />
                {simulationState.isPaused ? "Resume" : "Start"}
              </Button>

              <Button
                onClick={pauseSimulation}
                disabled={!simulationState.isRunning || simulationState.isPaused}
                variant="outline"
                className="md:w-auto flex items-center justify-center gap-2"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>

              <Button
                onClick={stopSimulation}
                disabled={!simulationState.isRunning}
                variant="outline"
                className="md:w-auto flex items-center justify-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>

              <Button onClick={resetSimulation} variant="outline" className="md:w-auto flex items-center justify-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1 text-yellow-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M10.29 3.86L1.82 18a1 1 0 0 0 .87 1.5h18.62a1 1 0 0 0 .87-1.5L13.71 3.86a1 1 0 0 0-1.42 0z" fill="currentColor" />
                  <rect x="11" y="8" width="2" height="6" fill="white" />
                  <rect x="11" y="15" width="2" height="2" fill="white" />
                </svg>
              </div>
              <div>
                <div className="text-foreground font-semibold">Simulation disabled for large plans</div>
                <p className="text-muted-foreground text-sm mt-1">
                  This flight plan contains <span className="font-medium">{waypoints.length}</span> waypoints, which exceeds the simulation limit of <span className="font-medium">{WAYPOINT_LIMIT}</span>.
                  Running a browser-based simulation with very large waypoint counts may cause performance problems.
                </p>
                <p className="text-muted-foreground text-sm mt-2">Reduce the number of waypoints or run an offline simulation tool for large-scale plans.</p>
              </div>
            </div>
          </div>
        )}

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

        {!canSimulate && waypoints.length < 2 && (
          <div className="text-muted-foreground bg-muted/30 rounded-lg p-4 text-center text-sm">
            Generate a flight plan with at least 2 waypoints to start simulation
          </div>
        )}
      </CardContent>
    </Card>
  );
});

FlightSimulationController.displayName = "FlightSimulationController";

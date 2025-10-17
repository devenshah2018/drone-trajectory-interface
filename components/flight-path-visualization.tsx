"use client";

import type { Waypoint } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import type { SimulationState } from "./flight-simulation-controller";
import type { MissionStats } from "@/lib/types";

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
  waypoints: Waypoint[];
  simulationState?: SimulationState;
  missionStats?: MissionStats;
  onStartSimulation?: () => void;
  onPauseSimulation?: () => void;
  onStopSimulation?: () => void;
  onResetSimulation?: () => void;
  className?: string;
}

/**
 * Small inline speedometer used inside the visualization.
 *
 * @param props.speed - Current speed to display (m/s)
 * @param props.size - Visual size (px) of the gauge container
 * @returns A small numeric-based speed gauge element
 */
const SpeedometerGauge = ({
  speed,
  size = 140,
}: {
  speed: number;
  size?: number;
}) => {

  // Simplified numeric readout (replaces the previous SVG-based gauge)
  return (
    <div
      className="bg-card/90 border-border rounded-lg border p-3 backdrop-blur-sm"
      style={{ width: size, maxWidth: "100%", boxSizing: "border-box", display: "inline-block" }}
      aria-hidden={false}
      role="status"
      aria-label={`Current speed ${speed.toFixed(1)} meters per second`}
    >
      <div className="mb-2 text-center">
        <h3 className="text-foreground text-sm font-semibold">Speed</h3>
      </div>

      <div className="text-center">
        <div className="font-mono text-xl font-bold text-foreground" aria-live="polite">
          {speed.toFixed(1)} m/s
        </div>
      </div>
    </div>
  );
};

export function FlightPathVisualization({
  waypoints,
  simulationState,
  onStartSimulation,
  onPauseSimulation,
  onStopSimulation,
  onResetSimulation,
  className,
}: FlightPathVisualizationProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Responsive helper: detect mobile viewport so we can reduce vertical space
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onHover = (e: Event) => {
      const ev = e as CustomEvent;
      const idx = typeof ev.detail?.index === 'number' ? ev.detail.index : null;
      setHoveredIdx(idx);
    };
    const onUnhover = () => setHoveredIdx(null);
    window.addEventListener('waypoint-hover', onHover as EventListener);
    window.addEventListener('waypoint-unhover', onUnhover as EventListener);
    return () => {
      window.removeEventListener('waypoint-hover', onHover as EventListener);
      window.removeEventListener('waypoint-unhover', onUnhover as EventListener);
    };
  }, []);

  // If no waypoints, render an informative empty state
  if (waypoints.length === 0) {
    return (
      <Card className={`border-border bg-card ${className || ""}`}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Flight Path Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-64 items-center justify-center">
            <div className="text-center">
              <p className="mb-2 text-lg">No flight plan generated</p>
              <p className="text-sm">
                Configure your mission parameters and click "Generate Flight Plan"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Calculate bounds for visualization ---
  // Extract coordinate ranges to compute scaling and padding
  const xs = waypoints.map((w) => w.x);
  const ys = waypoints.map((w) => w.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Prevent zero-range by defaulting to 1 when all points align
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  // Responsive padding + svg height: tighter on mobile
  const padding = isMobile ? 20 : 40;
  const width = 800;
  const height = 600;
  const svgHeight = isMobile ? 360 : height;

  // Scale helper functions map world coordinates into SVG viewport
  const scaleX = (x: number) => ((x - minX) / rangeX) * (width - 2 * padding) + padding;
  const scaleY = (y: number) => ((y - minY) / rangeY) * (height - 2 * padding) + padding;

  return (
    <Card className={`border-border bg-card ${className || ""}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Flight Path Visualization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Flight Controls and Speedometer */}
        {(() => {
          const WAYPOINT_LIMIT = 1000;
          const isTooManyWaypoints = waypoints.length > WAYPOINT_LIMIT;
          console.log("FlightPathVisualization render - waypoints:", waypoints.length, "isTooMany:", isTooManyWaypoints);

          if (isTooManyWaypoints) {
            return (
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
            );
          }

          return (
            <div className="bg-muted/30 flex items-start justify-between gap-3 md:gap-4 rounded-lg p-3 md:p-4">
              {/* Left side: Flight Controls and Status */}
              <div className="flex flex-col gap-3">
                {/* Flight Control Buttons */}
                <div className="w-full">
                  <div className="md:hidden">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={onStartSimulation}
                        disabled={isTooManyWaypoints || (simulationState?.isRunning && !simulationState?.isPaused)}
                        className="h-12 w-full flex items-center justify-center gap-2"
                        variant={
                          simulationState?.isRunning && !simulationState?.isPaused
                            ? "secondary"
                            : "default"
                        }
                      >
                        <Play className="h-5 w-5" />
                        <span className="font-medium">{simulationState?.isRunning && !simulationState?.isPaused ? "Running" : "Start"}</span>
                      </Button>

                      <Button
                        onClick={onPauseSimulation}
                        disabled={!simulationState?.isRunning || simulationState?.isPaused}
                        variant="outline"
                        className="h-12 w-full flex items-center justify-center gap-2"
                      >
                        <Pause className="h-5 w-5" />
                        <span className="font-medium">Pause</span>
                      </Button>
                    </div>

                    <div className="mt-2">
                      <Button
                        onClick={onResetSimulation}
                        variant="outline"
                        className="h-12 w-full flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="h-5 w-5" />
                        <span className="font-medium">Reset</span>
                      </Button>
                    </div>
                  </div>

                  {/* Desktop / tablet: original compact controls */}
                  <div className="hidden md:flex items-center gap-2">
                    <Button
                      onClick={onStartSimulation}
                      disabled={isTooManyWaypoints || (simulationState?.isRunning && !simulationState?.isPaused)}
                      size="sm"
                      variant={
                        simulationState?.isRunning && !simulationState?.isPaused
                          ? "secondary"
                          : "default"
                      }
                      className="cursor-pointer"
                    >
                      <Play className="mr-1 h-4 w-4" />
                      {simulationState?.isRunning && !simulationState?.isPaused ? "Running" : "Start"}
                    </Button>

                    <Button
                      onClick={onPauseSimulation}
                      disabled={!simulationState?.isRunning || simulationState?.isPaused}
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                    >
                      <Pause className="mr-1 h-4 w-4" />
                      Pause
                    </Button>

                    <Button
                      onClick={onStopSimulation}
                      disabled={!simulationState?.isRunning}
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                    >
                      <Square className="mr-1 h-4 w-4" />
                      Stop
                    </Button>

                    <Button
                      onClick={onResetSimulation}
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                    >
                      <RotateCcw className="mr-1 h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Flight Progress Metrics - Under buttons */}
                {simulationState?.isRunning && (
                  <div className="text-md grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6 items-center text-center">
                    <div className="flex flex-col items-center p-1">
                      <p className="text-muted-foreground text-sm">Mission Time</p>
                      <p className="font-mono text-base font-bold leading-tight">
                        {(() => {
                          const totalSeconds = Math.floor(simulationState.elapsedTime);
                          const hours = Math.floor(totalSeconds / 3600);
                          const minutes = Math.floor((totalSeconds % 3600) / 60);
                          const seconds = totalSeconds % 60;

                          if (hours > 0) {
                            return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                          }
                          return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                        })()}
                      </p>
                      <div className="mt-1 flex items-center justify-center gap-2">
                        {simulationState.isPaused ? (
                          <>
                            <div className="h-2 w-2 rounded-full bg-gray-500" />
                            <span className="text-muted-foreground text-xs">Paused</span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                            <span className="text-muted-foreground text-xs">Running</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center p-1">
                      <p className="text-muted-foreground text-sm">Waypoint</p>
                      <p className="font-mono font-bold text-base">
                        {simulationState.currentWaypointIndex + 1} / {waypoints.length}
                      </p>
                    </div>

                    <div className="flex flex-col items-center p-1">
                      <p className="text-muted-foreground text-sm">Photos</p>
                      <p className="font-mono font-bold text-base text-green-600">
                        {simulationState.currentWaypointIndex + 1}
                      </p>
                    </div>

                    <div className="flex flex-col items-center p-1">
                      <p className="text-muted-foreground mb-1 text-sm">Mission Progress</p>
                      <p className="font-mono font-bold text-base mb-1">
                        {Math.round((simulationState.currentWaypointIndex / (waypoints.length - 1)) * 100)}%
                      </p>
                      <div className="bg-muted h-2 w-full rounded-full">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.round((simulationState.currentWaypointIndex / (waypoints.length - 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!simulationState?.isRunning && (
                  <div className="text-muted-foreground text-sm">
                    <p>{waypoints.length} waypoints loaded • Ready to simulate</p>
                  </div>
                )}
              </div>

              {/* Right side: Speedometer (hidden on small screens to save vertical space) */}
              {simulationState?.isRunning && (
                <div className="hidden md:block">
                  <SpeedometerGauge speed={simulationState.currentSpeed} />
                </div>
              )}
            </div>
          );
        })()}

        <div className="relative flex w-full justify-center">
          <svg
            ref={svgRef}
            width="100%"
            height={svgHeight}
            viewBox={`0 0 ${width} ${height}`}
            className="bg-background/50 max-w-full rounded-lg border"
          >
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
              if (i === waypoints.length - 1) return null;
              const next = waypoints[i + 1];
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
              );
            })}

            {/* Waypoint markers */}
            {waypoints.map((waypoint, i) => {
              const cxPos = scaleX(waypoint.x);
              const cyPos = scaleY(waypoint.y);
              const isInteractive = !simulationState?.isRunning;
              const markerClass = i === 0 ? "text-accent" : i === waypoints.length - 1 ? "text-destructive" : "text-primary";
              const isHovered = i === hoveredIdx;
              const rHit = 12; // larger invisible hit radius for easier hovering

              return (
                <g key={i}>
                  {/* Invisible larger hit target to make hovering easier without changing visuals */}
                  <circle
                    cx={cxPos}
                    cy={cyPos}
                    r={rHit}
                    fill="transparent"
                    onMouseEnter={(ev) => {
                      if (!isInteractive) return;
                      const event = new CustomEvent('waypoint-hover', { detail: { index: i, source: 'svg' } });
                      window.dispatchEvent(event);
                      if (svgRef.current) {
                        const screenPt = svgRef.current.createSVGPoint();
                        screenPt.x = cxPos; screenPt.y = cyPos;
                        const screenCTM = svgRef.current.getScreenCTM();
                        const containerRect = svgRef.current.getBoundingClientRect();
                        if (screenCTM && containerRect) {
                          const transformed = screenPt.matrixTransform(screenCTM);
                          setTooltipPos({ x: transformed.x - containerRect.left, y: transformed.y - containerRect.top });
                        }
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isInteractive) return;
                      window.dispatchEvent(new CustomEvent('waypoint-unhover'));
                      setTooltipPos(null);
                    }}
                    onMouseMove={(ev) => {
                      if (!isInteractive || !svgRef.current) return;
                      const containerRect = svgRef.current.getBoundingClientRect();
                      setTooltipPos({ x: ev.clientX - containerRect.left, y: ev.clientY - containerRect.top });
                    }}
                    style={{ cursor: isInteractive ? 'pointer' : 'default' }}
                    aria-hidden
                  />

                  {/* Visible marker (unchanged visual size) */}
                  <circle
                    cx={cxPos}
                    cy={cyPos}
                    r={i === 0 ? 6 : i === waypoints.length - 1 ? 6 : 3}
                    fill="currentColor"
                    className={markerClass + (isHovered ? ' opacity-100 scale-110' : '')}
                    style={{ transition: 'transform 160ms ease, opacity 160ms ease', transformOrigin: `${cxPos}px ${cyPos}px` }}
                  />
                  {(i === 0 || i === waypoints.length - 1) && (
                    <text
                      x={cxPos}
                      y={cyPos - 12}
                      textAnchor="middle"
                      className="fill-foreground font-mono text-xs"
                    >
                      {i === 0 ? "START" : "END"}
                    </text>
                  )}
                </g>
              );
            })}

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
                <g
                  className={simulationState.isPaused ? "" : "animate-spin"}
                  style={{
                    transformOrigin: `${scaleX(simulationState.currentPosition.x)}px ${scaleY(simulationState.currentPosition.y)}px`,
                  }}
                >
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
                  className="fill-foreground text-xs font-bold"
                >
                  DRONE
                </text>
              </g>
            )}

            {/* Camera capture indicators - show when drone is taking photos */}
            {simulationState?.isRunning &&
              waypoints.map((waypoint, i) => {
                const isCurrentOrPassed = i <= simulationState.currentWaypointIndex;
                if (!isCurrentOrPassed) return null;

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
                );
              })}
          </svg>
          {tooltipPos && hoveredIdx !== null && (
            <div
              className="absolute bg-black text-white text-xs rounded py-1 px-2"
              style={{
                left: tooltipPos.x + 12,
                top: tooltipPos.y + 12,
                pointerEvents: "none",
              }}
            >
              <div className="font-mono text-[11px]">Waypoint {hoveredIdx + 1}</div>
              <div className="font-mono text-[11px]">x: {waypoints[hoveredIdx].x.toFixed(2)} m</div>
              <div className="font-mono text-[11px]">y: {waypoints[hoveredIdx].y.toFixed(2)} m</div>
            </div>
          )}
        </div>
        <div className="text-muted-foreground flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="bg-accent h-3 w-3 rounded-full" />
            <span>Start Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-primary h-3 w-3 rounded-full" />
            <span>Waypoints</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-destructive h-3 w-3 rounded-full" />
            <span>End Point</span>
          </div>
          {simulationState?.isRunning && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span>Drone Position</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

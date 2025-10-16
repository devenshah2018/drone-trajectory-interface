"use client";

import type { MissionStats, Waypoint } from "@/lib/types";
import type { SimulationState } from "./flight-simulation-controller";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Clock, MapPin, Camera, Navigation } from "lucide-react";
import { useCallback, useRef, useEffect } from "react";

/**
 * CompactMissionStats component props.
 *
 * @param stats - Mission statistics or null when no mission is available
 * @param waypoints - Array of waypoints that define the flight path
 * @param simulationState - Optional live simulation state used to drive row highlighting and progress indicators
 */
interface CompactMissionStatsProps {
  stats: MissionStats | null;
  waypoints: Waypoint[];
  simulationState?: SimulationState;
}

/**
 * Compact mission stats panel showing key metrics and a waypoint table.
 *
 * @param props - Component props
 * @param props.stats - Mission statistics or null when not available
 * @param props.waypoints - Flight path waypoints to display in the table
 * @param props.simulationState - Optional simulation state for highlighting/progress
 * @returns A Card element containing mission metrics and the waypoint table
 */
export function CompactMissionStats({
  stats,
  waypoints,
  simulationState,
}: CompactMissionStatsProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const currentWaypointRef = useRef<HTMLDivElement>(null);

  /**
   * Handle keyboard navigation inside the waypoint table.
   *
   * @param event - Keyboard event from the table container
   * @returns void
   */
  const handleKeyNavigation = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!tableRef.current) return;

    const focusableElements = tableRef.current.querySelectorAll('[tabindex="0"]');
    const currentIndex = Array.from(focusableElements).indexOf(event.target as HTMLElement);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    const columns = 4; // Number of columns in our table

    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        nextIndex = Math.min(currentIndex + 1, focusableElements.length - 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case "ArrowDown":
        event.preventDefault();
        nextIndex = Math.min(currentIndex + columns, focusableElements.length - 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        nextIndex = Math.max(currentIndex - columns, 0);
        break;
      case "Home":
        event.preventDefault();
        const rowStart = Math.floor(currentIndex / columns) * columns;
        nextIndex = rowStart;
        break;
      case "End":
        event.preventDefault();
        const rowEnd = Math.floor(currentIndex / columns) * columns + (columns - 1);
        nextIndex = Math.min(rowEnd, focusableElements.length - 1);
        break;
      default:
        return;
    }

    const nextElement = focusableElements[nextIndex] as HTMLElement;
    nextElement?.focus();
  }, []);

  // Auto-scroll to current waypoint during simulation
  /**
   * Keep the current waypoint centered in the table container while simulation runs.
   *
   * @remarks
   * Scrolls only the table container itself to avoid affecting the overall page
   * scroll position. Calculates the optimal scroll position to center the current
   * waypoint within the visible table area.
   */
  useEffect(() => {
    if (simulationState?.isRunning && currentWaypointRef.current && tableRef.current) {
      const currentElement = currentWaypointRef.current;
      const container = tableRef.current;

      // Get the current element's position relative to the container
      const containerRect = container.getBoundingClientRect();
      const elementRect = currentElement.getBoundingClientRect();

      // Calculate the element's position within the container's scroll context
      const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
      const elementHeight = elementRect.height;
      const containerHeight = container.clientHeight;

      // Calculate the scroll position to center the element
      const targetScrollTop = relativeTop - containerHeight / 2 + elementHeight / 2;

      // Only scroll the container, not the page
      container.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    }
  }, [simulationState?.currentWaypointIndex, simulationState?.isRunning]);

  /**
   * Format seconds into a human-readable time string.
   *
   * @param seconds - Time in seconds
   * @returns Readable time string like '1h 2m' or '5m 12s'
   */
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  if (!stats) {
    return (
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <BarChart3 className="text-primary h-4 w-4" />
            </div>
            <CardTitle className="text-foreground text-lg font-semibold">
              Mission Statistics
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            <BarChart3 className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
            <p className="mb-1 text-sm font-medium">No Mission Data</p>
            <p className="text-xs">Generate a flight plan to see statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <BarChart3 className="text-primary h-4 w-4" />
          </div>
          <CardTitle className="text-foreground text-lg font-semibold">
            Mission Statistics
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-xs font-medium">Waypoints</p>
            </div>
            <p className="text-foreground text-lg font-bold">{stats.totalWaypoints}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="mb-2 flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <p className="text-muted-foreground text-xs font-medium">Duration</p>
            </div>
            <p className="text-foreground text-lg font-bold">{formatTime(stats.estimatedTime)}</p>
          </div>
        </div>

        {/* Distance & Coverage */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 flex flex-col gap-1 rounded-lg p-3">
            <span className="text-muted-foreground text-xs font-medium">Flight Distance</span>
            <span className="text-foreground text-lg font-bold">
              {(stats.totalDistance / 1000).toFixed(1)} km
            </span>
          </div>

          <div className="bg-muted/30 flex flex-col gap-1 rounded-lg p-3">
            <span className="text-muted-foreground text-xs font-medium">Coverage Area</span>
            <span className="text-foreground text-lg font-bold">
              {(stats.coverageArea / 10000).toFixed(2)} ha
            </span>
          </div>

          <div className="bg-muted/30 flex flex-col gap-1 rounded-lg p-3">
            <span className="text-muted-foreground text-xs font-medium">Ground Sampling</span>
            <span className="text-foreground text-lg font-bold">
              {(stats.gsd * 100).toFixed(1)} cm/px
            </span>
          </div>

          <div className="bg-muted/30 flex flex-col gap-1 rounded-lg p-3">
            <span className="text-muted-foreground text-xs font-medium">Image Footprint</span>
            <span className="text-foreground text-lg font-bold">
              {stats.imageFootprint[0].toFixed(0)} × {stats.imageFootprint[1].toFixed(0)}m
            </span>
          </div>
        </div>

        {/* Waypoints Table */}
        {waypoints && waypoints.length > 0 && (
          <div className="space-y-4" role="region" aria-labelledby="waypoints-heading">
            <div className="border-border/50 flex items-center gap-2 border-b pb-2">
              <Navigation className="text-muted-foreground h-4 w-4" aria-hidden="true" />
              <h3 id="waypoints-heading" className="text-foreground text-sm font-medium">
                Waypoint Positions
              </h3>
            </div>
            <div
              ref={tableRef}
              className="border-border/50 focus-within:ring-primary/50 max-h-80 overflow-y-auto rounded-lg border [scrollbar-gutter:stable] focus-within:ring-2"
              role="table"
              aria-label={`Flight path waypoints table with ${waypoints.length} waypoints`}
              aria-describedby="waypoints-description"
              onKeyDown={handleKeyNavigation}
            >
              <div
                className="bg-card/95 border-border/50 sticky top-0 z-30 border-b pr-3 backdrop-blur-sm"
                role="rowgroup"
                aria-label="Table headers"
              >
                <div
                  className="text-muted-foreground grid grid-cols-4 gap-2 p-3 text-xs font-medium"
                  role="row"
                >
                  <div
                    role="columnheader"
                    className="focus:ring-primary/50 rounded px-1 focus:ring-2 focus:outline-none"
                  >
                    Point
                  </div>
                  <div
                    role="columnheader"
                    className="focus:ring-primary/50 rounded px-1 focus:ring-2 focus:outline-none"
                  >
                    X (m)
                  </div>
                  <div
                    role="columnheader"
                    className="focus:ring-primary/50 rounded px-1 focus:ring-2 focus:outline-none"
                  >
                    Y (m)
                  </div>
                  <div
                    role="columnheader"
                    className="focus:ring-primary/50 rounded px-1 focus:ring-2 focus:outline-none"
                  >
                    Speed (m/s)
                  </div>
                </div>
              </div>
              <div className="divide-border/30 divide-y" role="rowgroup" aria-label="Table data">
                {waypoints.map((waypoint, index) => {
                  // Determine waypoint status for highlighting
                  const isCurrent =
                    simulationState?.isRunning && index === simulationState.currentWaypointIndex;
                  const isCompleted =
                    simulationState?.isRunning && index < simulationState.currentWaypointIndex;
                  const isUpcoming =
                    simulationState?.isRunning && index > simulationState.currentWaypointIndex;
                  const isInactive = !simulationState?.isRunning;

                  // Create dynamic classes for row highlighting
                  let rowClasses = "grid grid-cols-4 gap-2 p-3 text-xs font-mono relative";

                  if (isCurrent) {
                    // Current waypoint - green highlighting for arrived
                    rowClasses += " bg-emerald-50/60 dark:bg-emerald-950/25";
                    rowClasses += " border-l-3 border-emerald-500/70";
                    rowClasses += " ring-1 ring-emerald-200/40 ring-inset";
                  } else if (isCompleted) {
                    // Completed waypoints - gray with subtle highlighting
                    rowClasses += " bg-muted/50 dark:bg-muted/30";
                    rowClasses += " border-l-2 border-muted-foreground/40";
                    rowClasses += " opacity-80";
                  } else if (isUpcoming) {
                    // Upcoming waypoints - very subtle gray
                    rowClasses += " bg-muted/25 dark:bg-muted/15";
                    rowClasses += " border-l-1 border-muted-foreground/25";
                  } else if (isInactive) {
                    // Default state when simulation is not running
                    rowClasses += " hover:bg-muted/30 focus-within:bg-muted/40";
                  }

                  return (
                    <div
                      key={index}
                      ref={isCurrent ? currentWaypointRef : undefined}
                      className={rowClasses}
                      role="row"
                      aria-rowindex={index + 1}
                      tabIndex={-1}
                      aria-label={
                        isCurrent
                          ? `Current waypoint ${index + 1}`
                          : isCompleted
                            ? `Completed waypoint ${index + 1}`
                            : `Waypoint ${index + 1}`
                      }
                    >
                      {/* Waypoint number cell with status indicator */}
                      <div
                        role="cell"
                        className="text-muted-foreground focus:ring-primary/50 flex items-center gap-2 rounded px-1 focus:ring-2 focus:outline-none"
                        aria-label={`Waypoint ${index + 1}`}
                        tabIndex={0}
                      >
                        <span className="flex-shrink-0">#{index + 1}</span>
                        {/* Status indicator */}
                        {isCurrent && (
                          <div
                            className="flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-sm bg-emerald-500"
                            aria-label="Current position - arrived"
                          >
                            <svg
                              className="h-2 w-2 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                        {isCompleted && (
                          <div
                            className="bg-muted-foreground/60 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-sm"
                            aria-label="Completed"
                          >
                            <svg
                              className="h-2 w-2 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                        {isUpcoming && !isCurrent && (
                          <div
                            className="bg-muted-foreground/30 h-2 w-2 flex-shrink-0 rounded-full"
                            aria-label="Upcoming"
                          />
                        )}
                      </div>

                      {/* X coordinate */}
                      <div
                        role="cell"
                        className={`focus:ring-primary/50 rounded px-1 focus:ring-2 focus:outline-none ${
                          isCurrent
                            ? "text-foreground font-semibold"
                            : isCompleted
                              ? "text-muted-foreground/80"
                              : "text-foreground"
                        }`}
                        aria-label={`X coordinate: ${waypoint.x.toFixed(1)} meters`}
                        tabIndex={0}
                      >
                        {waypoint.x.toFixed(1)}
                      </div>

                      {/* Y coordinate */}
                      <div
                        role="cell"
                        className={`focus:ring-primary/50 rounded px-1 focus:ring-2 focus:outline-none ${
                          isCurrent
                            ? "text-foreground font-semibold"
                            : isCompleted
                              ? "text-muted-foreground/80"
                              : "text-foreground"
                        }`}
                        aria-label={`Y coordinate: ${waypoint.y.toFixed(1)} meters`}
                        tabIndex={0}
                      >
                        {waypoint.y.toFixed(1)}
                      </div>

                      {/* Speed */}
                      <div
                        role="cell"
                        className={`focus:ring-primary/50 rounded px-1 focus:ring-2 focus:outline-none ${
                          isCurrent
                            ? "text-foreground font-semibold"
                            : isCompleted
                              ? "text-muted-foreground/80"
                              : "text-foreground"
                        }`}
                        aria-label={`Flight speed: ${waypoint.speed.toFixed(1)} meters per second`}
                        tabIndex={0}
                      >
                        {waypoint.speed.toFixed(1)}
                      </div>

                      {/* Enhanced highlighting overlay for current waypoint */}
                      {isCurrent && (
                        <>
                          <div className="pointer-events-none absolute inset-0 rounded bg-emerald-100/20 dark:bg-emerald-800/10" />
                          {/* Progress indicator for current segment */}
                          {simulationState?.progress !== undefined && (
                            <div
                              className="absolute bottom-0 left-0 h-0.5 rounded-b bg-emerald-500/70"
                              style={{ width: `${(simulationState.progress * 100).toFixed(1)}%` }}
                              aria-label={`${(simulationState.progress * 100).toFixed(1)}% progress to next waypoint`}
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend for simulation highlighting */}
            {simulationState?.isRunning && (
              <div className="bg-muted/20 border-border/30 mt-4 rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-foreground text-xs font-medium">Flight Progress</h4>
                  <div className="text-muted-foreground font-mono text-xs">
                    {simulationState.isPaused ? (
                      <span className="text-muted-foreground">⏸ Paused</span>
                    ) : (
                      <span className="text-primary">▶ Active</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-3 w-3 items-center justify-center rounded-sm bg-emerald-500">
                      <svg
                        className="h-1.5 w-1.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">Current Position</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-muted-foreground/60 flex h-3 w-3 items-center justify-center rounded-sm">
                      <svg
                        className="h-1.5 w-1.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-muted-foreground/30 h-2 w-2 rounded-full" />
                    <span className="text-muted-foreground">Upcoming</span>
                  </div>
                </div>
                {simulationState.currentWaypointIndex < waypoints.length && (
                  <div className="border-border/30 mt-2 border-t pt-2">
                    <div className="text-muted-foreground text-xs">
                      Flying to waypoint {simulationState.currentWaypointIndex + 2}/
                      {waypoints.length}
                      {simulationState.progress > 0 && (
                        <span className="ml-2">
                          ({(simulationState.progress * 100).toFixed(0)}% complete)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div id="waypoints-description" className="sr-only" aria-live="polite">
              Table showing {waypoints.length} flight path waypoints with their coordinates and
              flight speeds.
              {simulationState?.isRunning
                ? ` During simulation, waypoints are subtly highlighted: primary theme for current position, muted for completed, and subtle for upcoming waypoints.`
                : ""}{" "}
              Use Tab to enter the table, then arrow keys to navigate between cells. Use Home and
              End to jump to the beginning or end of each row.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

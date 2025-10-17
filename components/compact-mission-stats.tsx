"use client";

import type { MissionStats, Waypoint } from "@/lib/types";
import type { SimulationState } from "./flight-simulation-controller";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Clock, MapPin, Camera, Navigation } from "lucide-react";
import { useCallback, useRef, useEffect, useState } from "react";
import { computePlanTime } from "@/lib/flight-planner";

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
  // Separate ref for the active segment row so we can scroll segments independently
  const currentSegmentRef = useRef<HTMLDivElement>(null);
  // Separate ref for the segments table container
  const segmentsTableRef = useRef<HTMLDivElement>(null);
  // Remember previous waypoint index so we can detect when a waypoint was reached
  const prevWaypointIndexRef = useRef<number | null>(null);
  // Timeout ref for delayed segment scrolls
  const segmentScrollTimeoutRef = useRef<number | null>(null);
  const [hoveredWaypoint, setHoveredWaypoint] = useState<number | null>(null);

  // Listen for cross-component hover events (custom DOM events) so the
  // visualization and table can highlight each other without changing props.
  useEffect(() => {
    const onWaypointHover = (e: Event) => {
      const ev = e as CustomEvent;
      const idx = typeof ev.detail?.index === 'number' ? ev.detail.index : null;
      setHoveredWaypoint(idx);
    };
    const onWaypointUnhover = () => setHoveredWaypoint(null);

    window.addEventListener('waypoint-hover', onWaypointHover as EventListener);
    window.addEventListener('waypoint-unhover', onWaypointUnhover as EventListener);
    return () => {
      window.removeEventListener('waypoint-hover', onWaypointHover as EventListener);
      window.removeEventListener('waypoint-unhover', onWaypointUnhover as EventListener);
    };
  }, []);

  // Helper: find the nearest scrollable ancestor (same as used in the running autoscroll)
  const findScrollParent = (node: HTMLElement | null): HTMLElement | null => {
    let n: HTMLElement | null = node;
    while (n && n !== document.body && n !== document.documentElement) {
      const style = window.getComputedStyle(n);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') && n.scrollHeight > n.clientHeight) {
        return n;
      }
      n = n.parentElement;
    }
    return null;
  };

  // Scroll an element so it is centered within the provided container (or its nearest scroll parent)
  const scrollElementIntoContainer = (el: HTMLElement | null, containerFallback: HTMLElement | null, triedRAF = false) => {
    if (!el || !containerFallback) return;
    const discovered = findScrollParent(el);
    const scrollParent = discovered || containerFallback;
    const containerEl = (scrollParent === document.body || scrollParent === document.documentElement) ? containerFallback : (scrollParent as HTMLElement);
    if (!containerEl) return;

    const containerHeight = containerEl.clientHeight;
    if (!containerHeight) {
      if (!triedRAF) {
        requestAnimationFrame(() => scrollElementIntoContainer(el, containerFallback, true));
      }
      return;
    }

    const containerRect = containerEl.getBoundingClientRect();
    const elementRect = el.getBoundingClientRect();
    const elementHeight = elementRect.height || 0;
    const relativeTop = elementRect.top - containerRect.top + containerEl.scrollTop;

    const sticky = containerEl.querySelector('.sticky') as HTMLElement | null;
    const stickyHeight = sticky ? sticky.getBoundingClientRect().height : 0;
    let targetScrollTop = relativeTop - (containerHeight - stickyHeight) / 2 + elementHeight / 2;
    const maxScrollTop = Math.max(0, containerEl.scrollHeight - containerHeight);
    targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));

    if (Math.abs(containerEl.scrollTop - targetScrollTop) > 2) {
      containerEl.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    }
  };

  // When a waypoint is hovered (and simulation is not running) center it in the waypoints table
  useEffect(() => {
    if (simulationState?.isRunning) return; // don't interfere while running
    if (hoveredWaypoint === null) return;
    const wpContainer = tableRef.current;
    if (!wpContainer) return;

    const idx = hoveredWaypoint;
    const selector = `[aria-label="Waypoint ${idx + 1}"] [tabindex="0"]`;
    let el = wpContainer.querySelector(selector) as HTMLElement | null;
    if (!el) {
      // retry once on RAF to handle timing/layout
      requestAnimationFrame(() => {
        const retry = wpContainer.querySelector(selector) as HTMLElement | null;
        if (retry) scrollElementIntoContainer(retry, wpContainer);
      });
      return;
    }

    scrollElementIntoContainer(el, wpContainer);
  }, [hoveredWaypoint, simulationState?.isRunning]);

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
    // Diagnostic log to confirm effect runs and key values. Using console.log
    // to ensure messages are visible in all browser consoles.
    console.log('[compact-mission-stats] auto-scroll effect', {
      running: !!simulationState?.isRunning,
      currentWaypointIndex: simulationState?.currentWaypointIndex,
      currentSegmentIndex: simulationState?.currentSegmentIndex,
      hasCurrentWaypointRef: !!currentWaypointRef.current,
      hasCurrentSegmentRef: !!currentSegmentRef.current,
      tableRefPresent: !!tableRef.current,
    });

    // Helper: Find nearest scrollable ancestor (overflowY: auto/scroll/overlay) and
    // ensure the element has scrollable content (scrollHeight > clientHeight).
    const findScrollParent = (node: HTMLElement | null): HTMLElement | null => {
      let n: HTMLElement | null = node;
      while (n && n !== document.body && n !== document.documentElement) {
        const style = window.getComputedStyle(n);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll' || 'overlay') && n.scrollHeight > n.clientHeight) {
          return n;
        }
        n = n.parentElement;
      }
      return null;
    };

    // Unified scroll routine with a single RAF retry if measurements are not ready.
    const tryScrollInto = (el: HTMLElement | null, containerFallback: HTMLElement | null, label: string, triedRAF = false) => {
      if (!el || !containerFallback) return;

      // Prefer a discovered scroll parent but fall back to the explicit container
      // so we never end up scrolling the page/document accidentally.
      const discovered = findScrollParent(el);
      const scrollParent = discovered || containerFallback;
      const containerEl = (scrollParent === document.body || scrollParent === document.documentElement) ? containerFallback : (scrollParent as HTMLElement);
      if (!containerEl) return;

      const containerHeight = containerEl.clientHeight;
      if (!containerHeight) {
        // Measurements not ready; try once on the next animation frame.
        if (!triedRAF) {
          requestAnimationFrame(() => tryScrollInto(el, containerFallback, label, true));
        }
        return;
      }

      const containerRect = containerEl.getBoundingClientRect();
      const elementRect = el.getBoundingClientRect();
      const elementHeight = elementRect.height || 0;
      const relativeTop = elementRect.top - containerRect.top + containerEl.scrollTop;

      const sticky = containerEl.querySelector('.sticky') as HTMLElement | null;
      const stickyHeight = sticky ? sticky.getBoundingClientRect().height : 0;
      let targetScrollTop = relativeTop - (containerHeight - stickyHeight) / 2 + elementHeight / 2;
      const maxScrollTop = Math.max(0, containerEl.scrollHeight - containerHeight);
      targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));

      console.log('[compact-mission-stats] ' + label, {
        idx: simulationState?.currentWaypointIndex ?? simulationState?.currentSegmentIndex,
        scrollParent: containerEl,
        containerHeight,
        relativeTop,
        targetScrollTop,
        currentScrollTop: containerEl.scrollTop,
      });

      if (Math.abs(containerEl.scrollTop - targetScrollTop) > 2) {
        // Use smooth scroll so the user's visual context is preserved.
        containerEl.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
    };

    // Short-circuit if not running
    if (!simulationState?.isRunning) return;

    // Prefer scrolling the active segment when visible; otherwise scroll the active waypoint
    const shouldScrollSegment =
      typeof simulationState?.currentSegmentIndex === 'number' &&
      (waypoints?.length ?? 0) > 1 &&
      currentSegmentRef.current;

    // Detect whether the waypoint index has just changed (arrived at a waypoint).
    const prevWp = prevWaypointIndexRef.current;
    const currentWp = simulationState.currentWaypointIndex ?? null;
    const waypointJustChanged = prevWp !== null && prevWp !== currentWp;
    prevWaypointIndexRef.current = currentWp;

    // If no table container available, bail
    if (!tableRef.current && !segmentsTableRef.current) return;

    // If we should scroll segments and we are not prioritizing a recent waypoint arrival,
    // scroll segments immediately.
    if (shouldScrollSegment && !waypointJustChanged) {
      const el = currentSegmentRef.current as HTMLElement | null;
      const container = segmentsTableRef.current;
      tryScrollInto(el, container, 'segment-scroll');

      // Clear any pending delayed segment recenter scheduled earlier
      if (segmentScrollTimeoutRef.current) {
        window.clearTimeout(segmentScrollTimeoutRef.current as unknown as number);
        segmentScrollTimeoutRef.current = null;
      }

      return;
    }

    // If a waypoint arrival just happened and segments are active, delay the segments
    // recenter so the waypoint animation is prioritized visually.
    if (shouldScrollSegment && waypointJustChanged) {
      if (segmentScrollTimeoutRef.current) {
        window.clearTimeout(segmentScrollTimeoutRef.current as unknown as number);
      }
      segmentScrollTimeoutRef.current = window.setTimeout(() => {
        const el = currentSegmentRef.current as HTMLElement | null;
        const container = segmentsTableRef.current;
        tryScrollInto(el, container, 'segment-scroll-delayed');
        segmentScrollTimeoutRef.current = null;
      }, 150);
      // Continue to also scroll the waypoint below (no return)
    }

    // Waypoints: prefer using the explicit waypoints container so we never scroll the page
    const wpContainer = tableRef.current;
    if (!wpContainer) return;

    // Prefer the explicit ref to the active cell. If not present, attempt to query
    // the active row's first focusable cell using the known aria-label.
    let wpEl = currentWaypointRef.current as HTMLElement | null;
    if (!wpEl || !wpContainer.contains(wpEl)) {
      const idx = simulationState.currentWaypointIndex ?? 0;
      const selector = `[aria-label="Current waypoint ${idx + 1}"] [tabindex="0"]`;
      wpEl = wpContainer.querySelector(selector) as HTMLElement | null;
      if (!wpEl) {
        // If the element isn't rendered yet, retry once on RAF to handle timing edge cases.
        requestAnimationFrame(() => {
          const retryEl = wpContainer.querySelector(selector) as HTMLElement | null;
          if (retryEl) tryScrollInto(retryEl, wpContainer, 'waypoint-scroll-raf');
        });
        return;
      }
    }

    // Finally, scroll the waypoint into center of the wpContainer (or its nearest
    // scrollable ancestor that isn't the document).
    tryScrollInto(wpEl, wpContainer, 'waypoint-scroll');
  }, [simulationState?.currentWaypointIndex, simulationState?.isRunning, simulationState?.currentSegmentIndex]);

  // Cleanup any scheduled timeouts on unmount or deps change
  useEffect(() => {
    return () => {
      if (segmentScrollTimeoutRef.current) {
        window.clearTimeout(segmentScrollTimeoutRef.current as unknown as number);
        segmentScrollTimeoutRef.current = null;
      }
    };
  }, []);

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

  // Precompute table rows (waypoints only). Segments are rendered in a separate table below.
  const tableRows: React.ReactNode[] = (() => {
    const rows: React.ReactNode[] = [];

    waypoints.forEach((waypoint, index) => {
      const isHovered = !simulationState?.isRunning && hoveredWaypoint === index;
      const isCurrent = simulationState?.isRunning && index === simulationState.currentWaypointIndex;
      const isCompleted = simulationState?.isRunning && index < simulationState.currentWaypointIndex;
      const isUpcoming = simulationState?.isRunning && index > simulationState.currentWaypointIndex;
      const isInactive = !simulationState?.isRunning;

      let rowClasses = "grid grid-cols-3 gap-2 p-3 text-xs font-mono relative";
      if (isHovered) {
        rowClasses += " ring-2 ring-primary/40 bg-primary/5";
      }
      if (isCurrent) {
        rowClasses += " bg-emerald-50/60 dark:bg-emerald-950/25 border-l-3 border-emerald-500/70 ring-1 ring-emerald-200/40 ring-inset";
      } else if (isCompleted) {
        rowClasses += " bg-muted/50 dark:bg-muted/30 border-l-2 border-muted-foreground/40 opacity-80";
      } else if (isUpcoming) {
        rowClasses += " bg-muted/25 dark:bg-muted/15 border-l-1 border-muted-foreground/25";
      } else if (isInactive) {
        rowClasses += " hover:bg-muted/30 focus-within:bg-muted/40";
      }

      rows.push(
        <div
          key={`wp-${index}`}
          className={rowClasses}
          role="row"
          aria-rowindex={index + 1}
          tabIndex={-1}
          aria-label={isCurrent ? `Current waypoint ${index + 1}` : isCompleted ? `Completed waypoint ${index + 1}` : `Waypoint ${index + 1}`}
          onMouseEnter={() => {
            // Only send hover events when simulation is not running
            if (!simulationState?.isRunning) {
              const ev = new CustomEvent('waypoint-hover', { detail: { index, source: 'table' } });
              window.dispatchEvent(ev);
            }
          }}
          onMouseLeave={() => {
            if (!simulationState?.isRunning) {
              window.dispatchEvent(new CustomEvent('waypoint-unhover'));
            }
          }}
        >
          <div ref={isCurrent ? currentWaypointRef : undefined} role="cell" className="text-muted-foreground focus:ring-primary/50 flex items-center gap-2 rounded px-1 focus:ring-2 focus:outline-none" aria-label={`Waypoint ${index + 1}`} tabIndex={0}>
            <span className="flex-shrink-0">#{index + 1}</span>
            {isCurrent && <div className="flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-sm bg-emerald-500" aria-hidden />}
            {isCompleted && !isCurrent && <div className="bg-muted-foreground/60 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-sm" aria-hidden />}
            {isUpcoming && !isCurrent && <div className="bg-muted-foreground/30 h-2 w-2 flex-shrink-0 rounded-full" aria-hidden />}
          </div>

          <div role="cell" className={`focus:ring-primary/50 rounded px-1 focus:ring-2 focus:outline-none ${isCurrent ? "text-foreground font-semibold" : isCompleted ? "text-muted-foreground/80" : "text-foreground"}`} aria-label={`X coordinate: ${waypoint.x.toFixed(1)} meters`} tabIndex={0}>
            {waypoint.x.toFixed(1)}
          </div>

          <div role="cell" className={`focus:ring-primary/50 rounded px-1 focus:ring-2 focus:outline-none ${isCurrent ? "text-foreground font-semibold" : isCompleted ? "text-muted-foreground/80" : "text-foreground"}`} aria-label={`Y coordinate: ${waypoint.y.toFixed(1)} meters`} tabIndex={0}>
            {waypoint.y.toFixed(1)}
          </div>

          {/* <div role="cell" className={`focus:ring-primary/50 rounded px-1 focus:ring-2 focus:outline-none ${isCurrent ? "text-foreground font-semibold" : isCompleted ? "text-muted-foreground/80" : "text-foreground"}`} aria-label={`Flight speed: ${waypoint.speed.toFixed(1)} meters per second`} tabIndex={0}>
            {waypoint.speed.toFixed(1)}
          </div> */}

          {isCurrent && (
            <>
              <div className="pointer-events-none absolute inset-0 rounded bg-emerald-100/20 dark:bg-emerald-800/10" />
              {simulationState?.progress !== undefined && (
                <div className="absolute bottom-0 left-0 h-0.5 rounded-b bg-emerald-500/70" style={{ width: `${(simulationState.progress * 100).toFixed(1)}%` }} aria-label={`${(simulationState.progress * 100).toFixed(1)}% progress to next waypoint`} />
              )}
            </>
          )}
        </div>
      );
    });

    return rows;
  })();

  // Build a separate segmentsRows array for rendering in its own table
  // If the simulation controller hasn't populated segments yet, compute a preview
  // using the current waypoints so the UI shows segments immediately after plan generation.
  const previewSegments = (() => {
    try {
      if (simulationState?.segments && (simulationState.segments.length ?? 0) > 0) return null;
      if (!waypoints || waypoints.length < 2) return [];
      const positions = waypoints.map((w) => [w.x, w.y, w.z]);
      const vPhoto = waypoints[0]?.speed ?? 0;
      const [, segs] = computePlanTime(positions, vPhoto, 0.0);
      return segs || [];
    } catch (e) {
      return [];
    }
  })();

  const segmentsRows: React.ReactNode[] = (() => {
    const rows: React.ReactNode[] = [];
    const segments = (simulationState?.segments && (simulationState.segments.length ?? 0) > 0)
      ? simulationState.segments
      : (previewSegments ?? []);

    segments.forEach((seg: any, idx: number) => {
      const isActive = simulationState?.isRunning && simulationState.currentSegmentIndex === idx;
      const isCompleted = simulationState?.isRunning && idx < (simulationState?.currentSegmentIndex ?? -1);
      const segType = seg?.profile?.type ?? seg?.type ?? null;

      let rowClasses = "grid grid-cols-6 gap-2 p-3 text-xs font-mono relative border-t";
      if (isActive) rowClasses += " bg-sky-50/60 border-l-3 border-sky-500/70";
      else if (isCompleted) rowClasses += " bg-muted/40";
      else rowClasses += " bg-muted/10";

      // Render a compact visual for the profile: triangle glyph for triangular,
      // a small trapezoid SVG for trapezoidal, or a short fallback string.
      const profileText = segType ? String(segType) : '-';
      const profileIcon: React.ReactNode = (() => {
        if (!segType) return <span className="text-muted-foreground">—</span>;
        const st = String(segType).toLowerCase();
        if (st.includes('triang')) {
          return <span title="Triangular" aria-label="Triangular" className="text-muted-foreground">△</span>;
        }
        if (st.includes('trapezoid') || st.includes('trapezoidal')) {
          return (
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block text-muted-foreground" aria-hidden>
              <path d="M2 2 H12 L10 8 H4 L2 2 Z" fill="currentColor" />
            </svg>
          );
        }
        return <span title={profileText} aria-label={profileText} className="text-muted-foreground">{profileText}</span>;
      })();

      rows.push(
        <div
          key={`seg-${idx}`}
          className={rowClasses.replace('grid-cols-6', 'grid-cols-5')}
          role="row"
          aria-rowindex={idx + 1}
          tabIndex={0}
          aria-label={isActive ? `Active segment ${idx + 1}` : `Segment ${idx + 1}`}
        >
          <div ref={isActive ? currentSegmentRef : undefined} role="cell" className="text-muted-foreground px-1 text-xs font-medium">Segment {idx + 1}→{idx + 2}</div>
          <div role="cell" className="px-1 text-xs">{Number(seg.distance ?? 0).toFixed(1)} m</div>
          <div role="cell" className="px-1 text-xs">{Number(seg.travel_time_s ?? 0).toFixed(1)} s</div>
          <div role="cell" className="px-1 text-xs" title={profileText} aria-label={`Profile: ${profileText}`}>{profileIcon}</div>
          <div role="cell" className="px-1 text-xs">{isActive ? Number(simulationState?.currentSpeed ?? 0).toFixed(1) + " m/s" : "-"}</div>
        </div>
      );
    });

    return rows;
  })();

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
          <div className="text-muted-foreground py-17 text-center">
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
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <BarChart3 className="text-primary h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-3">
            <CardTitle className="text-foreground text-lg font-semibold">Mission Statistics</CardTitle>
            {/* Duration moved into header next to title with clock icon */}
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" aria-hidden />
              <span aria-label={`Estimated duration ${formatTime(stats?.estimatedTime ?? 0)}`}>{formatTime(stats?.estimatedTime ?? 0)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compact stats: show only three metrics (Coverage Area, GSD, Image Footprint) */}
        <div className="w-full">
          <div className="grid grid-cols-3 gap-2 items-center text-center text-xs">
            <div className="p-2">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-[10px] font-medium">
                <BarChart3 className="h-3 w-3" aria-hidden />
                <span>Coverage</span>
              </div>
              <div className="text-foreground text-sm font-semibold mt-1">{(stats.coverageArea / 10000).toFixed(2)} ha</div>
            </div>

            <div className="p-2">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-[10px] font-medium">
                <Clock className="h-3 w-3" aria-hidden />
                <span>GSD</span>
              </div>
              <div className="text-foreground text-sm font-semibold mt-1">{(stats.gsd * 100).toFixed(1)} cm/px</div>
            </div>

            <div className="p-2">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-[10px] font-medium">
                <MapPin className="h-3 w-3" aria-hidden />
                <span>Footprint</span>
              </div>
              <div className="text-foreground text-sm font-semibold mt-1">{stats.imageFootprint[0].toFixed(0)} × {stats.imageFootprint[1].toFixed(0)}m</div>
            </div>
          </div>
        </div>

        {/* Waypoints Table */}
        {waypoints && waypoints.length > 0 && (
          <div className="space-y-4" role="region" aria-labelledby="waypoints-heading">
            <div className="border-border/50 flex items-center gap-2 border-b pb-2 justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                <h3 id="waypoints-heading" className="text-foreground text-sm font-medium">
                  Waypoint Positions
                </h3>
              </div>
              <div className="text-muted-foreground text-xs font-medium">
                {stats ? `${stats.totalWaypoints} waypoints` : ''}
              </div>
            </div>
            <div
              ref={tableRef}
              tabIndex={0}
              style={{ WebkitOverflowScrolling: 'touch' }}
              className="border-border/50 focus-within:ring-primary/50 max-h-80 overflow-y-auto rounded-lg border [scrollbar-gutter:stable] focus-within:ring-2 touch-auto"
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
                  className="text-muted-foreground grid grid-cols-3 gap-2 p-3 text-xs font-medium"
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
                  {/* <div
                    role="columnheader"
                    className="focus:ring-primary/50 rounded px-1 focus:ring-2 focus:outline-none"
                  >
                    Speed (m/s)
                  </div> */}
                </div>
              </div>
              <div className="divide-border/30 divide-y" role="rowgroup" aria-label="Table data">
                {tableRows}
              </div>
            </div>

            {/* Legend for simulation highlighting */}


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

        {/* Segments Table */}
        {waypoints && waypoints.length > 1 && (
          <div className="space-y-4" role="region" aria-labelledby="segments-heading">
            <div className="border-border/50 flex items-center gap-2 border-b pb-2 justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                <h3 id="segments-heading" className="text-foreground text-sm font-medium">Flight Segments</h3>
              </div>
              <div className="text-muted-foreground text-xs font-medium">
                {stats ? `${(stats.totalDistance / 1000).toFixed(1)} km total` : ''}
              </div>
            </div>
            <div
              ref={segmentsTableRef}
              tabIndex={0}
              style={{ WebkitOverflowScrolling: 'touch' }}
              className="border-border/50 focus-within:ring-primary/50 max-h-80 overflow-y-auto rounded-lg border [scrollbar-gutter:stable] focus-within:ring-2 touch-auto"
              role="table"
              aria-label={`Flight segments table with ${segmentsRows.length} segments`}
            >
              <div className="bg-card/95 border-border/50 sticky top-0 z-30 border-b pr-2 backdrop-blur-sm" role="rowgroup" aria-label="Table headers">
                <div className="text-muted-foreground grid grid-cols-5 gap-1 p-2 text-xs font-medium items-center" role="row">
                  <div role="columnheader" className="px-1 py-0.5 text-left leading-tight">Segment</div>
                  <div role="columnheader" className="px-1 py-0.5 text-center leading-tight">Distance</div>
                  <div role="columnheader" className="px-1 py-0.5 text-center leading-tight">Time</div>
                  <div role="columnheader" className="px-1 py-0.5 text-center leading-tight">Profile</div>
                  <div role="columnheader" className="px-1 py-0.5 text-center leading-tight">Speed</div>
                </div>
              </div>
              <div className="divide-border/30 divide-y" role="rowgroup" aria-label="Table data">
                {segmentsRows.length > 0 ? (
                  segmentsRows
                ) : (
                  <div className="p-4 text-xs text-muted-foreground">No segment data available yet. Generate a flight plan to populate segments.</div>
                )}
              </div>
            </div>
          </div>
        )}

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
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useRef } from "react";
import type { Camera, DatasetSpec, Waypoint, MissionStats } from "@/lib/types";
import { generatePhotoPlaneOnGrid, computeMissionStats } from "@/lib/flight-planner";
import { Plane, ExternalLink } from "lucide-react";
import { HorizontalConfig, type HorizontalConfigRef } from "@/components/horizontal-config";
import { FlightPathVisualization } from "@/components/flight-path-visualization";
import { CompactMissionStats } from "@/components/compact-mission-stats";
import { FloatingGenerateButton } from "@/components/floating-generate-button";
import { AuthorProfile } from "@/components/author-profile";
import { FeedbackButton } from "@/components/feedback-button";
import {
  FlightSimulationController,
  type SimulationState,
  type FlightSimulationRef,
} from "@/components/flight-simulation-controller";

/**
 * Root page component for the mission planning UI.
 *
 * @returns The main application UI containing configuration, map, stats, and
 * controls for flight plan generation and simulation.
 * @remarks This is a client component that manages local state and refs for
 * interacting with child components (map, simulation controller, config).
 */
export default function Home() {
  // --- Camera configuration state (defaults chosen for typical drone camera) ---
  const [camera, setCamera] = useState<Camera>({
    fx: 2000,
    fy: 2000,
    cx: 2000,
    cy: 1500,
    sensor_size_x_mm: 13.2,
    sensor_size_y_mm: 8.8,
    image_size_x: 4000,
    image_size_y: 3000,
  });

  // --- Dataset / mission parameters ---
  const [datasetSpec, setDatasetSpec] = useState<DatasetSpec>({
    overlap: 0.75,
    sidelap: 0.65,
    height: 30.5,
    scan_dimension_x: 150,
    scan_dimension_y: 150,
    exposure_time_ms: 2.0,
  });

  // --- Generated outputs and UI state ---
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [missionStats, setMissionStats] = useState<MissionStats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);

  // Drone kinematic config (vMax m/s, aMax m/s^2)
  const [droneConfig, setDroneConfig] = useState<{ vMax?: number; aMax?: number }>({ vMax: 16, aMax: 3.5 });

  // --- Refs to control child components imperatively ---
  // Controls the hidden FlightSimulationController (start/pause/stop/reset)
  const flightSimulationRef = useRef<FlightSimulationRef>(null);

  // Controls the HorizontalConfig component to reset preset selections
  const horizontalConfigRef = useRef<HorizontalConfigRef>(null);

  // Track if params have changed from defaults
  const defaultCamera = {
    fx: 2000,
    fy: 2000,
    cx: 2000,
    cy: 1500,
    sensor_size_x_mm: 13.2,
    sensor_size_y_mm: 8.8,
    image_size_x: 4000,
    image_size_y: 3000,
  };
  const defaultDatasetSpec = {
    overlap: 0.75,
    sidelap: 0.65,
    height: 30.5,
    scan_dimension_x: 150,
    scan_dimension_y: 150,
    exposure_time_ms: 2.0,
  };
  const paramsChanged =
    JSON.stringify(camera) !== JSON.stringify(defaultCamera) ||
    JSON.stringify(datasetSpec) !== JSON.stringify(defaultDatasetSpec) ||
    (droneConfig.vMax !== 16 || droneConfig.aMax !== 3.5);
  const canShowReset = paramsChanged || waypoints.length > 0;

  /**
   * Generate a flight plan from the current camera and dataset specifications.
   *
   * @returns A promise that resolves when generation completes. On success it
   * updates waypoints and mission stats; on failure it sets a user-friendly
   * validation error message.
   */
  const handleGenerateFlightPlan = async () => {
    handleSoftReset();
    setIsGenerating(true);
    setValidationError(null);

    // Small delay to allow loading UI to be visible
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Core flight plan generation and stats computation
      // Pass droneConfig so waypoints receive correctly-clamped speeds at generation time
      const generatedWaypoints = generatePhotoPlaneOnGrid(camera, datasetSpec, droneConfig);
      const stats = computeMissionStats(generatedWaypoints, camera, datasetSpec, droneConfig);

      // Persist outputs for visualization and summary
      setWaypoints(generatedWaypoints);
      setMissionStats(stats);
    } catch (error) {
      // Convert technical errors into user-facing messages
      console.error("Error generating flight plan:", error);
      if (error instanceof Error) {
        let userMessage = error.message;
        if (error.message.includes("overlap must be in [0, 1)")) {
          userMessage =
            "Forward overlap must be between 0% and 95%. Please adjust your overlap setting.";
        } else if (error.message.includes("sidelap must be in [0, 1)")) {
          userMessage =
            "Side overlap must be between 0% and 95%. Please adjust your sidelap setting.";
        } else {
          userMessage =
            "Unable to generate flight plan. Please check your configuration parameters.";
        }
        setValidationError(userMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Receive simulation updates from the FlightSimulationController and forward
   * them to local state so other components can react to simulation progress.
   *
   * @param state - Current simulation state provided by the controller
   * @returns void
   */
  const handleSimulationUpdate = (state: SimulationState) => {
    // Update local copy so CompactMissionStats and FlightPathVisualization can consume it
    setSimulationState(state);
  };

  /**
   * Perform a soft reset of generated mission data and UI state without
   * changing the camera or dataset specifications.
   * 
   * @returns void
   */
  const handleSoftReset = () => {
    // Clear generated mission data and UI state
    setWaypoints([]);
    setMissionStats(null);
    setValidationError(null);
    setSimulationState(null);

    // Reset child components via refs
    flightSimulationRef.current?.resetSimulation();
  }

  /**
   * Reset the application configuration and generated flight data to defaults.
   *
   * @remarks
   * Resets camera, datasetSpec, clears waypoints and mission stats, clears
   * validation errors, resets the simulation controller and any selected presets.
   *
   * @returns void
   */
  const handleReset = () => {
    // Reset camera and dataset spec to their initial defaults
    setCamera({
      fx: 2000,
      fy: 2000,
      cx: 2000,
      cy: 1500,
      sensor_size_x_mm: 13.2,
      sensor_size_y_mm: 8.8,
      image_size_x: 4000,
      image_size_y: 3000,
    });

    setDatasetSpec({
      overlap: 0.75,
      sidelap: 0.65,
      height: 30.5,
      scan_dimension_x: 150,
      scan_dimension_y: 150,
      exposure_time_ms: 2.0,
    });

    // Clear generated mission data and UI state
    setWaypoints([]);
    setMissionStats(null);
    setValidationError(null);
    setSimulationState(null);

    // Reset child components via refs
    flightSimulationRef.current?.resetSimulation();
    horizontalConfigRef.current?.resetPresets();
  };

  // --- Render application UI ---
  return (
    <div className="bg-background min-h-screen">
      {/* Header: app title, docs link, and user profile */}
      <header className="border-border bg-card/50 sticky top-0 z-40 border-b backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-3">
          <div className="flex min-h-[64px] items-center justify-between gap-4">
            {/* Left Side - compact logo + title (responsive, single-row friendly) */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Logo hidden on very small screens to maximize header space */}
              <div className="hidden sm:flex bg-primary h-9 w-9 items-center justify-center rounded-lg shadow-sm flex-shrink-0">
                <Plane className="text-primary-foreground h-5 w-5" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h1 className="text-foreground text-base sm:text-lg md:text-2xl leading-tight font-bold whitespace-nowrap">
                  Drone Flight Planner
                </h1>
                {/* subtitle hidden on very small screens to keep header compact */}
                <p className="text-muted-foreground text-xs md:text-sm leading-tight hidden sm:block">
                  Mission Planning System
                </p>
              </div>
            </div>

            {/* Right Side - Navigation (compact on mobile; stays on one row) */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 whitespace-nowrap">
              {/* Feedback Button */}
              <FeedbackButton />

              {/* Technical Documentation Link */}
              <a
                href="https://github.com/devenshah2018/drone-trajectory"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/50 flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm sm:px-4 sm:py-2.5 transition-all duration-200"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-1 hidden xs:inline-block sm:inline-block">Technical Docs</span>
              </a>

              {/* Divider */}
              <div className="bg-border/50 h-6 w-px mx-2"></div>

              {/* Author Profile with Dropdown */}
              <div className="flex items-center ml-1">
                <AuthorProfile />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile stacked panel removed — header now displays all controls inline on one row for small screens */}
      </header>

      <main className="container mx-auto space-y-6 px-6 py-6">
        {/* Configuration panel: camera and mission parameters (keeps map visible) */}
        <HorizontalConfig
          ref={horizontalConfigRef}
          camera={camera}
          datasetSpec={datasetSpec}
          onCameraChange={setCamera}
          onDatasetSpecChange={setDatasetSpec}
          droneConfig={droneConfig}
          onDroneChange={(cfg) => setDroneConfig(cfg)}
        />

        {/* Main content grid: map visual (2 cols) + stats (1 col) */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Flight Path Visualization - primary map view (larger area) */}
          <div className="xl:col-span-2">
            <FlightPathVisualization
              waypoints={waypoints}
              simulationState={simulationState || undefined}
              missionStats={missionStats ?? undefined}
              onStartSimulation={() => flightSimulationRef.current?.startSimulation()}
              onPauseSimulation={() => flightSimulationRef.current?.pauseSimulation()}
              onStopSimulation={() => flightSimulationRef.current?.stopSimulation()}
              onResetSimulation={() => flightSimulationRef.current?.resetSimulation()}
            />
          </div>

          {/* Right column: compact mission stats and waypoint table */}
          <div className="space-y-6 xl:col-span-1">
            <CompactMissionStats
              stats={missionStats}
              waypoints={waypoints}
              simulationState={simulationState || undefined}
              droneConfig={droneConfig}
            />
          </div>
        </div>

        {/* Hidden simulation controller: provides animation/state but not visible */}
        {waypoints.length >= 2 && (
          <div className="hidden">
            <FlightSimulationController
              waypoints={waypoints}
              onSimulationUpdate={handleSimulationUpdate}
              ref={flightSimulationRef}
              droneConfig={droneConfig}
            />
          </div>
        )}
      </main>

      {/* Floating Generate Button: triggers plan generation or reset */}
      <FloatingGenerateButton
        onGenerate={handleGenerateFlightPlan}
        onReset={handleReset}
        isGenerating={isGenerating}
        showReset={canShowReset}
      />

      {/* Validation Error Toast: shows user-friendly configuration errors */}
      {validationError && (
        <div className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 transform">
          <div className="bg-destructive/90 text-destructive-foreground border-destructive/20 rounded-lg border px-6 py-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <svg
                className="text-destructive-foreground mt-0.5 h-5 w-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium">Configuration Error</p>
                <p className="mt-1 text-sm opacity-90">{validationError}</p>
              </div>
              <button
                onClick={() => setValidationError(null)}
                className="text-destructive-foreground/70 hover:text-destructive-foreground ml-auto flex-shrink-0"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

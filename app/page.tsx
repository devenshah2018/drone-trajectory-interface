"use client";

import { useState, useRef } from "react";
import type { Camera, DatasetSpec, Waypoint, MissionStats } from "@/lib/types";
import { generatePhotoPlaneOnGrid, computeMissionStats } from "@/lib/flight-planner";
import { Plane, Download, ClipboardList, Link } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";

const releaseVersion = process.env.NEXT_PUBLIC_RELEASE || "v0.0.0";

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
  const [showExportBadges, setShowExportBadges] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);

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

  const canShowExport = waypoints.length > 0;

  // Export handlers
  function exportCSV() {
    if (!waypoints.length) return;
    const header = Object.keys(waypoints[0]).join(",");
    const rows = waypoints.map(wp => Object.values(wp).join(",")).join("\n");
    const csv = header + "\n" + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flight-plan.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJSON() {
    const data = {
      camera,
      datasetSpec,
      droneConfig,
      waypoints,
      missionStats,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flight-plan.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: "landscape" });
    const data = {
      camera,
      datasetSpec,
      droneConfig,
      waypoints,
      missionStats,
    };
    const text = JSON.stringify(data, null, 2);
    const pageWidth = 280; // fit to page width
    const pageHeight = 200; // jsPDF landscape default
    const marginLeft = 10;
    const marginTop = 10;
    const lineHeight = 4.5; // for fontSize 8
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(text, pageWidth);
    let y = marginTop;
    for (let i = 0; i < lines.length; i++) {
      if (y + lineHeight > pageHeight - marginTop) {
        doc.addPage();
        y = marginTop;
      }
      doc.text(lines[i], marginLeft, y);
      y += lineHeight;
    }
    doc.save("flight-plan.pdf");
  }

  /**
   * Generate a flight plan from the current camera and dataset specifications.
   *
   * @returns A promise that resolves when generation completes. On success it
   * updates waypoints and mission stats; on failure it sets a user-friendly
   * validation error message.
   */
  const handleGenerateFlightPlan = async () => {
    horizontalConfigRef.current?.fillBlankFieldsWithPresets();
    const latestVMax = horizontalConfigRef.current?.getDroneVMax?.() ?? 16;
    const latestAMax = horizontalConfigRef.current?.getDroneAMax?.() ?? 3.5;
    const effectiveDroneConfig = { vMax: latestVMax, aMax: latestAMax };
    const latestCamera = { ...camera };
    const cameraKeys: (keyof Camera)[] = [
      "fx", "fy", "cx", "cy", "sensor_size_x_mm", "sensor_size_y_mm", "image_size_x", "image_size_y"
    ];
    for (const key of cameraKeys) {
      if (
        latestCamera[key] === undefined ||
        latestCamera[key] === null ||
        isNaN(Number(latestCamera[key]))
      ) {
        latestCamera[key] = horizontalConfigRef.current?.getCameraPreset?.()[key] ?? latestCamera[key];
      }
    }

    const latestDatasetSpec = { ...datasetSpec };
    const missionKeys: (keyof DatasetSpec)[] = [
      "overlap", "sidelap", "height", "scan_dimension_x", "scan_dimension_y", "exposure_time_ms"
    ];
    for (const key of missionKeys) {
      if (
        latestDatasetSpec[key] === undefined ||
        latestDatasetSpec[key] === null ||
        isNaN(Number(latestDatasetSpec[key]))
      ) {
        latestDatasetSpec[key] = horizontalConfigRef.current?.getMissionPreset?.()[key] ?? latestDatasetSpec[key];
      }
    }

    setDroneConfig(effectiveDroneConfig);
    setCamera(latestCamera);
    setDatasetSpec(latestDatasetSpec);

    handleSoftReset();
    setIsGenerating(true);
    setValidationError(null);
    setPlanGenerated(false);
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Generating flight plan with config:", { camera: latestCamera, datasetSpec: latestDatasetSpec, droneConfig: effectiveDroneConfig });
    try {
      const generatedWaypoints = generatePhotoPlaneOnGrid(latestCamera, latestDatasetSpec, effectiveDroneConfig);
      const stats = computeMissionStats(generatedWaypoints, latestCamera, latestDatasetSpec, effectiveDroneConfig);
      setWaypoints(generatedWaypoints);
      setMissionStats(stats);
      setPlanGenerated(true);
    } catch (error) {
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
    setPlanGenerated(false);

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
    setPlanGenerated(false);

    // Reset child components via refs
    flightSimulationRef.current?.resetSimulation();
    horizontalConfigRef.current?.resetPresets();
  };

  // --- Render application UI ---
  // Handler to hide export badges when clicking outside
  function handleMainClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    // Only hide if export badges are open and click is not on the export button or badges
    if (showExportBadges) {
      // Check if click is inside the export button or badges
      const exportButton = document.getElementById("export-fab-root");
      if (exportButton && exportButton.contains(e.target as Node)) return;
      setShowExportBadges(false);
    }
  }

  return (
    <div className="bg-background min-h-screen" onClick={handleMainClick}>
      {/* Header: app title, docs link, and user profile */}
      <header className="border-b border-border bg-card/80 sticky top-0 z-50 shadow-sm backdrop-blur-md">
        <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-6 py-2 sm:py-3 min-h-[64px] gap-2 sm:gap-0">
          <div className="flex flex-row items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto">
            <div className="bg-primary sm:h-10 sm:w-10 h-7 w-7 flex items-center justify-center rounded-lg shadow flex-shrink-0">
              <Plane className="text-primary-foreground h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div className="flex flex-col justify-center min-w-0 w-full">
              <div className="flex items-center w-full">
                <h1 className="text-foreground text-md sm:text-xl md:text-2xl font-bold tracking-tight whitespace-nowrap leading-tight flex items-center gap-2">
                  Drone Flight Planner
                  <Badge
                    className="min-w-0! ml-2 px-3 py-1 text-[11px] font-medium cursor-pointer bg-blue-500! text-white rounded-full hover:bg-blue-600! focus:outline-none focus:ring-1 focus:ring-blue-300 transition-all duration-150"
                    style={{
                      letterSpacing: '0.01em',
                      textAlign: 'center',
                      minWidth: '44px',
                    }}
                    onClick={() => window.open("https://github.com/devenshah2018/drone-trajectory-interface/blob/main/CHANGELOG.md", "_blank")}
                    title={`Release: ${releaseVersion}`}
                    tabIndex={0}
                    aria-label={`View release changelog for version ${releaseVersion}`}
                  >
                    <Link className="h-3 w-3" />
                    <span className="hidden sm:block">{releaseVersion}</span>
                  </Badge>
                </h1>
                {/* Mobile: float docs and feedback all the way right */}
                <div className="flex sm:hidden items-center gap-2 flex-1 justify-end ml-4 mt-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/50 transition-all duration-200 cursor-pointer px-2 py-1"
                    onClick={() => { window.open('https://github.com/devenshah2018/drone-trajectory', '_blank'); }}
                  >
                    <ClipboardList className="h-4 w-4" />
                  </Button>
                  <FeedbackButton />
                </div>
              </div>
              <span className="hidden sm:inline text-muted-foreground text-xs md:text-sm font-medium whitespace-nowrap leading-tight">
                Enterprise Mission Planning
              </span>
            </div>
          </div>
          <div className="hidden sm:flex flex-row items-center gap-4 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/50 transition-all duration-200 cursor-pointer"
              onClick={() => { window.open('https://github.com/devenshah2018/drone-trajectory-planner/blob/main/main.ipynb', '_blank'); }}
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Docs</span>
            </Button>
            <FeedbackButton />
            <AuthorProfile />
          </div>
          <div className="flex sm:hidden w-full justify-end mt-1">
            <AuthorProfile />
          </div>
        </div>
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
          planGenerated={planGenerated}
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
        exportButton={canShowExport ? (
          <div id="export-fab-root" className="relative flex flex-col items-center">
            <AnimatePresence>
              {showExportBadges && (
              <motion.div
                key="badges"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.18 }}
                className="absolute bottom-14 flex flex-col gap-2 items-center z-10"
              >
                <Badge
                onClick={exportCSV}
                className="cursor-pointer select-none w-20 text-center bg-white hover:bg-gray-100 border border-border/50 !text-black hover:!text-black shadow-lg backdrop-blur-sm"
                >
                CSV
                </Badge>
                <Badge
                onClick={exportJSON}
                className="cursor-pointer select-none w-20 text-center bg-white hover:bg-gray-100 border border-border/50 !text-black hover:!text-black shadow-lg backdrop-blur-sm"
                >
                JSON
                </Badge>
                <Badge
                onClick={exportPDF}
                className="cursor-pointer select-none w-20 text-center bg-white hover:bg-gray-100 border border-border/50 !text-black hover:!text-black shadow-lg backdrop-blur-sm"
                >
                PDF
                </Badge>
              </motion.div>
              )}
            </AnimatePresence>
            <button
              className="bg-card/90 hover:bg-card border-border/50 hover:border-border h-12 w-12 cursor-pointer rounded-full p-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl flex items-center justify-center"
              style={{ border: '1px solid var(--border)' }}
              onClick={e => { e.stopPropagation(); setShowExportBadges(v => !v); }}
              type="button"
              title="Export"
            >
              <Download className="text-muted-foreground h-5 w-5" />
            </button>
          </div>
        ) : null}
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
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
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

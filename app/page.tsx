"use client";

import { useState, useRef, useEffect } from "react";
import type { Camera, DatasetSpec, Waypoint, MissionStats } from "@/lib/types";
import { generatePhotoPlaneOnGrid, computeMissionStats } from "@/lib/flight-planner";
import { Rocket, Download, ClipboardList, ScrollText, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HorizontalConfig, type HorizontalConfigRef } from "@/components/horizontal-config";
import { FlightPathVisualization } from "@/components/flight-path-visualization";
import { CompactMissionStats } from "@/components/compact-mission-stats";
import { AuthorProfile } from "@/components/author-profile";
import { ChangelogDialog } from "@/components/changelog-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  FlightSimulationController,
  type SimulationState,
  type FlightSimulationRef,
} from "@/components/flight-simulation-controller";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

import { currentVersion } from "@/lib/changelog";

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
  const [changelogOpen, setChangelogOpen] = useState(false);

  // Only pass changelog open state to the visible ChangelogDialog (avoids double popover)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 640px)");
    setIsMobile(m.matches);
    const h = () => setIsMobile(m.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);

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
  function exportExcel() {
    const configRows: string[][] = [];
    configRows.push(["Camera Config", "", ""]);
    [
      ["fx", camera.fx, "px"],
      ["fy", camera.fy, "px"],
      ["cx", camera.cx, "px"],
      ["cy", camera.cy, "px"],
      ["sensor_size_x_mm", camera.sensor_size_x_mm, "mm"],
      ["sensor_size_y_mm", camera.sensor_size_y_mm, "mm"],
      ["image_size_x", camera.image_size_x, "px"],
      ["image_size_y", camera.image_size_y, "px"],
    ].forEach(([k, v, u]) => configRows.push([`${k} [${u}]`, String(v), ""]));
    configRows.push(["", "", ""]);
    configRows.push(["Drone Config", "", ""]);
    [
      ["vMax", droneConfig.vMax, "m/s"],
      ["aMax", droneConfig.aMax, "m/s²"],
    ].forEach(([k, v, u]) => configRows.push([`${k} [${u}]`, String(v), ""]));
    configRows.push(["", "", ""]);
    configRows.push(["Mission Config", "", ""]);
    [
      ["overlap", datasetSpec.overlap, "ratio"],
      ["sidelap", datasetSpec.sidelap, "ratio"],
      ["height", datasetSpec.height, "m"],
      ["scan_dimension_x", datasetSpec.scan_dimension_x, "m"],
      ["scan_dimension_y", datasetSpec.scan_dimension_y, "m"],
      ["exposure_time_ms", datasetSpec.exposure_time_ms, "ms"],
    ].forEach(([k, v, u]) => configRows.push([`${k} [${u}]`, String(v), ""]));
    configRows.push(["", "", ""]);
    if (missionStats) {
      configRows.push(["Mission Stats", "", ""]);
      Object.entries(missionStats).forEach(([k, v]) => configRows.push([k, String(v), ""]));
    }
    const sectionIdxs = configRows
      .map((row, i) => row[1] === "" && row[2] === "" ? i : -1)
      .filter(i => i !== -1);
    const configWS = XLSX.utils.aoa_to_sheet(configRows);
    sectionIdxs.forEach(idx => {
      if (configWS["A" + (idx+1)]) configWS["A" + (idx+1)].s = { font: { bold: true, sz: 13 }, fill: { fgColor: { rgb: "DDEEFF" } } };
    });
    let waypointSheet: any[][] = [];
    if (waypoints.length) {
      const headers = Object.keys(waypoints[0]);
      const units: Record<string, string> = {
        x: "m",
        y: "m",
        z: "m",
        lat: "°",
        lon: "°",
        alt: "m",
        speed: "m/s",
        time: "s",
        heading: "°",
        gimbal_pitch: "°",
        gimbal_yaw: "°",
        photo: "",
      };
      const headerRow = headers.map(h => units[h] ? `${h} [${units[h]}]` : h);
      waypointSheet = [
        headerRow,
        ...waypoints.map(wp => headers.map(h => (wp as any)[h]))
      ];
    } else {
      waypointSheet = [["No waypoints generated"]];
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, configWS, "Config");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(waypointSheet), "Waypoints");
    XLSX.writeFile(wb, "flight-plan.xlsx");
  }

  function exportJSON() {
    const data = {
      config: { camera, datasetSpec, droneConfig, missionStats },
      waypoints,
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
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Drone Flight Plan Report", 12, 18);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 12, 26);
    doc.setLineWidth(0.5);
    doc.line(12, 30, 280, 30);

    let y = 38;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Camera Configuration", 12, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    [
      ["fx", camera.fx, "px"],
      ["fy", camera.fy, "px"],
      ["cx", camera.cx, "px"],
      ["cy", camera.cy, "px"],
      ["sensor_size_x_mm", camera.sensor_size_x_mm, "mm"],
      ["sensor_size_y_mm", camera.sensor_size_y_mm, "mm"],
      ["image_size_x", camera.image_size_x, "px"],
      ["image_size_y", camera.image_size_y, "px"],
    ].forEach(([k, v, u]) => {
      doc.text(`${k} [${u}]`, 16, y);
      doc.text(String(v), 60, y);
      y += 6;
    });

    y += 4;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Drone Configuration", 12, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    [
      ["vMax", droneConfig.vMax, "m/s"],
      ["aMax", droneConfig.aMax, "m/s²"],
    ].forEach(([k, v, u]) => {
      doc.text(`${k} [${u}]`, 16, y);
      doc.text(String(v), 60, y);
      y += 6;
    });

    y += 4;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Mission Configuration", 12, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    [
      ["overlap", datasetSpec.overlap, "ratio"],
      ["sidelap", datasetSpec.sidelap, "ratio"],
      ["height", datasetSpec.height, "m"],
      ["scan_dimension_x", datasetSpec.scan_dimension_x, "m"],
      ["scan_dimension_y", datasetSpec.scan_dimension_y, "m"],
      ["exposure_time_ms", datasetSpec.exposure_time_ms, "ms"],
    ].forEach(([k, v, u]) => {
      doc.text(`${k} [${u}]`, 16, y);
      doc.text(String(v), 60, y);
      y += 6;
    });

    if (missionStats) {
      y += 4;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Mission Analysis", 12, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      Object.entries(missionStats).forEach(([k, v]) => {
        doc.text(k, 16, y);
        doc.text(String(v), 60, y);
        y += 6;
      });
    }

    y += 8;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Flight Path Visualization", 12, y);
    y += 4;
    const canvas = document.querySelector("#flight-path-canvas") as HTMLCanvasElement | null;
    if (canvas && typeof canvas.toDataURL === "function") {
      const imgData = canvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", 12, y, 120, 80);
      y += 84;
    }

    y += 8;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Waypoints (first 20)", 12, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (waypoints.length) {
      const headers = Object.keys(waypoints[0]);
      const units: Record<string, string> = {
        x: "m", y: "m", z: "m", lat: "°", lon: "°", alt: "m", speed: "m/s", time: "s", heading: "°", gimbal_pitch: "°", gimbal_yaw: "°", photo: ""
      };
      const headerRow = headers.map(h => units[h] ? `${h} [${units[h]}]` : h);
      doc.text(headerRow.join(" | "), 16, y);
      y += 6;
      waypoints.slice(0, 20).forEach(wp => {
        const row = headers.map(h => String((wp as any)[h]));
        doc.text(row.join(" | "), 16, y);
        y += 5;
        if (y > 190) { doc.addPage(); y = 18; }
      });
      if (waypoints.length > 20) {
        doc.text(`...and ${waypoints.length - 20} more`, 16, y);
      }
    } else {
      doc.text("No waypoints generated", 16, y);
    }

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Generated by Drone Flight Planner | github.com/devenshah2018/drone-trajectory", 12, 200);
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
            "Overlap must be between 0% and 95%. Please adjust your overlap setting.";
        } else if (error.message.includes("sidelap must be in [0, 1)")) {
          userMessage =
            "Sidelap must be between 0% and 95%. Please adjust your sidelap setting.";
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
      <header className="border-b border-border/20 bg-card/80 sticky top-0 z-50 shadow-sm backdrop-blur-md">
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between pl-0 sm:pl-4 pr-3 sm:pr-6 py-2 sm:py-3 min-h-[64px] gap-2 sm:gap-0">
          <div className="flex flex-row items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <div className="bg-black sm:h-10 sm:w-10 h-7 w-7 flex items-center justify-center rounded-lg shadow flex-shrink-0">
              <Rocket className="text-white h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div className="flex flex-col justify-center min-w-0 w-full">
              <div className="flex items-center w-full">
                <h1 className="text-foreground text-md sm:text-xl md:text-2xl font-bold tracking-tight whitespace-nowrap leading-tight flex items-center gap-2">
                  Drone Flight Simulator
                  <Badge
                    className="min-w-0! ml-2 px-3 py-1 text-[11px] font-medium cursor-pointer bg-[#0066FF]! text-white rounded-full hover:bg-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/50 focus:ring-offset-2 transition-all duration-150"
                    style={{
                      letterSpacing: '0.01em',
                      textAlign: 'center',
                      minWidth: '44px',
                    }}
                    onClick={(e) => { e.stopPropagation(); setChangelogOpen(true); }}
                    title={`Version ${currentVersion} — View changelog`}
                    tabIndex={0}
                    aria-label={`View changelog for version ${currentVersion}`}
                  >
                    <span>{currentVersion}</span>
                  </Badge>
                </h1>
                {/* Mobile: float docs all the way right */}
                <div className="flex sm:hidden items-center gap-2 flex-1 justify-end ml-4 mt-0.5">
                  <ChangelogDialog
                    open={isMobile ? changelogOpen : undefined}
                    onOpenChange={isMobile ? setChangelogOpen : undefined}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200 cursor-pointer px-2 py-1"
                    onClick={() => { window.open('https://github.com/devenshah2018/drone-trajectory', '_blank'); }}
                  >
                    <ClipboardList className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <span className="hidden sm:inline text-muted-foreground text-xs md:text-sm font-medium whitespace-nowrap leading-tight">
                Path Planner for Aerial Imaging
              </span>
            </div>
          </div>
          <div className="hidden sm:flex flex-row items-center gap-4 w-full sm:w-auto justify-end">
            <ChangelogDialog
              open={!isMobile ? changelogOpen : undefined}
              onOpenChange={!isMobile ? setChangelogOpen : undefined}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200 cursor-pointer"
              onClick={() => { window.open('https://github.com/devenshah2018/drone-trajectory-planner/blob/main/main.ipynb', '_blank'); }}
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Docs</span>
            </Button>
            <AuthorProfile />
          </div>
          <div className="flex sm:hidden w-full justify-end mt-1">
            <AuthorProfile />
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-4rem)] w-full">
        {/* Left: action buttons + configuration sidepanel */}
        <aside className="shrink-0 w-[280px] flex flex-col border-r border-border/30 bg-card/95 backdrop-blur-sm">
          {/* Generate, Reset, Export - above config */}
          <div className="px-4 pt-4 pb-3 flex flex-col gap-2 border-b border-border/20">
            <Button
              onClick={handleGenerateFlightPlan}
              disabled={isGenerating}
              className="bg-[#0066FF] hover:bg-[#0052CC] text-white h-11 w-full font-medium rounded-lg flex items-center justify-center gap-2 shadow-sm hover:shadow transition-shadow"
            >
              {isGenerating ? (
                <>
                  <div className="border-white/30 border-t-white h-4 w-4 animate-spin rounded-full border-2" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  <span>Generate Flight Plan</span>
                </>
              )}
            </Button>
            <div className="flex gap-2">
              {canShowReset && (
                <Button
                  onClick={handleReset}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </Button>
              )}
              {canShowExport && (
                <Popover open={showExportBadges} onOpenChange={setShowExportBadges}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 h-9 gap-1.5">
                      <Download className="h-3.5 w-3.5" />
                      <span>Export</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" side="bottom" className="w-48 p-2">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => { exportExcel(); setShowExportBadges(false); }}
                        className="px-3 py-2 text-sm text-left rounded-md hover:bg-muted transition-colors"
                      >
                        Excel
                      </button>
                      <button
                        onClick={() => { exportJSON(); setShowExportBadges(false); }}
                        className="px-3 py-2 text-sm text-left rounded-md hover:bg-muted transition-colors"
                      >
                        JSON
                      </button>
                      <button
                        onClick={() => { exportPDF(); setShowExportBadges(false); }}
                        className="px-3 py-2 text-sm text-left rounded-md hover:bg-muted transition-colors"
                      >
                        PDF
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
          <HorizontalConfig
            ref={horizontalConfigRef}
            camera={camera}
            datasetSpec={datasetSpec}
            onCameraChange={setCamera}
            onDatasetSpecChange={setDatasetSpec}
            droneConfig={droneConfig}
            onDroneChange={(cfg) => setDroneConfig(cfg)}
            planGenerated={planGenerated}
            variant="sidepanel"
          />
        </aside>

        {/* Right: visualization + stats */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 container mx-auto px-4 py-4 sm:px-6 sm:py-6 w-full">
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
              cameraConfig={camera}
              missionConfig={datasetSpec}
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
          </div>
        </div>
      </main>

      {/* Validation Error Toast: shows user-friendly configuration errors */}
      {validationError && (
        <div className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 transform">
          <div className="bg-destructive/90 text-destructive-foreground rounded-lg px-6 py-4 shadow-lg backdrop-blur-sm">
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

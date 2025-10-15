"use client"

import { useState, useRef } from "react"
import type { Camera, DatasetSpec, Waypoint, MissionStats } from "@/lib/types"
import { generatePhotoPlaneOnGrid, computeMissionStats } from "@/lib/flight-planner"
import { Plane, ExternalLink } from "lucide-react"
import { HorizontalConfig } from "@/components/horizontal-config"
import { FlightPathVisualization } from "@/components/flight-path-visualization"
import { CompactMissionStats } from "@/components/compact-mission-stats"
import { FloatingGenerateButton } from "@/components/floating-generate-button"
import { AuthorProfile } from "@/components/author-profile"
import { FlightSimulationController, type SimulationState, type FlightSimulationRef } from "@/components/flight-simulation-controller"

export default function Home() {
  // Default camera configuration (typical drone camera)
  const [camera, setCamera] = useState<Camera>({
    fx: 2000,
    fy: 2000,
    cx: 2000,
    cy: 1500,
    sensor_size_x_mm: 13.2,
    sensor_size_y_mm: 8.8,
    image_size_x: 4000,
    image_size_y: 3000,
  })

  // Default dataset specification
  const [datasetSpec, setDatasetSpec] = useState<DatasetSpec>({
    overlap: 0.75,
    sidelap: 0.65,
    height: 30.5,
    scan_dimension_x: 150,
    scan_dimension_y: 150,
    exposure_time_ms: 2.0,
  })

  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [missionStats, setMissionStats] = useState<MissionStats | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null)
  
  // Ref for flight simulation controller
  const flightSimulationRef = useRef<FlightSimulationRef>(null)

  const handleGenerateFlightPlan = async () => {
    setIsGenerating(true)
    setValidationError(null)
    
    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      const generatedWaypoints = generatePhotoPlaneOnGrid(camera, datasetSpec)
      const stats = computeMissionStats(generatedWaypoints, camera, datasetSpec)
      setWaypoints(generatedWaypoints)
      setMissionStats(stats)
    } catch (error) {
      console.error('Error generating flight plan:', error)
      if (error instanceof Error) {
        // Convert technical errors to user-friendly messages
        let userMessage = error.message
        if (error.message.includes('overlap must be in [0, 1)')) {
          userMessage = 'Forward overlap must be between 0% and 95%. Please adjust your overlap setting.'
        } else if (error.message.includes('sidelap must be in [0, 1)')) {
          userMessage = 'Side overlap must be between 0% and 95%. Please adjust your sidelap setting.'
        } else {
          userMessage = 'Unable to generate flight plan. Please check your configuration parameters.'
        }
        setValidationError(userMessage)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSimulationUpdate = (state: SimulationState) => {
    setSimulationState(state)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between min-h-[60px]">
            {/* Left Side - Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <Plane className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-bold text-foreground leading-tight">Drone Flight Planner</h1>
                <p className="text-sm text-muted-foreground leading-tight">Mission Planning System</p>
              </div>
            </div>
            
            {/* Right Side - Navigation */}
            <div className="flex items-center gap-3">
              {/* Technical Documentation Link */}
              <a
                href="https://github.com/devenshah2018/drone-trajectory"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border/50"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span>Technical Docs</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
              
              {/* Divider */}
              <div className="w-px h-6 bg-border/50"></div>
              
              {/* Author Profile with Dropdown */}
              <div className="flex items-center">
                <AuthorProfile />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Horizontal Configuration */}
        <HorizontalConfig
          camera={camera}
          datasetSpec={datasetSpec}
          onCameraChange={setCamera}
          onDatasetSpecChange={setDatasetSpec}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Flight Path Visualization - Takes up 2 columns */}
          <div className="xl:col-span-2">
            <FlightPathVisualization 
              waypoints={waypoints} 
              simulationState={simulationState || undefined}
              onStartSimulation={() => flightSimulationRef.current?.startSimulation()}
              onPauseSimulation={() => flightSimulationRef.current?.pauseSimulation()}
              onStopSimulation={() => flightSimulationRef.current?.stopSimulation()}
              onResetSimulation={() => flightSimulationRef.current?.resetSimulation()}
            />
          </div>

          {/* Right Column - Mission Stats */}
          <div className="xl:col-span-1 space-y-6">
            {/* Mission Statistics */}
            <CompactMissionStats stats={missionStats} waypoints={waypoints} />
          </div>
        </div>

        {/* Hidden Flight Simulation Controller (provides logic only) */}
        {waypoints.length >= 2 && (
          <div className="hidden">
            <FlightSimulationController
              waypoints={waypoints}
              onSimulationUpdate={handleSimulationUpdate}
              ref={flightSimulationRef}
            />
          </div>
        )}
      </main>

      {/* Floating Generate Button */}
      <FloatingGenerateButton 
        onGenerate={handleGenerateFlightPlan}
        isGenerating={isGenerating}
      />

      {/* Validation Error Toast */}
      {validationError && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <div className="bg-destructive/90 backdrop-blur-sm text-destructive-foreground px-6 py-4 rounded-lg shadow-lg border border-destructive/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-destructive-foreground mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium">Configuration Error</p>
                <p className="text-sm mt-1 opacity-90">{validationError}</p>
              </div>
              <button
                onClick={() => setValidationError(null)}
                className="ml-auto flex-shrink-0 text-destructive-foreground/70 hover:text-destructive-foreground"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

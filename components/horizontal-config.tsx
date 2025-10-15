"use client"

import { useState } from "react"
import type { Camera, DatasetSpec } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip } from "@/components/ui/tooltip"
import { Camera as CameraIcon, Settings, Focus, Grid3X3, Layers, Ruler, Plane, HelpCircle, Download } from "lucide-react"

interface HorizontalConfigProps {
  camera: Camera
  datasetSpec: DatasetSpec
  onCameraChange: (camera: Camera) => void
  onDatasetSpecChange: (datasetSpec: DatasetSpec) => void
}

export function HorizontalConfig({ 
  camera, 
  datasetSpec, 
  onCameraChange, 
  onDatasetSpecChange 
}: HorizontalConfigProps) {
  const [activeTab, setActiveTab] = useState("camera")
  const [selectedPreset, setSelectedPreset] = useState("")
  const [selectedMissionPreset, setSelectedMissionPreset] = useState("")

  // Camera presets
  const cameraPresets = {
    'skydio-vt300l-wide': {
      name: 'Skydio VT300L - Wide',
      description: 'Professional mapping camera with wide field of view',
      config: {
        fx: 4938.56,
        fy: 4936.49,
        cx: 4095.5,
        cy: 3071.5,
        sensor_size_x_mm: 13.107,
        sensor_size_y_mm: 9.830,
        image_size_x: 8192,
        image_size_y: 6144
      }
    }
  }

  // Mission presets
  const missionPresets = {
    'nominal': {
      name: 'Nominal Survey',
      description: 'Standard mapping mission with balanced coverage and efficiency',
      config: {
        overlap: 0.7,
        sidelap: 0.7,
        height: 30.48, // 100 ft
        scan_dimension_x: 150,
        scan_dimension_y: 150,
        exposure_time_ms: 2 // 1/500 exposure time
      }
    }
  }

  const updateCamera = (field: keyof Camera, value: number) => {
    onCameraChange({ ...camera, [field]: value })
  }

  const updateDatasetSpec = (field: keyof DatasetSpec, value: number) => {
    onDatasetSpecChange({ ...datasetSpec, [field]: value })
  }

  const loadCameraPreset = (presetKey: string) => {
    const preset = cameraPresets[presetKey as keyof typeof cameraPresets]
    if (preset) {
      onCameraChange(preset.config as Camera)
      setSelectedPreset(presetKey)
    }
  }

  const loadMissionPreset = (presetKey: string) => {
    const preset = missionPresets[presetKey as keyof typeof missionPresets]
    if (preset) {
      onDatasetSpecChange(preset.config as DatasetSpec)
      setSelectedMissionPreset(presetKey)
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-foreground">Mission Configuration</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Configure your camera and mission parameters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
            <button
              onClick={() => setActiveTab("camera")}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 gap-2 ${
                activeTab === "camera"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground cursor-pointer"
              }`}
            >
              <CameraIcon className="w-4 h-4" />
              Camera Settings
            </button>
            <button
              onClick={() => setActiveTab("mission")}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 gap-2 ${
                activeTab === "mission"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground cursor-pointer"
              }`}
            >
              <Settings className="w-4 h-4" />
              Mission Parameters
            </button>
          </div>

          <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab !== "camera" ? "hidden" : ""}`}>
            {/* Camera Preset Dropdown - Compact */}
            <div className="flex items-center justify-end mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Quick load:</span>
                <div className="relative">
                  <select 
                    className="appearance-none h-8 w-56 rounded-md border border-input bg-background/95 backdrop-blur-sm px-3 pr-8 text-xs font-medium text-foreground shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.value) {
                        loadCameraPreset(e.target.value)
                      }
                    }}
                    value={selectedPreset}
                  >
                    <option value="" disabled className="text-muted-foreground">Select camera preset...</option>
                    {Object.entries(cameraPresets).map(([key, preset]) => (
                      <option key={key} value={key} className="text-foreground bg-background">
                        {preset.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Download className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
                <Tooltip content="Load pre-configured camera settings for popular drone models based on manufacturer specifications." side="left">
                  <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground  transition-colors" />
                </Tooltip>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 min-h-[240px]">
              {/* Focal Length Section */}
              <div className="space-y-4 flex flex-col h-full">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Focus className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Focal Length</h3>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="fx" className="text-sm font-medium text-foreground">
                        X-axis (pixels)
                      </Label>
                      <Tooltip content={
                        <div className="space-y-2">
                          <p className="font-medium">Focal Length X-axis (pixels)</p>
                          <p className="text-sm">Horizontal focal length in the pinhole camera model.</p>
                          <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                            <div>Projection: u = f<sub>x</sub> × (X/Z) + c<sub>x</sub></div>
                            <div>FOV: θ<sub>x</sub> = 2 × arctan(w/(2×f<sub>x</sub>))</div>
                          </div>
                          <p className="text-xs text-muted-foreground">Higher values = telephoto, Lower values = wide-angle</p>
                        </div>
                      } side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                      </Tooltip>
                    </div>
                    <Input
                      id="fx"
                      type="number"
                      min="100"
                      max="10000"
                      step="1"
                      value={camera.fx}
                      onChange={(e) => updateCamera('fx', Number.parseFloat(e.target.value))}
                      className="bg-background border-input hover:border-primary/50 focus:border-primary transition-colors h-10"
                      placeholder="e.g., 2000"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="fy" className="text-sm font-medium text-foreground">
                        Y-axis (pixels)
                      </Label>
                      <Tooltip content={
                        <div className="space-y-2">
                          <p className="font-medium">Focal Length Y-axis (pixels)</p>
                          <p className="text-sm">Vertical focal length in the pinhole camera model.</p>
                          <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                            <div>Projection: v = f<sub>y</sub> × (Y/Z) + c<sub>y</sub></div>
                            <div>FOV: θ<sub>y</sub> = 2 × arctan(h/(2×f<sub>y</sub>))</div>
                          </div>
                          <p className="text-xs text-muted-foreground">Usually f<sub>x</sub> ≈ f<sub>y</sub> for square pixels</p>
                        </div>
                      } side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                      </Tooltip>
                    </div>
                    <Input
                      id="fy"
                      type="number"
                      min="100"
                      max="10000"
                      step="1"
                      value={camera.fy}
                      onChange={(e) => updateCamera('fy', Number.parseFloat(e.target.value))}
                      className="bg-background border-input hover:border-primary/50 focus:border-primary transition-colors h-10"
                      placeholder="e.g., 2000"
                    />
                  </div>
                </div>
              </div>

              {/* Principal Point & Sensor Section */}
              <div className="space-y-4 flex flex-col h-full">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Grid3X3 className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Principal Point & Sensor</h3>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="cx" className="text-xs font-medium text-foreground">
                          Principal X (px)
                        </Label>
                        <Tooltip content={
                          <div className="space-y-2">
                            <p className="font-medium">Principal Point X (pixels)</p>
                            <p className="text-sm">X-coordinate where optical axis meets image plane.</p>
                            <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                              <div>u = f<sub>x</sub> × (X/Z) + c<sub>x</sub></div>
                              <div>Ideally: c<sub>x</sub> ≈ width/2</div>
                            </div>
                            <p className="text-xs text-muted-foreground">Deviation from center indicates lens misalignment</p>
                          </div>
                        } side="right">
                          <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                        </Tooltip>
                      </div>
                      <Input
                        id="cx"
                        type="number"
                        min="0"
                        max="20000"
                        step="1"
                        value={camera.cx}
                        onChange={(e) => updateCamera('cx', Number.parseFloat(e.target.value))}
                        className="bg-background border-input hover:border-primary/50 focus:border-primary transition-colors h-10"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="cy" className="text-xs font-medium text-foreground">
                          Principal Y (px)
                        </Label>
                        <Tooltip content={
                          <div className="space-y-2">
                            <p className="font-medium">Principal Point Y (pixels)</p>
                            <p className="text-sm">Y-coordinate where optical axis meets image plane.</p>
                            <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                              <div>v = f<sub>y</sub> × (Y/Z) + c<sub>y</sub></div>
                              <div>Ideally: c<sub>y</sub> ≈ height/2</div>
                            </div>
                            <p className="text-xs text-muted-foreground">Critical for accurate photogrammetry</p>
                          </div>
                        } side="right">
                          <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                        </Tooltip>
                      </div>
                      <Input
                        id="cy"
                        type="number"
                        min="0"
                        max="20000"
                        step="1"
                        value={camera.cy}
                        onChange={(e) => updateCamera('cy', Number.parseFloat(e.target.value))}
                        className="bg-background border-input hover:border-primary/50 focus:border-primary transition-colors h-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="sensor_x" className="text-xs font-medium text-foreground">
                          Sensor W (mm)
                        </Label>
                        <Tooltip content={
                          <div className="space-y-2">
                            <p className="font-medium">Sensor Width (mm)</p>
                            <p className="text-sm">Physical sensor width for FOV calculations.</p>
                            <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                              <div>GSD = (h × s<sub>x</sub>) / (f<sub>x</sub> × w)</div>
                              <div>FOV<sub>x</sub> = 2 × arctan(s<sub>x</sub>/(2×f<sub>mm</sub>))</div>
                            </div>
                            <p className="text-xs text-muted-foreground">h=height, s=sensor, f=focal length, w=width</p>
                          </div>
                        } side="right">
                          <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                        </Tooltip>
                      </div>
                      <Input
                        id="sensor_x"
                        type="number"
                        min="1"
                        max="100"
                        step="0.1"
                        value={camera.sensor_size_x_mm}
                        onChange={(e) => updateCamera('sensor_size_x_mm', Number.parseFloat(e.target.value))}
                        className="bg-background border-input hover:border-primary/50 focus:border-primary transition-colors h-10"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="sensor_y" className="text-xs font-medium text-foreground">
                          Sensor H (mm)
                        </Label>
                        <Tooltip content={
                          <div className="space-y-2">
                            <p className="font-medium">Sensor Height (mm)</p>
                            <p className="text-sm">Physical sensor height for FOV calculations.</p>
                            <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                              <div>GSD = (h × s<sub>y</sub>) / (f<sub>y</sub> × h<sub>img</sub>)</div>
                              <div>FOV<sub>y</sub> = 2 × arctan(s<sub>y</sub>/(2×f<sub>mm</sub>))</div>
                            </div>
                            <p className="text-xs text-muted-foreground">Determines vertical field of view and coverage</p>
                          </div>
                        } side="right">
                          <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                        </Tooltip>
                      </div>
                      <Input
                        id="sensor_y"
                        type="number"
                        min="1"
                        max="100"
                        step="0.1"
                        value={camera.sensor_size_y_mm}
                        onChange={(e) => updateCamera('sensor_size_y_mm', Number.parseFloat(e.target.value))}
                        className="bg-background border-input hover:border-primary/50 focus:border-primary transition-colors h-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Resolution Section */}
              <div className="space-y-4 flex flex-col h-full">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <CameraIcon className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Image Resolution</h3>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="image_x" className="text-sm font-medium text-foreground">
                        Width (pixels)
                      </Label>
                      <Tooltip content={
                        <div className="space-y-2">
                          <p className="font-medium">Image Width (pixels)</p>
                          <p className="text-sm">Horizontal resolution of captured images.</p>
                          <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                            <div>pixel_size = sensor_width / image_width</div>
                            <div>c<sub>x</sub> ≈ image_width / 2</div>
                          </div>
                          <p className="text-xs text-muted-foreground">Must match camera's actual resolution</p>
                        </div>
                      } side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                      </Tooltip>
                    </div>
                    <Input
                      id="image_x"
                      type="number"
                      min="100"
                      max="20000"
                      step="1"
                      value={camera.image_size_x}
                      onChange={(e) => updateCamera('image_size_x', Number.parseInt(e.target.value))}
                      className="bg-background border-input hover:border-primary/50 focus:border-primary transition-colors h-10"
                      placeholder="e.g., 4000"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="image_y" className="text-sm font-medium text-foreground">
                        Height (pixels)
                      </Label>
                      <Tooltip content={
                        <div className="space-y-2">
                          <p className="font-medium">Image Height (pixels)</p>
                          <p className="text-sm">Vertical resolution of captured images.</p>
                          <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                            <div>pixel_size = sensor_height / image_height</div>
                            <div>c<sub>y</sub> ≈ image_height / 2</div>
                          </div>
                          <p className="text-xs text-muted-foreground">Determines aspect ratio and GSD accuracy</p>
                        </div>
                      } side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                      </Tooltip>
                    </div>
                    <Input
                      id="image_y"
                      type="number"
                      min="100"
                      max="20000"
                      step="1"
                      value={camera.image_size_y}
                      onChange={(e) => updateCamera('image_size_y', Number.parseInt(e.target.value))}
                      className="bg-background border-input hover:border-primary/50 focus:border-primary transition-colors h-10"
                      placeholder="e.g., 3000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab !== "mission" ? "hidden" : ""}`}>
            {/* Mission Preset Dropdown - Compact */}
            <div className="flex items-center justify-end mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Quick load:</span>
                <div className="relative">
                  <select 
                    className="appearance-none h-8 w-56 rounded-md border border-input bg-background/95 backdrop-blur-sm px-3 pr-8 text-xs font-medium text-foreground shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.value) {
                        loadMissionPreset(e.target.value)
                      }
                    }}
                    value={selectedMissionPreset}
                  >
                    <option value="" disabled className="text-muted-foreground">Select mission preset...</option>
                    {Object.entries(missionPresets).map(([key, preset]) => (
                      <option key={key} value={key} className="text-foreground bg-background">
                        {preset.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Download className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
                <Tooltip content="Load pre-configured mission parameters for standard survey operations with optimal coverage and efficiency." side="left">
                  <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground  transition-colors" />
                </Tooltip>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 min-h-[240px]">
              {/* Image Overlap Section */}
              <div className="space-y-4 flex flex-col h-full">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Image Overlap</h3>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="overlap" className="text-sm font-medium text-foreground">
                          Forward Overlap
                        </Label>
                        <Tooltip content={
                          <div className="space-y-2">
                            <p className="font-medium">Forward Overlap</p>
                            <p className="text-sm">Overlap between consecutive images along flight line.</p>
                            <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                              <div>d<sub>x</sub> = footprint<sub>x</sub> × (1 - overlap)</div>
                              <div>overlap = 1 - (d<sub>x</sub> / footprint<sub>x</sub>)</div>
                            </div>
                            <p className="text-xs text-muted-foreground">75-85% recommended for photogrammetry</p>
                          </div>
                        } side="top">
                          <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                        </Tooltip>
                      </div>
                      <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                        {(datasetSpec.overlap * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Input
                      id="overlap"
                      type="number"
                      step="0.05"
                      min="0"
                      max="0.95"
                      value={datasetSpec.overlap}
                      onChange={(e) => updateDatasetSpec('overlap', Number.parseFloat(e.target.value))}
                      className="h-10 bg-background border-input hover:border-primary/50 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="sidelap" className="text-sm font-medium text-foreground">
                          Side Overlap
                        </Label>
                        <Tooltip content={
                          <div className="space-y-2">
                            <p className="font-medium">Side Overlap</p>
                            <p className="text-sm">Overlap between adjacent parallel flight lines.</p>
                            <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                              <div>d<sub>y</sub> = footprint<sub>y</sub> × (1 - sidelap)</div>
                              <div>sidelap = 1 - (d<sub>y</sub> / footprint<sub>y</sub>)</div>
                            </div>
                            <p className="text-xs text-muted-foreground">60-70% recommended for 3D reconstruction</p>
                          </div>
                        } side="top">
                          <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                        </Tooltip>
                      </div>
                      <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                        {(datasetSpec.sidelap * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Input
                      id="sidelap"
                      type="number"
                      step="0.05"
                      min="0"
                      max="0.95"
                      value={datasetSpec.sidelap}
                      onChange={(e) => updateDatasetSpec('sidelap', Number.parseFloat(e.target.value))}
                      className="h-10 bg-background border-input hover:border-primary/50 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Flight Parameters Section */}
              <div className="space-y-4 flex flex-col h-full">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Plane className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Flight Parameters</h3>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="height" className="text-sm font-medium text-foreground">
                        Flight Height (meters)
                      </Label>
                      <Tooltip content={
                        <div className="space-y-2">
                          <p className="font-medium">Flight Height (meters AGL)</p>
                          <p className="text-sm">Altitude above ground level affecting resolution.</p>
                          <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                            <div>GSD = (h × s) / (f × w)</div>
                            <div>footprint = 2 × h × tan(FOV/2)</div>
                          </div>
                          <p className="text-xs text-muted-foreground">Higher altitude = lower resolution, larger coverage</p>
                        </div>
                      } side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                      </Tooltip>
                    </div>
                    <Input
                      id="height"
                      type="number"
                      min="5"
                      max="500"
                      step="0.5"
                      value={datasetSpec.height}
                      onChange={(e) => updateDatasetSpec('height', Number.parseFloat(e.target.value))}
                      className="h-10 bg-background border-input hover:border-primary/50 focus:border-primary transition-colors"
                      placeholder="e.g., 30.5"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="exposure" className="text-sm font-medium text-foreground">
                        Exposure Time (milliseconds)
                      </Label>
                      <Tooltip content={
                        <div className="space-y-2">
                          <p className="font-medium">Exposure Time (milliseconds)</p>
                          <p className="text-sm">Shutter speed to prevent motion blur.</p>
                          <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                            <div>max_speed = GSD / exposure_time</div>
                            <div>blur = speed × exposure_time</div>
                          </div>
                          <p className="text-xs text-muted-foreground">Lower exposure = higher max flight speed</p>
                        </div>
                      } side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                      </Tooltip>
                    </div>
                    <Input
                      id="exposure"
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      value={datasetSpec.exposure_time_ms}
                      onChange={(e) => updateDatasetSpec('exposure_time_ms', Number.parseFloat(e.target.value))}
                      className="h-10 bg-background border-input hover:border-primary/50 focus:border-primary transition-colors"
                      placeholder="e.g., 2.0"
                    />
                  </div>
                </div>
              </div>

              {/* Survey Area Section */}
              <div className="space-y-4 flex flex-col h-full">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Survey Area</h3>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="scan_x" className="text-sm font-medium text-foreground">
                        Width (meters)
                      </Label>
                      <Tooltip content={
                        <div className="space-y-2">
                          <p className="font-medium">Survey Area Width (meters)</p>
                          <p className="text-sm">East-west dimension of rectangular survey area.</p>
                          <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                            <div>n<sub>x</sub> = ⌈width / d<sub>x</sub>⌉ + 1</div>
                            <div>flight_lines = ⌈height / d<sub>y</sub>⌉ + 1</div>
                          </div>
                          <p className="text-xs text-muted-foreground">d = distance between images</p>
                        </div>
                      } side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                      </Tooltip>
                    </div>
                    <Input
                      id="scan_x"
                      type="number"
                      min="10"
                      max="10000"
                      step="1"
                      value={datasetSpec.scan_dimension_x}
                      onChange={(e) => updateDatasetSpec('scan_dimension_x', Number.parseFloat(e.target.value))}
                      className="h-10 bg-background border-input hover:border-primary/50 focus:border-primary transition-colors"
                      placeholder="e.g., 150"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="scan_y" className="text-sm font-medium text-foreground">
                        Length (meters)
                      </Label>
                      <Tooltip content={
                        <div className="space-y-2">
                          <p className="font-medium">Survey Area Length (meters)</p>
                          <p className="text-sm">North-south dimension of rectangular survey area.</p>
                          <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                            <div>total_area = width × length</div>
                            <div>mission_time ∝ area / footprint</div>
                          </div>
                          <p className="text-xs text-muted-foreground">Larger area = longer flight time</p>
                        </div>
                      } side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground " />
                      </Tooltip>
                    </div>
                    <Input
                      id="scan_y"
                      type="number"
                      min="10"
                      max="10000"
                      step="1"
                      value={datasetSpec.scan_dimension_y}
                      onChange={(e) => updateDatasetSpec('scan_dimension_y', Number.parseFloat(e.target.value))}
                      className="h-10 bg-background border-input hover:border-primary/50 focus:border-primary transition-colors"
                      placeholder="e.g., 150"
                    />
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 mt-auto">
                    <p className="text-xs text-muted-foreground mb-1">Total Survey Area</p>
                    <p className="text-sm font-medium text-foreground">
                      {((datasetSpec.scan_dimension_x * datasetSpec.scan_dimension_y) / 10000).toFixed(2)} hectares
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import type { Camera, DatasetSpec } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip } from "@/components/ui/tooltip"
import { Camera as CameraIcon, Settings, Focus, Grid3X3, Layers, Ruler, Plane, HelpCircle } from "lucide-react"

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

  const updateCamera = (field: keyof Camera, value: number) => {
    onCameraChange({ ...camera, [field]: value })
  }

  const updateDatasetSpec = (field: keyof DatasetSpec, value: number) => {
    onDatasetSpecChange({ ...datasetSpec, [field]: value })
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
                      <Tooltip content="Focal length in the X (horizontal) direction expressed in pixels. This intrinsic camera parameter determines the horizontal field of view and magnification. Higher values indicate more zoom/telephoto characteristics. Must be obtained from camera calibration for accurate photogrammetry results. Valid range: 100-10,000 pixels." side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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
                      <Tooltip content="Focal length in the Y (vertical) direction expressed in pixels. This intrinsic camera parameter determines the vertical field of view. For most cameras, this equals fx. Small differences may indicate sensor pixel aspect ratio variations or lens distortions that require correction. Valid range: 100-10,000 pixels." side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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
                        <Tooltip content="X-coordinate of the principal point in pixels. This is where the optical axis intersects the image plane and represents the lens optical center. For well-calibrated cameras, this is typically near the image center (image_width/2). Deviations indicate lens mounting misalignment. Valid range: 0-20,000 pixels." side="right">
                          <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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
                        <Tooltip content="Y-coordinate of the principal point in pixels. This is where the optical axis intersects the image plane vertically. For well-calibrated cameras, this is typically near the image center (image_height/2). Accurate values are essential for precise geometric corrections in photogrammetry workflows. Valid range: 0-20,000 pixels." side="right">
                          <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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
                        <Tooltip content="Physical width of the camera sensor in millimeters. Combined with focal length, this determines the horizontal field of view and ground sample distance. Essential for accurate survey planning and photogrammetry processing. Valid range: 1-100mm (covers micro sensors to large format cameras)." side="right">
                          <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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
                        <Tooltip content="Physical height of the camera sensor in millimeters. Combined with sensor width, this defines the sensor aspect ratio and vertical field of view. Critical for accurate geometric calculations in drone surveying applications. Valid range: 1-100mm." side="right">
                          <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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
                      <Tooltip content="Image width resolution in pixels. This value must exactly match your camera's output resolution. Higher values provide more detail and accuracy for photogrammetry but result in larger file sizes and longer processing times. Valid range: 100-20,000 pixels." side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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
                      <Tooltip content="Image height resolution in pixels. Must exactly match your camera's output resolution. Combined with image width, this determines the total image resolution and aspect ratio. Critical for accurate ground sample distance calculations. Valid range: 100-20,000 pixels." side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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
                        <Tooltip content="Forward overlap percentage between consecutive images along the flight path direction. Minimum 60% for basic mapping, 75-85% recommended for high-quality photogrammetry and 3D modeling. Higher values ensure better tie point matching and geometric accuracy but increase flight duration and data processing time. Valid range: 0-95% (0.00-0.95)." side="top">
                          <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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
                        <Tooltip content="Side overlap percentage between adjacent flight strips (parallel flight lines). Minimum 30% for basic mapping, 60-70% recommended for complex terrain and high-quality 3D reconstruction. Higher values provide better edge coverage and reduce data gaps but significantly increase flight time and battery consumption. Valid range: 0-95% (0.00-0.95)." side="top">
                          <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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
                      <Tooltip content="Flight altitude above ground level (AGL) in meters. Directly affects ground sampling distance (GSD) - higher altitudes reduce resolution but cover more area per image. Consider local regulations, terrain variations, and required detail level. Typical range: 30-120m for most mapping applications. Valid range: 5-500m." side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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
                      <Tooltip content="Camera exposure time (shutter speed) in milliseconds. Shorter exposures prevent motion blur during flight but require adequate lighting. Must balance image sharpness with proper exposure. Typical range: 1-5ms for bright conditions, up to 10ms for overcast skies. Consider drone ground speed to minimize blur. Valid range: 0.1-100ms." side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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
                      <Tooltip content="East-west dimension of the rectangular survey area in meters. This determines the length of individual flight lines and affects the total mission duration. Combined with overlap settings, this influences the number of photos per flight line and overall data density. Valid range: 10-10,000m." side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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
                      <Tooltip content="North-south dimension of the rectangular survey area in meters. This determines the spacing between parallel flight lines based on side overlap settings. Combined with width, defines the total survey area and significantly impacts mission planning, flight time, and battery requirements. Valid range: 10-10,000m." side="top">
                        <HelpCircle className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
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

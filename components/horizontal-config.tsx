"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import type { Camera, DatasetSpec } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera as CameraIcon,
  Settings,
} from "lucide-react";

/**
 * Props for the horizontal configuration panel.
 *
 * @param camera - Current camera intrinsics and sensor parameters
 * @param datasetSpec - Mission/dataset specification values used to generate the flight plan
 * @param onCameraChange - Callback invoked when a camera field is updated
 * @param onDatasetSpecChange - Callback invoked when a dataset field is updated
 */
interface HorizontalConfigProps {
  camera: Camera;
  datasetSpec: DatasetSpec;
  onCameraChange: (camera: Camera) => void;
  onDatasetSpecChange: (datasetSpec: DatasetSpec) => void;
}

/**
 * Imperative ref exposed by HorizontalConfig for parent components.
 *
 * @remarks Provides a simple resetPresets() method to clear any selected presets.
 */
export interface HorizontalConfigRef {
  resetPresets: () => void;
}

/**
 * Compact horizontal configuration panel for camera and mission parameters.
 *
 * @param props - Component props
 * @param props.camera - Camera intrinsics and sizes
 * @param props.datasetSpec - Mission configuration (overlap, height, area, etc.)
 * @param props.onCameraChange - Handler called with updated camera object
 * @param props.onDatasetSpecChange - Handler called with updated datasetSpec object
 * @returns A Card element containing all configuration inputs laid out compactly
 * @remarks Client component using forwardRef to expose resetPresets to parents.
 */
export const HorizontalConfig = forwardRef<HorizontalConfigRef, HorizontalConfigProps>(
  ({ camera, datasetSpec, onCameraChange, onDatasetSpecChange }, ref) => {
    const [selectedPreset, setSelectedPreset] = useState("");
    const [selectedMissionPreset, setSelectedMissionPreset] = useState("");

    // Camera presets
    const cameraPresets = {
      "skydio-x10-vt300l-wide": {
        name: "Skydio X10 VT300-L Wide",
        description: "Professional mapping camera with wide field of view",
        config: {
          fx: 4938.56,
          fy: 4936.49,
          cx: 4095.5,
          cy: 3071.5,
          sensor_size_x_mm: 13.107,
          sensor_size_y_mm: 9.83,
          image_size_x: 8192,
          image_size_y: 6144,
        },
      },
      "skydio-x10-vt300l-narrow": {
        name: "Skydio X10 VT300-L Narrow",
        description: "Narrow field of view camera for detailed imaging",
        config: {
          fx: 12668.3474,
          fy: 12611.0291,
          cx: 4623.5,
          cy: 3471.5,
          sensor_size_x_mm: 7.3984,
          sensor_size_y_mm: 5.5552,
          image_size_x: 9248,
          image_size_y: 6944,
        },
      },
      "skydio-x10-vt300z-telephoto": {
        name: "Skydio X10 VT300-Z Telephoto",
        description: "Telephoto camera for long-range detailed surveys",
        config: {
          fx: 43741.25,
          fy: 43724.5833,
          cx: 3999.5,
          cy: 2999.5,
          sensor_size_x_mm: 6.4,
          sensor_size_y_mm: 4.8,
          image_size_x: 8000,
          image_size_y: 6000,
        },
      },
      "skydio-x10-vt300l-thermal": {
        name: "Skydio X10 VT300-L Thermal",
        description: "Thermal imaging camera for inspection and analysis",
        config: {
          fx: 1135.47,
          fy: 1141.15,
          cx: 319.5,
          cy: 255.5,
          sensor_size_x_mm: 7.68,
          sensor_size_y_mm: 6.144,
          image_size_x: 640,
          image_size_y: 512,
        },
      },
    };

    // Mission presets
    const missionPresets = {
      nominal: {
        name: "Nominal Survey",
        description: "Standard mapping mission with balanced coverage and efficiency",
        config: {
          overlap: 0.7,
          sidelap: 0.7,
          height: 30.48, // 100 ft
          scan_dimension_x: 150,
          scan_dimension_y: 150,
          exposure_time_ms: 2,
        },
      },
      "high-detail-photogrammetry": {
        name: "High-Detail Photogrammetry",
        description: "Urban/archaeology mapping with high overlap for detailed 3D reconstruction",
        config: {
          overlap: 0.8,
          sidelap: 0.8,
          height: 30.0,
          scan_dimension_x: 150,
          scan_dimension_y: 150,
          exposure_time_ms: 2,
        },
      },
      "large-area-mapping": {
        name: "Large-Area Mapping",
        description: "Efficient coverage for large areas with lower ground resolution",
        config: {
          overlap: 0.7,
          sidelap: 0.7,
          height: 120.0,
          scan_dimension_x: 1000,
          scan_dimension_y: 1000,
          exposure_time_ms: 2,
        },
      },
      "crop-mapping-multispectral": {
        name: "Crop Mapping (Multispectral)",
        description: "Agricultural surveys with multispectral sensor and longer exposure",
        config: {
          overlap: 0.75,
          sidelap: 0.7,
          height: 50.0,
          scan_dimension_x: 500,
          scan_dimension_y: 500,
          exposure_time_ms: 10,
        },
      },
      "thermal-rooftop-inspection": {
        name: "Thermal Rooftop Inspection",
        description: "Building inspection with thermal camera, lower overlap, longer exposure",
        config: {
          overlap: 0.6,
          sidelap: 0.6,
          height: 30.0,
          scan_dimension_x: 50,
          scan_dimension_y: 50,
          exposure_time_ms: 50,
        },
      },
      "linear-corridor": {
        name: "Linear Corridor Survey",
        description: "Roads, pipelines, or power lines with high along-track overlap",
        config: {
          overlap: 0.85,
          sidelap: 0.5,
          height: 40.0,
          scan_dimension_x: 20,
          scan_dimension_y: 2000,
          exposure_time_ms: 5,
        },
      },
      "wildlife-survey": {
        name: "Wildlife Survey",
        description: "Non-intrusive surveys at higher altitude for wildlife monitoring",
        config: {
          overlap: 0.6,
          sidelap: 0.6,
          height: 120.0,
          scan_dimension_x: 500,
          scan_dimension_y: 500,
          exposure_time_ms: 5,
        },
      },
      "fast-coverage": {
        name: "Fast Coverage",
        description: "Rapid surveys where resolution is less critical",
        config: {
          overlap: 0.6,
          sidelap: 0.6,
          height: 80.0,
          scan_dimension_x: 1000,
          scan_dimension_y: 1000,
          exposure_time_ms: 2,
        },
      },
      "close-up-inspection": {
        name: "Close-Up Inspection",
        description: "Detailed inspection with very high overlap at low altitude",
        config: {
          overlap: 0.9,
          sidelap: 0.9,
          height: 10.0,
          scan_dimension_x: 30,
          scan_dimension_y: 30,
          exposure_time_ms: 1,
        },
      },
    };

    /**
     * Update a single camera field and propagate the complete camera object.
     *
     * @param field - Key of the Camera object to update
     * @param value - New numeric value for the specified field
     * @returns void
     */
    const updateCamera = (field: keyof Camera, value: number) => {
      // Use parent callback to keep single source of truth in the page state
      onCameraChange({ ...camera, [field]: value });
    };

    /**
     * Update a single dataset specification field and propagate the complete object.
     *
     * @param field - Key of the DatasetSpec object to update
     * @param value - New numeric value for the specified field
     * @returns void
     */
    const updateDatasetSpec = (field: keyof DatasetSpec, value: number) => {
      onDatasetSpecChange({ ...datasetSpec, [field]: value });
    };

    /**
     * Load a predefined camera preset and apply its configuration.
     *
     * @param presetKey - Key identifying the preset from cameraPresets
     * @returns void
     */
    const loadCameraPreset = (presetKey: string) => {
      const preset = cameraPresets[presetKey as keyof typeof cameraPresets];
      if (preset) {
        onCameraChange(preset.config as Camera);
        setSelectedPreset(presetKey);
      }
    };

    /**
     * Load a predefined mission preset and apply its dataset configuration.
     *
     * @param presetKey - Key identifying the preset from missionPresets
     * @returns void
     */
    const loadMissionPreset = (presetKey: string) => {
      const preset = missionPresets[presetKey as keyof typeof missionPresets];
      if (preset) {
        onDatasetSpecChange(preset.config as DatasetSpec);
        setSelectedMissionPreset(presetKey);
      }
    };

    // Expose reset function via ref
    useImperativeHandle(
      ref,
      () => ({
        resetPresets: () => {
          // Clear selected preset values without modifying parent camera/dataset state
          setSelectedPreset("");
          setSelectedMissionPreset("");
        },
      }),
      []
    );

    // --- Render: compact two-column layout with clear section headers ---
    return (
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-foreground text-lg font-semibold">Configuration</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Configure camera and mission parameters
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {/* Camera Preset */}
              <div className="flex items-center gap-2">
                <Tooltip content="Load predefined camera configurations for common drone models and sensors">
                  <span className="text-muted-foreground text-xs cursor-pointer">Camera:</span>
                </Tooltip>
                <Select
                  value={selectedPreset}
                  onValueChange={(value) => {
                    if (value) loadCameraPreset(value);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-44 cursor-pointer text-left">
                    <SelectValue placeholder="Choose camera model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(cameraPresets).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Mission Preset */}
              <div className="flex items-center gap-2">
                <Tooltip content="Load predefined mission parameters for common survey scenarios">
                  <span className="text-muted-foreground text-xs cursor-pointer">Mission:</span>
                </Tooltip>
                <Select
                  value={selectedMissionPreset}
                  onValueChange={(value) => {
                    if (value) loadMissionPreset(value);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-44 cursor-pointer text-left">
                    <SelectValue placeholder="Choose mission type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(missionPresets).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Camera Settings */}
            <div>
              <div className="border-border/30 mb-3 flex items-center gap-2 border-b pb-2">
                <div className="flex h-4 w-4 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/30">
                  <CameraIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-md text-foreground font-semibold">Camera Settings</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Row 1 - Focal Length & Principal Point */}
                <div>
                  <Tooltip content="Focal length in X direction (pixels). Determines horizontal field of view and image scale.">
                    <Label
                      htmlFor="fx"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Focal Length X (px)
                    </Label>
                  </Tooltip>
                  <Input
                    id="fx"
                    type="number"
                    value={camera.fx}
                    onChange={(e) => updateCamera("fx", Number.parseFloat(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Tooltip content="Focal length in Y direction (pixels). Determines vertical field of view and image scale.">
                    <Label
                      htmlFor="fy"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Focal Length Y (px)
                    </Label>
                  </Tooltip>
                  <Input
                    id="fy"
                    type="number"
                    value={camera.fy}
                    onChange={(e) => updateCamera("fy", Number.parseFloat(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Tooltip content="Principal point X coordinate (pixels). The X-coordinate of the optical center on the image sensor.">
                    <Label
                      htmlFor="cx"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Principal Point X (px)
                    </Label>
                  </Tooltip>
                  <Input
                    id="cx"
                    type="number"
                    value={camera.cx}
                    onChange={(e) => updateCamera("cx", Number.parseFloat(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Tooltip content="Principal point Y coordinate (pixels). The Y-coordinate of the optical center on the image sensor.">
                    <Label
                      htmlFor="cy"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Principal Point Y (px)
                    </Label>
                  </Tooltip>
                  <Input
                    id="cy"
                    type="number"
                    value={camera.cy}
                    onChange={(e) => updateCamera("cy", Number.parseFloat(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>

                {/* Row 2 - Sensor & Image Size */}
                <div>
                  <Tooltip content="Physical width of the camera sensor in millimeters. Used to calculate ground sampling distance.">
                    <Label
                      htmlFor="sensor_x"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Sensor Width (mm)
                    </Label>
                  </Tooltip>
                  <Input
                    id="sensor_x"
                    type="number"
                    step="0.1"
                    value={camera.sensor_size_x_mm}
                    onChange={(e) =>
                      updateCamera("sensor_size_x_mm", Number.parseFloat(e.target.value))
                    }
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Tooltip content="Physical height of the camera sensor in millimeters. Used to calculate ground sampling distance.">
                    <Label
                      htmlFor="sensor_y"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Sensor Height (mm)
                    </Label>
                  </Tooltip>
                  <Input
                    id="sensor_y"
                    type="number"
                    step="0.1"
                    value={camera.sensor_size_y_mm}
                    onChange={(e) =>
                      updateCamera("sensor_size_y_mm", Number.parseFloat(e.target.value))
                    }
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Tooltip content="Image width in pixels. The horizontal resolution of captured images.">
                    <Label
                      htmlFor="image_x"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Image Width (px)
                    </Label>
                  </Tooltip>
                  <Input
                    id="image_x"
                    type="number"
                    value={camera.image_size_x}
                    onChange={(e) => updateCamera("image_size_x", Number.parseInt(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Tooltip content="Image height in pixels. The vertical resolution of captured images.">
                    <Label
                      htmlFor="image_y"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Image Height (px)
                    </Label>
                  </Tooltip>
                  <Input
                    id="image_y"
                    type="number"
                    value={camera.image_size_y}
                    onChange={(e) => updateCamera("image_size_y", Number.parseInt(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Mission Parameters */}
            <div>
              <div className="border-border/30 mb-3 flex items-center gap-2 border-b pb-2">
                <div className="flex h-4 w-4 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-900/30">
                  <Settings className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-md text-foreground font-semibold">Mission Parameters</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Row 1 - Overlap & Height */}
                <div>
                  <Tooltip content="Forward overlap percentage between consecutive images in flight direction. Higher values ensure better reconstruction quality but increase flight time.">
                    <Label
                      htmlFor="overlap"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Forward Overlap
                    </Label>
                  </Tooltip>
                  <div className="relative">
                    <Input
                      id="overlap"
                      type="number"
                      step="0.05"
                      min="0"
                      max="0.95"
                      value={datasetSpec.overlap}
                      onChange={(e) =>
                        updateDatasetSpec("overlap", Number.parseFloat(e.target.value))
                      }
                      className="h-7 pr-12 text-xs"
                    />
                    <span className="text-primary pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs font-medium">
                      {Math.round(datasetSpec.overlap * 100)}%
                    </span>
                  </div>
                </div>
                <div>
                  <Tooltip content="Side overlap percentage between adjacent flight lines. Higher values ensure better coverage but increase flight time and data processing.">
                    <Label
                      htmlFor="sidelap"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Side Overlap
                    </Label>
                  </Tooltip>
                  <div className="relative">
                    <Input
                      id="sidelap"
                      type="number"
                      step="0.05"
                      min="0"
                      max="0.95"
                      value={datasetSpec.sidelap}
                      onChange={(e) =>
                        updateDatasetSpec("sidelap", Number.parseFloat(e.target.value))
                      }
                      className="h-7 pr-12 text-xs"
                    />
                    <span className="text-primary pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs font-medium">
                      {Math.round(datasetSpec.sidelap * 100)}%
                    </span>
                  </div>
                </div>
                <div>
                  <Tooltip content="Flight altitude above ground level in meters. Higher altitudes cover more area per image but reduce ground sampling distance.">
                    <Label
                      htmlFor="height"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Flight Height (m)
                    </Label>
                  </Tooltip>
                  <Input
                    id="height"
                    type="number"
                    step="0.5"
                    value={datasetSpec.height}
                    onChange={(e) => updateDatasetSpec("height", Number.parseFloat(e.target.value))}
                    className="h-7 text-xs"
                  />
                </div>

                {/* Row 2 - Survey Area & Exposure */}
                <div>
                  <Tooltip content="Width of the survey area in meters. Defines the east-west extent of the mapping mission.">
                    <Label
                      htmlFor="scan_x"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Survey Width (m)
                    </Label>
                  </Tooltip>
                  <Input
                    id="scan_x"
                    type="number"
                    value={datasetSpec.scan_dimension_x}
                    onChange={(e) =>
                      updateDatasetSpec("scan_dimension_x", Number.parseFloat(e.target.value))
                    }
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Tooltip content="Length of the survey area in meters. Defines the north-south extent of the mapping mission.">
                    <Label
                      htmlFor="scan_y"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Survey Length (m)
                    </Label>
                  </Tooltip>
                  <Input
                    id="scan_y"
                    type="number"
                    value={datasetSpec.scan_dimension_y}
                    onChange={(e) =>
                      updateDatasetSpec("scan_dimension_y", Number.parseFloat(e.target.value))
                    }
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Tooltip content="Camera shutter exposure time in milliseconds. Shorter times reduce motion blur but require more light. Typical range: 1-5ms.">
                    <Label
                      htmlFor="exposure"
                      className="text-muted-foreground mb-1 block cursor-pointer text-xs"
                    >
                      Exposure Time (ms)
                    </Label>
                  </Tooltip>
                  <Input
                    id="exposure"
                    type="number"
                    step="0.1"
                    value={datasetSpec.exposure_time_ms}
                    onChange={(e) =>
                      updateDatasetSpec("exposure_time_ms", Number.parseFloat(e.target.value))
                    }
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

HorizontalConfig.displayName = "HorizontalConfig";

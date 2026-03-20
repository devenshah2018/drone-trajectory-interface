/**
 * Full templates (camera + drone + mission combo) for quick create.
 * These match the Template dropdown in the sidebar.
 */

import type { Camera, DatasetSpec } from "@/lib/types";
import { missionPresets } from "@/lib/mission-presets";

const cameraPresets: Record<string, Camera> = {
  "vt300l-wide": {
    fx: 4938.56,
    fy: 4936.49,
    cx: 4095.5,
    cy: 3071.5,
    sensor_size_x_mm: 13.107,
    sensor_size_y_mm: 9.83,
    image_size_x: 8192,
    image_size_y: 6144,
  },
  "vt300l-thermal": {
    fx: 1135.47,
    fy: 1141.15,
    cx: 319.5,
    cy: 255.5,
    sensor_size_x_mm: 7.68,
    sensor_size_y_mm: 6.144,
    image_size_x: 640,
    image_size_y: 512,
  },
};

const dronePresets: Record<string, { vMax: number; aMax: number }> = {
  "skydio-x10-simple": { vMax: 16, aMax: 3.5 },
  "skydio-x10": { vMax: 45, aMax: 3.5 },
  "skydio-r10": { vMax: 27, aMax: 3.5 },
};

export interface TemplateConfig {
  name: string;
  description: string;
  cameraPresetKey: string;
  modelPresetKey: string;
  missionPresetKey: string;
}

export const templateConfigs: Record<string, TemplateConfig> = {
  Nominal: {
    name: "Nominal",
    description: "Default configuration for camera, model, and mission",
    cameraPresetKey: "vt300l-wide",
    modelPresetKey: "skydio-x10-simple",
    missionPresetKey: "nominal",
  },
  "High-Detail Photogrammetry": {
    name: "High-Detail Photogrammetry",
    description: "Urban/archaeology mapping with high overlap",
    cameraPresetKey: "vt300l-wide",
    modelPresetKey: "skydio-x10-simple",
    missionPresetKey: "high-detail-photogrammetry",
  },
  "Large-Area Mapping": {
    name: "Large-Area Mapping",
    description: "Efficient coverage for large areas",
    cameraPresetKey: "vt300l-wide",
    modelPresetKey: "skydio-x10-simple",
    missionPresetKey: "large-area-mapping",
  },
  "Crop Mapping": {
    name: "Crop Mapping",
    description: "Agricultural surveys with multispectral sensor",
    cameraPresetKey: "vt300l-wide",
    modelPresetKey: "skydio-x10-simple",
    missionPresetKey: "crop-mapping-multispectral",
  },
  "Thermal Inspection": {
    name: "Thermal Inspection",
    description: "Building inspection with thermal camera",
    cameraPresetKey: "vt300l-thermal",
    modelPresetKey: "skydio-x10-simple",
    missionPresetKey: "thermal-rooftop-inspection",
  },
  "Linear Corridor": {
    name: "Linear Corridor",
    description: "Roads, pipelines, or power lines",
    cameraPresetKey: "vt300l-wide",
    modelPresetKey: "skydio-x10-simple",
    missionPresetKey: "linear-corridor",
  },
  "Wildlife Survey": {
    name: "Wildlife Survey",
    description: "Non-intrusive surveys at higher altitude",
    cameraPresetKey: "vt300l-wide",
    modelPresetKey: "skydio-x10-simple",
    missionPresetKey: "wildlife-survey",
  },
  "Fast Coverage": {
    name: "Fast Coverage",
    description: "Rapid surveys where resolution is less critical",
    cameraPresetKey: "vt300l-wide",
    modelPresetKey: "skydio-x10-simple",
    missionPresetKey: "fast-coverage",
  },
  "Close-Up Inspection": {
    name: "Close-Up Inspection",
    description: "Detailed inspection with very high overlap",
    cameraPresetKey: "vt300l-wide",
    modelPresetKey: "skydio-x10-simple",
    missionPresetKey: "close-up-inspection",
  },
};

/** Options for template badges: key and display name */
export const templateOptions = Object.entries(templateConfigs).map(([key, config]) => ({
  key,
  name: config.name,
}));

/** Resolve a template key to full config for generation (camera, datasetSpec, droneConfig) */
export function resolveTemplate(key: string): {
  camera: Camera;
  datasetSpec: DatasetSpec;
  droneConfig: { vMax: number; aMax: number };
} | null {
  const t = templateConfigs[key];
  if (!t) return null;
  const camera = cameraPresets[t.cameraPresetKey];
  const mission = missionPresets[t.missionPresetKey];
  const drone = dronePresets[t.modelPresetKey];
  if (!camera || !mission || !drone) return null;
  return {
    camera: { ...camera },
    datasetSpec: { ...mission.config },
    droneConfig: { ...drone },
  };
}

import type { DatasetSpec } from "@/lib/types";

export interface MissionPreset {
  name: string;
  description: string;
  config: DatasetSpec;
}

export const missionPresets: Record<string, MissionPreset> = {
  nominal: {
    name: "Nominal Survey",
    description: "Standard mapping mission with balanced coverage and efficiency",
    config: {
      overlap: 0.7,
      sidelap: 0.7,
      height: 30.48,
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

/** Options for template badges: key and display name */
export const missionPresetOptions = Object.entries(missionPresets).map(([key, preset]) => ({
  key,
  name: preset.name,
}));

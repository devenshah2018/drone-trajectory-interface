// Data models matching Python classes

/**
 * Data model for a simple pinhole camera.
 *
 * @remarks
 * Holds intrinsic parameters and sensor/image sizes used for projecting and
 * reprojecting points between image and world coordinates.
 */
export interface Camera {
  /** Focal length in pixels along the x-axis */
  fx: number;
  /** Focal length in pixels along the y-axis */
  fy: number;
  /** Principal point x-coordinate in pixels (optical center) */
  cx: number;
  /** Principal point y-coordinate in pixels (optical center) */
  cy: number;
  /** Physical sensor width in millimeters */
  sensor_size_x_mm: number;
  /** Physical sensor height in millimeters */
  sensor_size_y_mm: number;
  /** Image width in pixels */
  image_size_x: number;
  /** Image height in pixels */
  image_size_y: number;
}

/**
 * Data model for specifications of an image dataset (mission parameters).
 *
 * @remarks
 * Values are used to compute image spacing, coverage area, and capture timing.
 */
export interface DatasetSpec {
  /** Forward overlap ratio between consecutive images (0-1) */
  overlap: number;
  /** Side overlap ratio between adjacent flight lines (0-1) */
  sidelap: number;
  /** Flight height above ground level in meters */
  height: number;
  /** Width of the survey area in meters */
  scan_dimension_x: number;
  /** Length of the survey area in meters */
  scan_dimension_y: number;
  /** Camera shutter exposure time in milliseconds */
  exposure_time_ms: number;
}

/**
 * Waypoint model used by the flight planner and simulator.
 *
 * @remarks
 * Each waypoint represents a position where the drone will fly to and optionally
 * capture imagery. Optional look-at coordinates are used for non-nadir camera orientations.
 */
export interface Waypoint {
  /** X coordinate in meters (eastward direction) */
  x: number;
  /** Y coordinate in meters (northward direction) */
  y: number;
  /** Z coordinate in meters (altitude above ground) */
  z: number;
  /** Maximum speed at this waypoint in m/s for blur-free photos */
  speed: number;
  /** X coordinate of look-at point for non-nadir scans (optional) */
  look_at_x?: number;
  /** Y coordinate of look-at point for non-nadir scans (optional) */
  look_at_y?: number;
  /** Z coordinate of look-at point for non-nadir scans (optional) */
  look_at_z?: number;
}

/**
 * Summary statistics computed for a generated mission.
 *
 * @returns An object containing counts, distances, estimated time, coverage area,
 * GSD (ground sampling distance) and the image footprint on the ground.
 */
export interface MissionStats {
  /** Number of waypoints in the generated plan */
  totalWaypoints: number;
  /** Total planned flight distance in meters */
  totalDistance: number; // meters
  /** Estimated mission flight time in seconds */
  estimatedTime: number; // seconds
  /** Covered area in square meters */
  coverageArea: number; // square meters
  /** Ground sampling distance in meters/pixel */
  gsd: number; // Ground sampling distance in meters
  /** Image footprint on the ground [width, height] in meters */
  imageFootprint: [number, number]; // [x, y] in meters
}

// Flight planning utilities for drone missions
// TypeScript implementation based on Python camera_utils.py and plan_computation.py

import type { Camera, DatasetSpec, Waypoint, MissionStats } from "./types";

/**
 * Collection of flight-planner utility functions.
 *
 * @remarks
 * This module provides camera geometry helpers, footprint and GSD calculations,
 * image-spacing computations, simple kinematic time estimators, and a basic
 * lawn-mower waypoint generator suitable for mission planning prototypes.
 */

/**
 * Computes the focal length in mm for the given camera.
 *
 * @param camera - Camera intrinsics and sensor sizes
 * @returns A tuple [fx_mm, fy_mm] representing focal length in millimeters for X and Y
 */
export function computeFocalLengthInMm(camera: Camera): [number, number] {
  // Convert focal length from pixels to mm
  const pixel_to_mm_x = camera.sensor_size_x_mm / camera.image_size_x;
  const pixel_to_mm_y = camera.sensor_size_y_mm / camera.image_size_y;

  return [camera.fx * pixel_to_mm_x, camera.fy * pixel_to_mm_y];
}

/**
 * Project a 3D world point into image pixel coordinates using a pinhole model.
 *
 * @param camera - Camera intrinsics
 * @param worldPoint - 3D point in camera-relative coordinates [X, Y, Z]
 * @returns Image pixel coordinates [u, v]
 */
export function projectWorldPointToImage(
  camera: Camera,
  worldPoint: [number, number, number]
): [number, number] {
  const [X, Y, Z] = worldPoint;

  // Project to image coordinates using pinhole camera model
  const x = camera.fx * (X / Z);
  const y = camera.fy * (Y / Z);

  // Convert to pixel coordinates
  const u = x + camera.cx;
  const v = y + camera.cy;

  return [u, v];
}

/**
 * Reproject a 2D image point back to 3D world coordinates at a specified depth.
 *
 * @param camera - Camera intrinsics
 * @param imagePoint - Image pixel coordinates [u, v]
 * @param distanceFromSurface - Depth (Z) in the same units as world coordinates
 * @returns Reprojected world coordinates [X, Y, Z]
 */
export function reprojectImagePointToWorld(
  camera: Camera,
  imagePoint: [number, number],
  distanceFromSurface: number
): [number, number, number] {
  const [u, v] = imagePoint;

  // Convert pixel coordinates to normalized image coordinates
  const x = u - camera.cx;
  const y = v - camera.cy;

  // Reproject to world coordinates using the pinhole camera model
  const X = (x * distanceFromSurface) / camera.fx;
  const Y = (y * distanceFromSurface) / camera.fy;
  const Z = distanceFromSurface;

  return [X, Y, Z];
}

/**
 * Compute the ground footprint of the camera image at a given distance.
 *
 * @param camera - Camera intrinsics and sensor sizes
 * @param distance_from_surface - Distance from camera to ground surface
 * @returns Footprint width and height on the ground [width_m, height_m]
 */
export function computeImageFootprintOnSurface(
  camera: Camera,
  distance_from_surface: number
): [number, number] {
  // Get image corner pixel coordinates
  const corner1: [number, number] = [0, 0]; // Top-left
  const corner2: [number, number] = [camera.image_size_x, camera.image_size_y]; // Bottom-right

  // Reproject corners to world coordinates at the given depth
  const worldPoint1 = reprojectImagePointToWorld(camera, corner1, distance_from_surface);
  const worldPoint2 = reprojectImagePointToWorld(camera, corner2, distance_from_surface);

  // Calculate footprint dimensions (absolute to ensure positive sizes)
  const footprint_x = Math.abs(worldPoint2[0] - worldPoint1[0]);
  const footprint_y = Math.abs(worldPoint2[1] - worldPoint1[1]);

  return [footprint_x, footprint_y];
}

/**
 * Compute ground sampling distance (GSD) at the specified height.
 *
 * @param camera - Camera intrinsics
 * @param distance_from_surface - Height above surface
 * @returns Ground sampling distance in meters/pixel (smaller is higher resolution)
 */
export function computeGroundSamplingDistance(
  camera: Camera,
  distance_from_surface: number
): number {
  // Get the image footprint on the ground
  const footprint = computeImageFootprintOnSurface(camera, distance_from_surface);

  // Calculate per-axis GSD
  const gsd_x = footprint[0] / camera.image_size_x;
  const gsd_y = footprint[1] / camera.image_size_y;

  // Return the smaller GSD (best resolution)
  return Math.min(gsd_x, gsd_y);
}

/**
 * Compute the distance between consecutive image centers (nadir case) given overlaps.
 *
 * @param camera - Camera intrinsics
 * @param datasetSpec - Mission parameters including overlap and sidelap
 * @returns Tuple [distance_x, distance_y] in meters between image centers
 * @throws Error when overlap or sidelap values are out of range [0,1)
 */
export function computeDistanceBetweenImages(
  camera: Camera,
  datasetSpec: DatasetSpec
): [number, number] {
  // Validate overlap and sidelap
  const overlap = datasetSpec.overlap;
  const sidelap = datasetSpec.sidelap;

  if (!(0.0 <= overlap && overlap < 1.0)) {
    throw new Error(`overlap must be in [0, 1), got ${overlap}`);
  }
  if (!(0.0 <= sidelap && sidelap < 1.0)) {
    throw new Error(`sidelap must be in [0, 1), got ${sidelap}`);
  }

  // Compute the nadir footprint at flight height
  const footprint = computeImageFootprintOnSurface(camera, datasetSpec.height);
  const [footprint_x, footprint_y] = footprint;

  // Distance between image centers given the overlap ratios
  const distance_x = footprint_x * (1.0 - overlap);
  const distance_y = footprint_y * (1.0 - sidelap);

  return [distance_x, distance_y];
}

/**
 * Compute footprint when camera is tilted (non-nadir).
 *
 * @param camera - Camera intrinsics
 * @param height - Flight height above ground
 * @param cameraAngleRad - Tilt angle in radians
 * @returns Footprint dimensions on the ground [width, height]
 */
export function computeNonNadirFootprint(
  camera: Camera,
  height: number,
  cameraAngleRad: number
): [number, number] {
  // Start with nadir footprint
  const footprint = computeImageFootprintOnSurface(camera, height);

  // Copy footprint and stretch in tilt direction. This is a simplified model.
  const footprintTilted: [number, number] = [...footprint];

  // For non-nadir, footprint increases by 1/cos(angle) in the tilt direction
  footprintTilted[1] /= Math.cos(cameraAngleRad);
  return footprintTilted;
}

/**
 * Compute image center spacing for a non-nadir camera configuration.
 *
 * @param camera - Camera intrinsics
 * @param datasetSpec - Mission parameters
 * @param cameraAngleRad - Tilt angle in radians
 * @returns [dx, dy] distances between image centers
 */
export function computeDistanceBetweenImagesNonNadir(
  camera: Camera,
  datasetSpec: DatasetSpec,
  cameraAngleRad: number
): [number, number] {
  // Compute tilted footprint and spacing
  const footprint = computeNonNadirFootprint(camera, datasetSpec.height, cameraAngleRad);

  const dx = footprint[0] * (1 - datasetSpec.overlap);
  const dy = footprint[1] * (1 - datasetSpec.sidelap);
  return [dx, dy];
}

/**
 * Compute the maximum traversal speed allowed during photo capture to limit
 * movement to a small number of pixels during exposure.
 *
 * @param camera - Camera intrinsics
 * @param datasetSpec - Mission parameters including exposure time
 * @param allowed_movement_px - Allowed movement in pixels during exposure (default 1 px)
 * @returns Maximum allowed speed in meters/second
 */
export function computeSpeedDuringPhotoCapture(
  camera: Camera,
  datasetSpec: DatasetSpec,
  allowed_movement_px = 1
): number {
  // Compute GSD (meters/pixel) at flight height
  const gsd = computeGroundSamplingDistance(camera, datasetSpec.height);

  // Maximum allowed ground movement during exposure (meters)
  const max_ground_movement = allowed_movement_px * gsd;

  // Convert exposure time from milliseconds to seconds
  const exposure_time_s = datasetSpec.exposure_time_ms / 1000.0;

  // Speed = distance / time
  const max_speed = max_ground_movement / exposure_time_s;

  return max_speed;
}

/**
 * Estimate time to travel between two waypoints using a simple kinematic model.
 *
 * @param waypoint1 - Starting waypoint (includes preferred speed)
 * @param waypoint2 - Ending waypoint (includes preferred speed)
 * @param maxSpeed - Upper speed limit (m/s)
 * @param maxAcceleration - Max acceleration/deceleration (m/s^2)
 * @returns Estimated travel time in seconds
 */
export function computeTimeBetweenWaypoints(
  waypoint1: Waypoint,
  waypoint2: Waypoint,
  maxSpeed = 16.0,
  maxAcceleration = 3.5
): number {
  // Calculate Euclidean distance between waypoints
  const dx = waypoint2.x - waypoint1.x;
  const dy = waypoint2.y - waypoint1.y;
  const dz = waypoint2.z - waypoint1.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Starting and ending speeds provided by waypoint objects
  const vStart = waypoint1.speed;
  const vEnd = waypoint2.speed;

  // Compute distances required for accel/decel phases (constant accel model)
  let decelDistance = 0;
  if (maxSpeed > vEnd) {
    decelDistance = (maxSpeed * maxSpeed - vEnd * vEnd) / (2 * maxAcceleration);
  }

  let accelDistance = 0;
  if (vStart < maxSpeed) {
    accelDistance = (maxSpeed * maxSpeed - vStart * vStart) / (2 * maxAcceleration);
  }

  const totalAccelDecelDistance = accelDistance + decelDistance;

  if (totalAccelDecelDistance <= distance) {
    // Trapezoidal velocity profile: accelerate to max, cruise, decelerate
    const cruiseDistance = distance - totalAccelDecelDistance;
    const accelTime = vStart < maxSpeed ? (maxSpeed - vStart) / maxAcceleration : 0;
    const cruiseTime = cruiseDistance > 0 ? cruiseDistance / maxSpeed : 0;
    const decelTime = maxSpeed > vEnd ? (maxSpeed - vEnd) / maxAcceleration : 0;
    return accelTime + cruiseTime + decelTime;
  } else {
    // Triangular profile: accelerate to peak then decelerate without cruising
    const vPeakSquared = (vStart * vStart + vEnd * vEnd + 2 * maxAcceleration * distance) / 2;
    let vPeak: number;
    if (vPeakSquared < 0) {
      vPeak = Math.max(vStart, vEnd);
    } else {
      vPeak = Math.sqrt(vPeakSquared);
    }
    vPeak = Math.min(vPeak, maxSpeed);
    const accelTime = vPeak > vStart ? (vPeak - vStart) / maxAcceleration : 0;
    const decelTime = vPeak > vEnd ? (vPeak - vEnd) / maxAcceleration : 0;
    return accelTime + decelTime;
  }
}

export function computeSegmentTravelTime(
  distance: number,
  vPhoto: number,
  vMax = 16.0,
  aMax = 3.5
): [number, Record<string, any>] {
  // Degenerate case
  if (distance <= 0) {
    return [0.0, { type: "degenerate", distance: distance }];
  }

  // Candidate peak speed for a pure triangular profile (no v_max limit)
  const vPeak = Math.sqrt(aMax * distance + vPhoto * vPhoto);

  // Triangular profile: peak reachable without hitting vMax
  if (vPeak <= vMax) {
    const tAcc = vPeak > vPhoto ? (vPeak - vPhoto) / aMax : 0.0;
    const totalTime = 2.0 * tAcc;
    return [totalTime, { type: "triangular", v_peak: vPeak, t_acc: tAcc }];
  }

  // Trapezoidal profile: accelerate to vMax, cruise, then decelerate
  const vCruise = vMax;

  // Distance required for accel (vPhoto -> vCruise) and decel (vCruise -> vPhoto)
  // sum = (vCruise^2 - vPhoto^2) / aMax
  const dAccDec = (vCruise * vCruise - vPhoto * vPhoto) / aMax;

  // If accel+decel exceeds distance, fallback to triangular achievable peak
  if (dAccDec >= distance) {
    const vPeakFb = Math.sqrt(aMax * distance + vPhoto * vPhoto);
    const tAccFb = vPeakFb > vPhoto ? (vPeakFb - vPhoto) / aMax : 0.0;
    const totalTime = 2.0 * tAccFb;
    return [totalTime, { type: "triangular_fallback", v_peak: vPeakFb, t_acc: tAccFb }];
  }

  const dCruise = distance - dAccDec;
  const tAcc = vCruise > vPhoto ? (vCruise - vPhoto) / aMax : 0.0;
  const tCruise = dCruise > 0 ? dCruise / vCruise : 0.0;
  const totalTime = 2.0 * tAcc + tCruise;

  return [
    totalTime,
    { type: "trapezoidal", v_cruise: vCruise, t_acc: tAcc, t_cruise: tCruise, d_cruise: dCruise },
  ];
}

export function computePlanTime(
  positions: any[],
  vPhoto: number,
  exposureTimeS = 0.0,
  vMax = 16.0,
  aMax = 3.5
): [number, Record<string, any>[]] {
  // Normalize positions into numeric arrays [x,y,z?]
  const pts: number[][] = positions.map((p) => {
    if (p && typeof p === "object") {
      if ("x" in p && "y" in p) {
        return [Number(p.x), Number(p.y), Number(p.z ?? 0)];
      }
      if ("pos" in p && Array.isArray(p.pos)) {
        return p.pos.map((v: any) => Number(v));
      }
      if ("position" in p && Array.isArray(p.position)) {
        return p.position.map((v: any) => Number(v));
      }
    }
    // assume iterable/array-like
    return Array.isArray(p) ? (p as number[]).map(Number) : [Number(p)];
  });

  let totalTime = 0.0;
  const segments: Record<string, any>[] = [];
  const n = pts.length;
  if (n <= 0) return [totalTime, segments];

  // include initial photo dwell
  totalTime += exposureTimeS;

  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    // compute Euclidean distance (support 2D or 3D)
    const dx = (p1[0] ?? 0) - (p0[0] ?? 0);
    const dy = (p1[1] ?? 0) - (p0[1] ?? 0);
    const dz = (p1[2] ?? 0) - (p0[2] ?? 0);
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const [segTime, profile] = computeSegmentTravelTime(dist, vPhoto, vMax, aMax);

    // Clean profile values
    const profileClean: Record<string, any> = { type: profile.type };
    if (profile.v_peak !== undefined) profileClean.v_peak = Number(profile.v_peak);
    if (profile.v_cruise !== undefined) profileClean.v_cruise = Number(profile.v_cruise);
    if (profile.t_acc !== undefined) profileClean.t_acc = Number(profile.t_acc);
    if (profile.t_cruise !== undefined) profileClean.t_cruise = Number(profile.t_cruise);
    if (profile.d_cruise !== undefined) profileClean.d_cruise = Number(profile.d_cruise);

    const captureTime = Number(exposureTimeS);

    const segInfo: Record<string, any> = {
      index: i,
      distance: Number(dist),
      travel_time_s: Number(segTime),
      profile: profileClean,
      capture_time_s: captureTime,
    };

    totalTime += Number(segTime) + captureTime;
    segments.push(segInfo);
  }

  return [totalTime, segments];
}

/**
 * Sum estimated times for the full mission by summing segment times.
 *
 * @param waypoints - Array of waypoints representing the mission path
 * @param maxSpeed - Max speed used for time estimates
 * @param maxAcceleration - Max acceleration used for time estimates
 * @returns Total estimated mission flight time in seconds
 */
export function computeTotalMissionTime(
  waypoints: Waypoint[],
  maxSpeed = 16.0,
  maxAcceleration = 3.5
): number {
  if (waypoints.length < 2) {
    return 0.0;
  }

  let totalTime = 0.0;

  // Sum flight times between consecutive waypoints
  for (let i = 0; i < waypoints.length - 1; i++) {
    const flightTime = computeTimeBetweenWaypoints(
      waypoints[i],
      waypoints[i + 1],
      maxSpeed,
      maxAcceleration
    );
    totalTime += flightTime;
  }

  return totalTime;
}

/**
 * Generate a simple lawn-mower pattern of waypoints covering a rectangular area.
 *
 * @param camera - Camera intrinsics used to compute image spacing
 * @param datasetSpec - Mission parameters including survey dimensions and overlaps
 * @returns Array of generated waypoints with x,y,z coordinates and nominal speed
 */
export function generatePhotoPlaneOnGrid(camera: Camera, datasetSpec: DatasetSpec, droneConfig?: { vMax?: number; aMax?: number }): Waypoint[] {
  // Compute nominal spacing between image centers
  const distances = computeDistanceBetweenImages(camera, datasetSpec);
  const [dx, dy] = distances;

  // Nominal cruise speed to satisfy exposure constraints
  const exposureLimitedSpeed = computeSpeedDuringPhotoCapture(camera, datasetSpec);
  // If drone vMax provided, do not exceed exposure-limited speed
  const max_speed = typeof droneConfig?.vMax === 'number' ? Math.min(droneConfig.vMax, exposureLimitedSpeed) : exposureLimitedSpeed;

  // Estimate number of images required along each axis
  const num_images_x = Math.ceil(datasetSpec.scan_dimension_x / dx) + 1;
  const num_images_y = Math.ceil(datasetSpec.scan_dimension_y / dy) + 1;

  const actual_dx = num_images_x > 1 ? datasetSpec.scan_dimension_x / (num_images_x - 1) : 0;
  const actual_dy = num_images_y > 1 ? datasetSpec.scan_dimension_y / (num_images_y - 1) : 0;

  const start_x = -datasetSpec.scan_dimension_x / 2;
  const start_y = -datasetSpec.scan_dimension_y / 2;

  const waypoints: Waypoint[] = [];

  // Generate lawn-mower rows, alternating direction each row
  for (let row = 0; row < num_images_y; row++) {
    const y = start_y + row * actual_dy;

    const x_range =
      row % 2 === 0
        ? Array.from({ length: num_images_x }, (_, i) => i)
        : Array.from({ length: num_images_x }, (_, i) => num_images_x - 1 - i);

    for (const col of x_range) {
      const x = start_x + col * actual_dx;
      const z = datasetSpec.height;

      waypoints.push({
        x,
        y,
        z,
        // Assign waypoint speed at generation time using the selected drone limits
        speed: max_speed,
      });
    }
  }

  return waypoints;
}

/**
 * Compute summary mission statistics such as total distance, estimated time and GSD.
 *
 * @param waypoints - Generated mission waypoints
 * @param camera - Camera intrinsics
 * @param datasetSpec - Mission parameters
 * @returns MissionStats including totalWaypoints, totalDistance, estimatedTime, coverageArea, gsd, and imageFootprint
 */
export function computeMissionStats(
  waypoints: Waypoint[],
  camera: Camera,
  datasetSpec: DatasetSpec,
  // optional drone kinematic limits: vMax (m/s) and aMax (m/s^2)
  droneConfig?: { vMax?: number; aMax?: number }
): MissionStats {
  // Calculate total distance by summing Euclidean distances between consecutive waypoints
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1].x - waypoints[i].x;
    const dy = waypoints[i + 1].y - waypoints[i].y;
    const dz = waypoints[i + 1].z - waypoints[i].z;
    totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Determine exposure-limited speed to avoid motion blur
  const exposureLimitedSpeed = computeSpeedDuringPhotoCapture(camera, datasetSpec);
  // Use drone-provided vMax if present but do not exceed exposure limit
  const vMax = typeof droneConfig?.vMax === 'number' ? Math.min(droneConfig.vMax, exposureLimitedSpeed) : exposureLimitedSpeed;
  const aMax = typeof droneConfig?.aMax === 'number' ? droneConfig.aMax : 3.5;

  // Use time calculation that accounts for acceleration/deceleration and drone kinematics
  const estimatedTime = computeTotalMissionTime(waypoints, vMax, aMax);

  const coverageArea = datasetSpec.scan_dimension_x * datasetSpec.scan_dimension_y;
  const gsd = computeGroundSamplingDistance(camera, datasetSpec.height);
  const imageFootprint = computeImageFootprintOnSurface(camera, datasetSpec.height);

  return {
    totalWaypoints: waypoints.length,
    totalDistance,
    estimatedTime,
    coverageArea,
    gsd,
    imageFootprint,
  };
}

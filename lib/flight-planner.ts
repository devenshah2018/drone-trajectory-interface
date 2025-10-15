// Flight planning utilities for drone missions
// TypeScript implementation based on Python camera_utils.py and plan_computation.py

import type { Camera, DatasetSpec, Waypoint, MissionStats } from "./types"

/**
 * Computes the focal length in mm for the given camera
 */
export function computeFocalLengthInMm(camera: Camera): [number, number] {
  // Convert focal length from pixels to mm
  const pixel_to_mm_x = camera.sensor_size_x_mm / camera.image_size_x
  const pixel_to_mm_y = camera.sensor_size_y_mm / camera.image_size_y

  return [camera.fx * pixel_to_mm_x, camera.fy * pixel_to_mm_y]
}

/**
 * Project a 3D world point into the image coordinates
 */
export function projectWorldPointToImage(camera: Camera, worldPoint: [number, number, number]): [number, number] {
  const [X, Y, Z] = worldPoint
  
  // Project to image coordinates using pinhole camera model
  const x = camera.fx * (X / Z)
  const y = camera.fy * (Y / Z)
  
  // Convert to pixel coordinates
  const u = x + camera.cx
  const v = y + camera.cy
  
  return [u, v]
}

/**
 * Reproject a 2D image point back to 3D world coordinates at a given depth
 */
export function reprojectImagePointToWorld(
  camera: Camera,
  imagePoint: [number, number],
  distanceFromSurface: number
): [number, number, number] {
  const [u, v] = imagePoint
  
  // Convert pixel coordinates to normalized image coordinates
  const x = u - camera.cx
  const y = v - camera.cy
  
  // Reproject to world coordinates using the pinhole camera model
  const X = x * distanceFromSurface / camera.fx
  const Y = y * distanceFromSurface / camera.fy
  const Z = distanceFromSurface
  
  return [X, Y, Z]
}

/**
 * Compute the footprint of the image captured by the camera at a given distance from the surface
 */
export function computeImageFootprintOnSurface(camera: Camera, distance_from_surface: number): [number, number] {
  // Get image corner pixel coordinates
  const corner1: [number, number] = [0, 0] // Top-left
  const corner2: [number, number] = [camera.image_size_x, camera.image_size_y] // Bottom-right
  
  // Reproject corners to world coordinates
  const worldPoint1 = reprojectImagePointToWorld(camera, corner1, distance_from_surface)
  const worldPoint2 = reprojectImagePointToWorld(camera, corner2, distance_from_surface)
  
  // Calculate footprint dimensions
  const footprint_x = Math.abs(worldPoint2[0] - worldPoint1[0])
  const footprint_y = Math.abs(worldPoint2[1] - worldPoint1[1])
  
  return [footprint_x, footprint_y]
}

export function computeGroundSamplingDistance(camera: Camera, distance_from_surface: number): number {
  // Get the image footprint
  const footprint = computeImageFootprintOnSurface(camera, distance_from_surface)
  
  // Calculate GSD in both directions
  const gsd_x = footprint[0] / camera.image_size_x
  const gsd_y = footprint[1] / camera.image_size_y
  
  // Return the smaller GSD (higher resolution)
  return Math.min(gsd_x, gsd_y)
}

export function computeDistanceBetweenImages(camera: Camera, datasetSpec: DatasetSpec): [number, number] {
  // Validate overlap and sidelap
  const overlap = datasetSpec.overlap
  const sidelap = datasetSpec.sidelap

  if (!(0.0 <= overlap && overlap < 1.0)) {
    throw new Error(`overlap must be in [0, 1), got ${overlap}`)
  }
  if (!(0.0 <= sidelap && sidelap < 1.0)) {
    throw new Error(`sidelap must be in [0, 1), got ${sidelap}`)
  }

  // Compute the footprint of a single image on the surface at the height
  const footprint = computeImageFootprintOnSurface(camera, datasetSpec.height)
  const [footprint_x, footprint_y] = footprint

  // Distance between image centers
  const distance_x = footprint_x * (1.0 - overlap)
  const distance_y = footprint_y * (1.0 - sidelap)

  return [distance_x, distance_y]
}

export function computeNonNadirFootprint(
  camera: Camera,
  height: number,
  cameraAngleRad: number
): [number, number] {
  // Standard nadir footprint
  const footprint = computeImageFootprintOnSurface(camera, height)
  
  // Stretch the footprint in the direction of tilt
  const footprintTilted: [number, number] = [...footprint]

  // For non-nadir, the footprint on the ground increases by 1/cos(angle) in the direction of tilt
  footprintTilted[1] /= Math.cos(cameraAngleRad)
  return footprintTilted
}

export function computeDistanceBetweenImagesNonNadir(
  camera: Camera,
  datasetSpec: DatasetSpec,
  cameraAngleRad: number
): [number, number] {
  // Compute the footprint of a single image on the surface at the height
  const footprint = computeNonNadirFootprint(camera, datasetSpec.height, cameraAngleRad)

  // Distance between image centers
  const dx = footprint[0] * (1 - datasetSpec.overlap)
  const dy = footprint[1] * (1 - datasetSpec.sidelap)
  return [dx, dy]
}

export function computeSpeedDuringPhotoCapture(
  camera: Camera,
  datasetSpec: DatasetSpec,
  allowed_movement_px = 1,
): number {
  // Compute the ground sampling distance (GSD) at the flight height
  const gsd = computeGroundSamplingDistance(camera, datasetSpec.height)
  
  // Maximum allowed ground movement during exposure
  const max_ground_movement = allowed_movement_px * gsd
  
  // Convert exposure time from milliseconds to seconds
  const exposure_time_s = datasetSpec.exposure_time_ms / 1000.0
  
  // Speed = distance / time
  const max_speed = max_ground_movement / exposure_time_s
  
  return max_speed
}

export function computeTimeBetweenWaypoints(
  waypoint1: Waypoint,
  waypoint2: Waypoint,
  maxSpeed = 16.0,
  maxAcceleration = 3.5
): number {
  // Calculate distance between waypoints
  const dx = waypoint2.x - waypoint1.x
  const dy = waypoint2.y - waypoint1.y
  const dz = waypoint2.z - waypoint1.z
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
  
  // Starting and ending speeds
  const vStart = waypoint1.speed
  const vEnd = waypoint2.speed
  
  // Calculate the distance needed to change speed from maxSpeed to vEnd
  let decelDistance = 0
  if (maxSpeed > vEnd) {
    decelDistance = (maxSpeed * maxSpeed - vEnd * vEnd) / (2 * maxAcceleration)
  }
  
  // Calculate the distance needed to accelerate from vStart to maxSpeed
  let accelDistance = 0
  if (vStart < maxSpeed) {
    accelDistance = (maxSpeed * maxSpeed - vStart * vStart) / (2 * maxAcceleration)
  }
  
  // Check if we have enough distance to reach maxSpeed
  const totalAccelDecelDistance = accelDistance + decelDistance
  
  if (totalAccelDecelDistance <= distance) {
    // Trapezoidal profile: accelerate to maxSpeed, cruise, then decelerate
    const cruiseDistance = distance - totalAccelDecelDistance
    
    // Time for each phase
    const accelTime = vStart < maxSpeed ? (maxSpeed - vStart) / maxAcceleration : 0
    const cruiseTime = cruiseDistance > 0 ? cruiseDistance / maxSpeed : 0
    const decelTime = maxSpeed > vEnd ? (maxSpeed - vEnd) / maxAcceleration : 0
    
    return accelTime + cruiseTime + decelTime
  } else {
    // Triangular profile: accelerate to peak speed, then immediately decelerate
    const vPeakSquared = (vStart * vStart + vEnd * vEnd + 2 * maxAcceleration * distance) / 2
    
    let vPeak: number
    if (vPeakSquared < 0) {
      vPeak = Math.max(vStart, vEnd)
    } else {
      vPeak = Math.sqrt(vPeakSquared)
    }
    
    // Ensure we don't exceed maxSpeed
    vPeak = Math.min(vPeak, maxSpeed)
    
    // Calculate actual times
    const accelTime = vPeak > vStart ? (vPeak - vStart) / maxAcceleration : 0
    const decelTime = vPeak > vEnd ? (vPeak - vEnd) / maxAcceleration : 0
    
    return accelTime + decelTime
  }
}

export function computeTotalMissionTime(
  waypoints: Waypoint[],
  maxSpeed = 16.0,
  maxAcceleration = 3.5
): number {
  if (waypoints.length < 2) {
    return 0.0
  }
  
  let totalTime = 0.0
  
  // Sum up flight times between consecutive waypoints
  for (let i = 0; i < waypoints.length - 1; i++) {
    const flightTime = computeTimeBetweenWaypoints(
      waypoints[i],
      waypoints[i + 1],
      maxSpeed,
      maxAcceleration
    )
    totalTime += flightTime
  }
  
  return totalTime
}

/**
 * Generate the complete photo plan as a list of waypoints in a lawn-mower pattern
 */
export function generatePhotoPlaneOnGrid(camera: Camera, datasetSpec: DatasetSpec): Waypoint[] {
  // Placeholder: Generate lawn-mower pattern waypoints
  const distances = computeDistanceBetweenImages(camera, datasetSpec)
  const [dx, dy] = distances

  const max_speed = computeSpeedDuringPhotoCapture(camera, datasetSpec)

  const num_images_x = Math.ceil(datasetSpec.scan_dimension_x / dx) + 1
  const num_images_y = Math.ceil(datasetSpec.scan_dimension_y / dy) + 1

  const actual_dx = num_images_x > 1 ? datasetSpec.scan_dimension_x / (num_images_x - 1) : 0
  const actual_dy = num_images_y > 1 ? datasetSpec.scan_dimension_y / (num_images_y - 1) : 0

  const start_x = -datasetSpec.scan_dimension_x / 2
  const start_y = -datasetSpec.scan_dimension_y / 2

  const waypoints: Waypoint[] = []

  for (let row = 0; row < num_images_y; row++) {
    const y = start_y + row * actual_dy

    const x_range =
      row % 2 === 0
        ? Array.from({ length: num_images_x }, (_, i) => i)
        : Array.from({ length: num_images_x }, (_, i) => num_images_x - 1 - i)

    for (const col of x_range) {
      const x = start_x + col * actual_dx
      const z = datasetSpec.height

      waypoints.push({
        x,
        y,
        z,
        speed: max_speed,
      })
    }
  }

  return waypoints
}

export function computeMissionStats(waypoints: Waypoint[], camera: Camera, datasetSpec: DatasetSpec): MissionStats {
  // Calculate total distance
  let totalDistance = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1].x - waypoints[i].x
    const dy = waypoints[i + 1].y - waypoints[i].y
    const dz = waypoints[i + 1].z - waypoints[i].z
    totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  // Use proper time calculation with acceleration/deceleration
  const estimatedTime = computeTotalMissionTime(waypoints)

  const coverageArea = datasetSpec.scan_dimension_x * datasetSpec.scan_dimension_y
  const gsd = computeGroundSamplingDistance(camera, datasetSpec.height)
  const imageFootprint = computeImageFootprintOnSurface(camera, datasetSpec.height)

  return {
    totalWaypoints: waypoints.length,
    totalDistance,
    estimatedTime,
    coverageArea,
    gsd,
    imageFootprint,
  }
}

/**
 * Path utilities for distance calculation and SVG rendering
 */

/**
 * Calculate the distance between two points in pixels, then convert to miles.
 *
 * @param {Object} p1 - First point {x, y}
 * @param {Object} p2 - Second point {x, y}
 * @param {Object} mapScale - Scale configuration with milesPerPixel
 * @returns {number} Distance in miles
 */
export function calculateSegmentDistance(p1, p2, mapScale) {
  if (!mapScale?.milesPerPixel) return 0;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);

  return pixelDistance * mapScale.milesPerPixel;
}

/**
 * Calculate the total distance of a path (sum of all segments).
 *
 * @param {Array} waypoints - Array of waypoint objects with {x, y}
 * @param {Object} mapScale - Scale configuration with milesPerPixel
 * @returns {number} Total distance in miles
 */
export function calculatePathDistance(waypoints, mapScale) {
  if (!waypoints || waypoints.length < 2 || !mapScale?.milesPerPixel) return 0;

  let totalDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    totalDistance += calculateSegmentDistance(waypoints[i - 1], waypoints[i], mapScale);
  }

  return totalDistance;
}

/**
 * Convert waypoints array to SVG points string for polyline.
 *
 * @param {Array} waypoints - Array of waypoint objects with {x, y}
 * @returns {string} SVG points string "x1,y1 x2,y2 ..."
 */
export function waypointsToSvgPoints(waypoints) {
  if (!waypoints || waypoints.length === 0) return '';
  return waypoints.map(wp => `${wp.x},${wp.y}`).join(' ');
}

/**
 * Find the nearest waypoint to a given position within a threshold.
 *
 * @param {number} x - X position to check
 * @param {number} y - Y position to check
 * @param {Array} waypoints - Array of waypoint objects with {id, x, y}
 * @param {number} threshold - Maximum distance in pixels to consider a match
 * @returns {Object|null} The nearest waypoint or null if none within threshold
 */
export function findNearestWaypoint(x, y, waypoints, threshold = 10) {
  if (!waypoints || waypoints.length === 0) return null;

  let nearest = null;
  let nearestDistance = threshold;

  for (const wp of waypoints) {
    const dx = wp.x - x;
    const dy = wp.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = wp;
    }
  }

  return nearest;
}

/**
 * Find the nearest point on a path (for path selection hit testing).
 *
 * @param {number} x - X position to check
 * @param {number} y - Y position to check
 * @param {Array} waypoints - Array of waypoint objects with {x, y}
 * @param {number} threshold - Maximum distance in pixels to consider a hit
 * @returns {boolean} True if position is within threshold of the path
 */
export function isPointNearPath(x, y, waypoints, threshold = 8) {
  if (!waypoints || waypoints.length < 2) return false;

  for (let i = 1; i < waypoints.length; i++) {
    const p1 = waypoints[i - 1];
    const p2 = waypoints[i];
    const distance = pointToSegmentDistance(x, y, p1.x, p1.y, p2.x, p2.y);

    if (distance <= threshold) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate the distance from a point to a line segment.
 *
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {number} x1 - Segment start X
 * @param {number} y1 - Segment start Y
 * @param {number} x2 - Segment end X
 * @param {number} y2 - Segment end Y
 * @returns {number} Distance in pixels
 */
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // Segment is a point
    return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  }

  // Project point onto line, clamping to segment
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

/**
 * Format distance for display.
 *
 * @param {number} miles - Distance in miles
 * @returns {string} Formatted distance string
 */
export function formatDistance(miles) {
  if (miles < 0.1) {
    // Show in feet for very short distances
    const feet = Math.round(miles * 5280);
    return `${feet.toLocaleString()} ft`;
  } else if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  } else {
    return `${Math.round(miles).toLocaleString()} mi`;
  }
}

/**
 * Default path colors for new paths.
 */
export const PATH_COLORS = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Teal
  '#e91e63', // Pink
  '#00bcd4', // Cyan
];

/**
 * Get the next default color for a new path.
 *
 * @param {Array} existingPaths - Array of existing paths
 * @returns {string} Hex color string
 */
export function getNextPathColor(existingPaths) {
  const usedColors = new Set(existingPaths?.map(p => p.color) || []);
  const availableColor = PATH_COLORS.find(c => !usedColors.has(c));
  return availableColor || PATH_COLORS[existingPaths?.length % PATH_COLORS.length || 0];
}

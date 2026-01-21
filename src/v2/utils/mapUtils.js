import { LATITUDE_BAND_RANGES } from '../models/constants';

// Band colors for overlay (semi-transparent)
export const BAND_COLORS = {
  polar: 'rgba(240, 248, 255, 0.3)',      // Alice blue / white
  subarctic: 'rgba(173, 216, 230, 0.3)',  // Light blue
  boreal: 'rgba(102, 178, 178, 0.3)',     // Blue-green / teal
  temperate: 'rgba(144, 238, 144, 0.3)',  // Light green
  subtropical: 'rgba(189, 218, 87, 0.3)', // Yellow-green
  tropical: 'rgba(255, 200, 87, 0.3)'     // Orange-yellow
};

// Solid band colors for SVG strokes
export const BAND_STROKE_COLORS = {
  polar: 'rgba(240, 248, 255, 0.5)',
  subarctic: 'rgba(173, 216, 230, 0.5)',
  boreal: 'rgba(102, 178, 178, 0.5)',
  temperate: 'rgba(144, 238, 144, 0.5)',
  subtropical: 'rgba(189, 218, 87, 0.5)',
  tropical: 'rgba(255, 200, 87, 0.5)'
};

// Band labels for display
export const BAND_LABELS = {
  polar: 'Polar',
  subarctic: 'Subarctic',
  boreal: 'Boreal',
  temperate: 'Temperate',
  subtropical: 'Subtropical',
  tropical: 'Tropical'
};

/**
 * Given map scale settings and image dimensions, calculate which bands
 * are visible and their Y-pixel ranges on the image.
 *
 * @param {number} imageHeight - Height of the map image in pixels
 * @param {Object} mapScale - Scale configuration
 * @param {number} mapScale.milesPerPixel - Miles per pixel
 * @param {number} mapScale.topEdgeDistanceFromCenter - Distance from top of image to disc center in miles
 * @returns {Array} Array of visible band objects with pixel positions
 */
export function calculateVisibleBands(imageHeight, mapScale) {
  if (!mapScale || !imageHeight) return [];

  const { milesPerPixel, topEdgeDistanceFromCenter } = mapScale;
  const mapHeightMiles = imageHeight * milesPerPixel;
  const topEdgeMiles = topEdgeDistanceFromCenter;
  const bottomEdgeMiles = topEdgeDistanceFromCenter + mapHeightMiles;

  const visibleBands = [];

  for (const [bandName, [minMiles, maxMiles]] of Object.entries(LATITUDE_BAND_RANGES)) {
    // Check if band intersects map's mile range
    if (maxMiles > topEdgeMiles && minMiles < bottomEdgeMiles) {
      // Calculate Y pixel positions for this band
      const bandTopPx = Math.max(0, (minMiles - topEdgeMiles) / milesPerPixel);
      const bandBottomPx = Math.min(imageHeight, (maxMiles - topEdgeMiles) / milesPerPixel);

      visibleBands.push({
        name: bandName,
        label: BAND_LABELS[bandName],
        color: BAND_COLORS[bandName],
        topPx: bandTopPx,
        bottomPx: bandBottomPx,
        heightPx: bandBottomPx - bandTopPx,
        // Include the original mile ranges for reference
        minMiles,
        maxMiles
      });
    }
  }

  // Sort by topPx (north to south on map)
  return visibleBands.sort((a, b) => a.topPx - b.topPx);
}

/**
 * Given a Y-pixel position on the map, determine which latitude band it falls in.
 *
 * @param {number} yPixel - Y position on the map image
 * @param {number} imageHeight - Height of the map image in pixels
 * @param {Object} mapScale - Scale configuration
 * @returns {string|null} Band name (e.g., 'temperate') or null if outside all bands
 */
export function getLatitudeBandAtPosition(yPixel, imageHeight, mapScale) {
  if (!mapScale || yPixel < 0 || yPixel > imageHeight) return null;

  const { milesPerPixel, topEdgeDistanceFromCenter } = mapScale;
  const distanceFromCenter = topEdgeDistanceFromCenter + (yPixel * milesPerPixel);

  for (const [bandName, [minMiles, maxMiles]] of Object.entries(LATITUDE_BAND_RANGES)) {
    if (distanceFromCenter >= minMiles && distanceFromCenter < maxMiles) {
      return bandName;
    }
  }

  return null; // Outside all defined bands
}

/**
 * Convert a pixel position to miles from disc center.
 *
 * @param {number} yPixel - Y position on the map image
 * @param {Object} mapScale - Scale configuration
 * @returns {number} Distance from disc center in miles
 */
export function pixelToMiles(yPixel, mapScale) {
  if (!mapScale) return 0;
  const { milesPerPixel, topEdgeDistanceFromCenter } = mapScale;
  return topEdgeDistanceFromCenter + (yPixel * milesPerPixel);
}

/**
 * Convert miles from disc center to pixel position.
 *
 * @param {number} miles - Distance from disc center in miles
 * @param {Object} mapScale - Scale configuration
 * @returns {number} Y position on the map image in pixels
 */
export function milesToPixel(miles, mapScale) {
  if (!mapScale) return 0;
  const { milesPerPixel, topEdgeDistanceFromCenter } = mapScale;
  return (miles - topEdgeDistanceFromCenter) / milesPerPixel;
}

/**
 * Calculate curved band arcs for SVG rendering.
 * Assumes map is horizontally centered on the disc's vertical axis.
 *
 * On a flat disc world, latitude bands are concentric circles around the center.
 * This function calculates SVG arc paths for the portion of each band visible on the map.
 *
 * @param {number} imageWidth - Width of the map image in pixels
 * @param {number} imageHeight - Height of the map image in pixels
 * @param {Object} mapScale - Scale configuration
 * @returns {Array} Array of band objects with SVG path data
 */
export function calculateCurvedBands(imageWidth, imageHeight, mapScale) {
  if (!mapScale || !imageWidth || !imageHeight) return [];

  const { milesPerPixel, topEdgeDistanceFromCenter } = mapScale;

  // Map dimensions in miles
  const mapWidthMiles = imageWidth * milesPerPixel;
  const mapHeightMiles = imageHeight * milesPerPixel;

  // The map's horizontal center corresponds to the disc's center axis (x=0 in world coords)
  // Map's top edge is at topEdgeDistanceFromCenter miles from disc center
  // Map's bottom edge is at (topEdgeDistanceFromCenter + mapHeightMiles) miles

  const centerXPx = imageWidth / 2;

  // The disc center in pixel coordinates:
  // Y position where distance from center = 0
  // This is typically above the map (negative Y) unless topEdgeDistanceFromCenter = 0
  const centerYPx = -topEdgeDistanceFromCenter / milesPerPixel;

  const curvedBands = [];

  for (const [bandName, [minMiles, maxMiles]] of Object.entries(LATITUDE_BAND_RANGES)) {
    // Check if this band intersects with the map's Y range
    const mapTopMiles = topEdgeDistanceFromCenter;
    const mapBottomMiles = topEdgeDistanceFromCenter + mapHeightMiles;

    if (maxMiles <= mapTopMiles || minMiles >= mapBottomMiles) {
      continue; // Band doesn't intersect map
    }

    // Convert band boundaries to pixel radii from disc center
    const innerRadiusPx = minMiles / milesPerPixel;
    const outerRadiusPx = maxMiles / milesPerPixel;

    // Calculate the arc path for the inner (top) edge of the band
    // We need to find where the circle intersects the map's left and right edges
    const innerArc = calculateArcIntersection(innerRadiusPx, imageWidth, imageHeight, centerXPx, centerYPx);
    const outerArc = calculateArcIntersection(outerRadiusPx, imageWidth, imageHeight, centerXPx, centerYPx);

    if (innerArc || outerArc) {
      curvedBands.push({
        name: bandName,
        label: BAND_LABELS[bandName],
        color: BAND_COLORS[bandName],
        strokeColor: BAND_STROKE_COLORS[bandName],
        innerRadiusPx,
        outerRadiusPx,
        centerXPx,
        centerYPx,
        innerArc,
        outerArc,
        minMiles,
        maxMiles
      });
    }
  }

  return curvedBands;
}

/**
 * Calculate where a circle arc intersects with the visible map area.
 *
 * @param {number} radius - Radius of the circle in pixels
 * @param {number} imageWidth - Width of the map
 * @param {number} imageHeight - Height of the map
 * @param {number} centerX - X position of circle center (disc center)
 * @param {number} centerY - Y position of circle center (typically negative, above map)
 * @returns {Object|null} Arc intersection data or null if no intersection
 */
function calculateArcIntersection(radius, imageWidth, imageHeight, centerX, centerY) {
  // The circle equation: (x - centerX)² + (y - centerY)² = radius²
  // We need to find where this circle intersects the map bounds (0 to imageWidth, 0 to imageHeight)

  // Check if the arc is visible at all
  // The closest point on the circle to the map is at y = centerY + radius
  // The farthest is at y = centerY - radius (but that's above, not visible typically)

  const topOfCircle = centerY - radius;
  const bottomOfCircle = centerY + radius;

  // If circle is entirely above or below the map, no intersection
  if (bottomOfCircle < 0 || topOfCircle > imageHeight) {
    return null;
  }

  // Find the Y range where the circle intersects the map
  const visibleTopY = Math.max(0, topOfCircle);
  const visibleBottomY = Math.min(imageHeight, bottomOfCircle);

  // At each Y, find the X coordinates where the circle intersects
  // x = centerX ± sqrt(radius² - (y - centerY)²)

  // For the arc endpoints, we need the leftmost and rightmost visible points
  // Start with the top and bottom of visible range

  const points = [];

  // Sample points along the visible arc
  const steps = 50;
  for (let i = 0; i <= steps; i++) {
    const y = visibleTopY + (visibleBottomY - visibleTopY) * (i / steps);
    const dy = y - centerY;
    const discriminant = radius * radius - dy * dy;

    if (discriminant >= 0) {
      const dx = Math.sqrt(discriminant);
      const leftX = centerX - dx;
      const rightX = centerX + dx;

      // Clamp to map bounds
      const clampedLeftX = Math.max(0, leftX);
      const clampedRightX = Math.min(imageWidth, rightX);

      if (clampedLeftX < clampedRightX) {
        points.push({ y, leftX: clampedLeftX, rightX: clampedRightX });
      }
    }
  }

  if (points.length === 0) return null;

  return {
    points,
    visibleTopY,
    visibleBottomY,
    radius
  };
}

/**
 * Generate an SVG path for a curved band (arc between two radii).
 *
 * @param {Object} band - Band data from calculateCurvedBands
 * @param {number} imageWidth - Width for clamping
 * @param {number} imageHeight - Height for clamping
 * @returns {string} SVG path string
 */
export function generateBandPath(band, imageWidth, imageHeight) {
  const { innerArc, outerArc, centerXPx, centerYPx, innerRadiusPx, outerRadiusPx } = band;

  if (!outerArc || outerArc.points.length < 2) return '';

  // Build path: trace outer arc clockwise (left down, bottom curve, right up),
  // then inner arc counter-clockwise, close
  const outerPoints = outerArc.points;
  const innerPoints = innerArc ? innerArc.points : [];

  let path = '';

  // Start at the top-left of outer arc
  const firstOuter = outerPoints[0];
  path = `M ${firstOuter.leftX} ${firstOuter.y}`;

  // Draw left edge down (outer arc left side)
  for (let i = 1; i < outerPoints.length; i++) {
    path += ` L ${outerPoints[i].leftX} ${outerPoints[i].y}`;
  }

  // Check if we need to draw the curved bottom of the outer arc
  // This happens when the circle's bottom (centerY + radius) is within the map bounds
  const lastOuter = outerPoints[outerPoints.length - 1];
  const outerCircleBottom = centerYPx + outerRadiusPx;
  const isOuterBottomVisible = outerCircleBottom <= imageHeight && outerCircleBottom >= 0;

  if (isOuterBottomVisible && lastOuter.leftX !== lastOuter.rightX) {
    // The curve continues - trace along the bottom arc from left to right
    // Generate additional points along the bottom curve
    const bottomY = outerCircleBottom;
    // We're at lastOuter.leftX, need to get to lastOuter.rightX following the curve
    // Since the bottom of a circle is symmetric, we can sample from left to center to right
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      // Interpolate X from leftX to rightX
      const x = lastOuter.leftX + (lastOuter.rightX - lastOuter.leftX) * t;
      // Calculate Y on the circle for this X
      const dx = x - centerXPx;
      const discriminant = outerRadiusPx * outerRadiusPx - dx * dx;
      if (discriminant >= 0) {
        // Use the lower intersection (centerY + sqrt)
        const y = centerYPx + Math.sqrt(discriminant);
        const clampedY = Math.min(imageHeight, y);
        path += ` L ${x} ${clampedY}`;
      }
    }
  } else {
    // Bottom is clipped by map edge - straight line across (map boundary)
    path += ` L ${lastOuter.rightX} ${lastOuter.y}`;
  }

  // Draw right edge up (outer arc right side, reversed)
  for (let i = outerPoints.length - 2; i >= 0; i--) {
    path += ` L ${outerPoints[i].rightX} ${outerPoints[i].y}`;
  }

  // If we have an inner arc, cut it out; otherwise just close
  if (innerPoints.length >= 2) {
    // Draw to inner arc top right
    const firstInner = innerPoints[0];
    path += ` L ${firstInner.rightX} ${firstInner.y}`;

    // Draw inner arc right side down
    for (let i = 1; i < innerPoints.length; i++) {
      path += ` L ${innerPoints[i].rightX} ${innerPoints[i].y}`;
    }

    // Check if inner arc bottom is visible
    const lastInner = innerPoints[innerPoints.length - 1];
    const innerCircleBottom = centerYPx + innerRadiusPx;
    const isInnerBottomVisible = innerCircleBottom <= imageHeight && innerCircleBottom >= 0;

    if (isInnerBottomVisible && lastInner.leftX !== lastInner.rightX) {
      // Trace inner bottom curve from right to left
      const steps = 20;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        // Interpolate X from rightX to leftX (reverse direction)
        const x = lastInner.rightX + (lastInner.leftX - lastInner.rightX) * t;
        const dx = x - centerXPx;
        const discriminant = innerRadiusPx * innerRadiusPx - dx * dx;
        if (discriminant >= 0) {
          const y = centerYPx + Math.sqrt(discriminant);
          const clampedY = Math.min(imageHeight, y);
          path += ` L ${x} ${clampedY}`;
        }
      }
    } else {
      // Inner bottom clipped - straight line
      path += ` L ${lastInner.leftX} ${lastInner.y}`;
    }

    // Draw inner arc left side up
    for (let i = innerPoints.length - 2; i >= 0; i--) {
      path += ` L ${innerPoints[i].leftX} ${innerPoints[i].y}`;
    }
  }

  path += ' Z';

  return path;
}

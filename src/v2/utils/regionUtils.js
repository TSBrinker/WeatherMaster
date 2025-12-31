/**
 * Region utilities for polygon math, area/perimeter calculations, and edge detection
 */

import { calculateSegmentDistance } from './pathUtils';

/**
 * Calculate the perimeter of a polygon (sum of all edge distances).
 *
 * @param {Array} vertices - Array of vertex objects with {x, y}
 * @param {Object} mapScale - Scale configuration with milesPerPixel
 * @returns {number} Perimeter in miles
 */
export function calculatePolygonPerimeter(vertices, mapScale) {
  if (!vertices || vertices.length < 3 || !mapScale?.milesPerPixel) return 0;

  let perimeter = 0;
  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length]; // Wrap to first vertex
    perimeter += calculateSegmentDistance(current, next, mapScale);
  }

  return perimeter;
}

/**
 * Calculate the area of a polygon using the Shoelace formula.
 * Returns area in square pixels, then converts to square miles.
 *
 * @param {Array} vertices - Array of vertex objects with {x, y}
 * @param {Object} mapScale - Scale configuration with milesPerPixel
 * @returns {number} Area in square miles
 */
export function calculatePolygonArea(vertices, mapScale) {
  if (!vertices || vertices.length < 3 || !mapScale?.milesPerPixel) return 0;

  // Shoelace formula for polygon area
  let areaPixels = 0;
  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    areaPixels += current.x * next.y;
    areaPixels -= next.x * current.y;
  }
  areaPixels = Math.abs(areaPixels) / 2;

  // Convert to square miles
  const milesPerPixel = mapScale.milesPerPixel;
  return areaPixels * milesPerPixel * milesPerPixel;
}

/**
 * Convert vertices array to SVG points string for polygon element.
 *
 * @param {Array} vertices - Array of vertex objects with {x, y}
 * @returns {string} SVG points string "x1,y1 x2,y2 ..."
 */
export function verticesToSvgPoints(vertices) {
  if (!vertices || vertices.length === 0) return '';
  return vertices.map(v => `${v.x},${v.y}`).join(' ');
}

/**
 * Check if a point is inside a polygon using ray casting algorithm.
 *
 * @param {number} x - Point X coordinate
 * @param {number} y - Point Y coordinate
 * @param {Array} vertices - Array of vertex objects with {x, y}
 * @returns {boolean} True if point is inside the polygon
 */
export function isPointInPolygon(x, y, vertices) {
  if (!vertices || vertices.length < 3) return false;

  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
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
export function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
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
 * Find the nearest edge of a polygon to a given point.
 *
 * @param {number} x - Point X coordinate
 * @param {number} y - Point Y coordinate
 * @param {Array} vertices - Array of vertex objects with {id, x, y}
 * @param {number} threshold - Maximum distance in pixels to consider a match
 * @returns {Object|null} Edge info { edgeIndex, vertex1, vertex2, distance } or null
 */
export function findNearestEdge(x, y, vertices, threshold = 10) {
  if (!vertices || vertices.length < 2) return null;

  let nearestEdge = null;
  let nearestDistance = threshold;

  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    const distance = pointToSegmentDistance(x, y, v1.x, v1.y, v2.x, v2.y);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestEdge = {
        edgeIndex: i,
        vertex1: { ...v1 },
        vertex2: { ...v2 },
        distance,
      };
    }
  }

  return nearestEdge;
}

/**
 * Find the nearest edge across all regions (weather and political).
 *
 * @param {number} x - Point X coordinate
 * @param {number} y - Point Y coordinate
 * @param {Array} weatherRegions - Array of weather region objects
 * @param {Array} politicalRegions - Array of political region objects
 * @param {number} threshold - Maximum distance in pixels
 * @returns {Object|null} { regionType, regionId, edgeIndex, vertex1, vertex2, distance } or null
 */
export function findNearestEdgeAcrossRegions(x, y, weatherRegions = [], politicalRegions = [], threshold = 10) {
  let nearest = null;
  let nearestDistance = threshold;

  // Check weather regions
  for (const region of weatherRegions) {
    if (!region.vertices || region.vertices.length < 3) continue;
    const edge = findNearestEdge(x, y, region.vertices, nearestDistance);
    if (edge && edge.distance < nearestDistance) {
      nearestDistance = edge.distance;
      nearest = {
        regionType: 'weather',
        regionId: region.id,
        ...edge,
      };
    }
  }

  // Check political regions
  for (const region of politicalRegions) {
    if (!region.vertices || region.vertices.length < 3) continue;
    const edge = findNearestEdge(x, y, region.vertices, nearestDistance);
    if (edge && edge.distance < nearestDistance) {
      nearestDistance = edge.distance;
      nearest = {
        regionType: 'political',
        regionId: region.id,
        ...edge,
      };
    }
  }

  return nearest;
}

/**
 * Find the nearest vertex to a given position within a threshold.
 *
 * @param {number} x - X position to check
 * @param {number} y - Y position to check
 * @param {Array} vertices - Array of vertex objects with {id, x, y}
 * @param {number} threshold - Maximum distance in pixels to consider a match
 * @returns {Object|null} The nearest vertex or null if none within threshold
 */
export function findNearestVertex(x, y, vertices, threshold = 10) {
  if (!vertices || vertices.length === 0) return null;

  let nearest = null;
  let nearestDistance = threshold;

  for (const v of vertices) {
    const dx = v.x - x;
    const dy = v.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = { ...v, distance };
    }
  }

  return nearest;
}

/**
 * Find the nearest vertex across all regions (weather and political).
 * Used for vertex snapping during drawing - click on any existing vertex to reuse that point.
 *
 * @param {number} x - Point X coordinate
 * @param {number} y - Point Y coordinate
 * @param {Array} weatherRegions - Array of weather region objects
 * @param {Array} politicalRegions - Array of political region objects
 * @param {number} threshold - Maximum distance in pixels
 * @returns {Object|null} { regionType, regionId, vertex, distance } or null
 */
export function findNearestVertexAcrossRegions(x, y, weatherRegions = [], politicalRegions = [], threshold = 12) {
  let nearest = null;
  let nearestDistance = threshold;

  // Check weather regions
  for (const region of weatherRegions) {
    if (!region.vertices || region.vertices.length === 0) continue;
    const vertex = findNearestVertex(x, y, region.vertices, nearestDistance);
    if (vertex && vertex.distance < nearestDistance) {
      nearestDistance = vertex.distance;
      nearest = {
        regionType: 'weather',
        regionId: region.id,
        vertex: { x: vertex.x, y: vertex.y },
        distance: vertex.distance,
      };
    }
  }

  // Check political regions
  for (const region of politicalRegions) {
    if (!region.vertices || region.vertices.length === 0) continue;
    const vertex = findNearestVertex(x, y, region.vertices, nearestDistance);
    if (vertex && vertex.distance < nearestDistance) {
      nearestDistance = vertex.distance;
      nearest = {
        regionType: 'political',
        regionId: region.id,
        vertex: { x: vertex.x, y: vertex.y },
        distance: vertex.distance,
      };
    }
  }

  return nearest;
}

/**
 * Format area for display.
 *
 * @param {number} squareMiles - Area in square miles
 * @returns {string} Formatted area string
 */
export function formatArea(squareMiles) {
  if (squareMiles < 0.01) {
    // Show in acres for very small areas (1 sq mi = 640 acres)
    const acres = Math.round(squareMiles * 640);
    return `${acres.toLocaleString()} acres`;
  } else if (squareMiles < 1) {
    return `${squareMiles.toFixed(2)} sq mi`;
  } else if (squareMiles < 100) {
    return `${squareMiles.toFixed(1)} sq mi`;
  } else {
    return `${Math.round(squareMiles).toLocaleString()} sq mi`;
  }
}

/**
 * Default colors for weather regions (blues/greens - weather-y).
 */
export const WEATHER_REGION_COLORS = [
  '#3498db', // Blue
  '#2ecc71', // Green
  '#9b59b6', // Purple
  '#1abc9c', // Teal
  '#5dade2', // Light blue
  '#58d68d', // Light green
];

/**
 * Default colors for political regions (warm/earthy - kingdom-y).
 */
export const POLITICAL_REGION_COLORS = [
  '#e74c3c', // Red
  '#f39c12', // Orange
  '#8e44ad', // Purple
  '#d35400', // Burnt orange
  '#c0392b', // Dark red
  '#e67e22', // Amber
];

/**
 * Get the next default color for a new region.
 *
 * @param {Array} existingRegions - Array of existing regions
 * @param {Array} colorPalette - Color palette to use
 * @returns {string} Hex color string
 */
export function getNextRegionColor(existingRegions, colorPalette) {
  const usedColors = new Set(existingRegions?.map(r => r.color) || []);
  const availableColor = colorPalette.find(c => !usedColors.has(c));
  return availableColor || colorPalette[existingRegions?.length % colorPalette.length || 0];
}

/**
 * Project a point onto a line segment, returning the projected coordinates.
 *
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {number} x1 - Segment start X
 * @param {number} y1 - Segment start Y
 * @param {number} x2 - Segment end X
 * @param {number} y2 - Segment end Y
 * @returns {Object} { x, y, t } where t is parametric position (0-1)
 */
export function projectPointOntoSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return { x: x1, y: y1, t: 0 };
  }

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  return {
    x: x1 + t * dx,
    y: y1 + t * dy,
    t,
  };
}

/**
 * Find the nearest edge across political regions with projection data for snapping.
 * Returns enough info to insert a vertex at the snap point.
 *
 * @param {number} x - Point X coordinate
 * @param {number} y - Point Y coordinate
 * @param {Array} politicalRegions - Array of political region objects
 * @param {string|null} excludeRegionId - Region ID to exclude from search
 * @param {number} threshold - Maximum distance in pixels
 * @returns {Object|null} { regionId, regionName, edgeIndex, insertAfterIndex, vertex1, vertex2, projectedPoint, distance } or null
 */
export function findNearestPoliticalEdge(x, y, politicalRegions, excludeRegionId = null, threshold = 15) {
  let nearest = null;
  let nearestDistance = threshold;

  for (const region of politicalRegions) {
    if (region.id === excludeRegionId) continue;
    if (!region.vertices || region.vertices.length < 3) continue;

    for (let i = 0; i < region.vertices.length; i++) {
      const v1 = region.vertices[i];
      const v2 = region.vertices[(i + 1) % region.vertices.length];
      const projection = projectPointOntoSegment(x, y, v1.x, v1.y, v2.x, v2.y);
      const dx = x - projection.x;
      const dy = y - projection.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = {
          regionId: region.id,
          regionName: region.name,
          edgeIndex: i,
          insertAfterIndex: i,
          vertex1: { ...v1 },
          vertex2: { ...v2 },
          projectedPoint: { x: projection.x, y: projection.y },
          distance,
          t: projection.t,
        };
      }
    }
  }

  return nearest;
}

/**
 * Check if a point is inside any political region.
 *
 * @param {number} x - Point X coordinate
 * @param {number} y - Point Y coordinate
 * @param {Array} politicalRegions - Array of political region objects
 * @param {string|null} excludeRegionId - Region ID to exclude from check
 * @returns {Object|null} { regionId, regionName } if inside, null otherwise
 */
export function findContainingPoliticalRegion(x, y, politicalRegions, excludeRegionId = null) {
  for (const region of politicalRegions) {
    if (region.id === excludeRegionId) continue;
    if (!region.vertices || region.vertices.length < 3) continue;

    if (isPointInPolygon(x, y, region.vertices)) {
      return {
        regionId: region.id,
        regionName: region.name,
      };
    }
  }
  return null;
}

/**
 * Find all vertices with a given sharedId across all political regions.
 * Used for linked vertex updates.
 *
 * @param {string} sharedId - The shared vertex ID to find
 * @param {Array} politicalRegions - Array of political region objects
 * @returns {Array} Array of { regionId, vertexId, vertex } for all matching vertices
 */
export function findLinkedVertices(sharedId, politicalRegions) {
  if (!sharedId) return [];

  const linked = [];
  for (const region of politicalRegions) {
    if (!region.vertices) continue;
    for (const vertex of region.vertices) {
      if (vertex.sharedId === sharedId) {
        linked.push({
          regionId: region.id,
          vertexId: vertex.id,
          vertex: { ...vertex },
        });
      }
    }
  }
  return linked;
}

/**
 * Find the nearest political vertex with full vertex data including sharedId.
 * Used for snapping during drawing.
 *
 * @param {number} x - Point X coordinate
 * @param {number} y - Point Y coordinate
 * @param {Array} politicalRegions - Array of political region objects
 * @param {string|null} excludeRegionId - Region ID to exclude from search
 * @param {number} threshold - Maximum distance in pixels
 * @returns {Object|null} { regionId, vertex: {id, x, y, sharedId}, distance } or null
 */
export function findNearestPoliticalVertex(x, y, politicalRegions, excludeRegionId = null, threshold = 12) {
  let nearest = null;
  let nearestDistance = threshold;

  for (const region of politicalRegions) {
    if (region.id === excludeRegionId) continue;
    if (!region.vertices || region.vertices.length === 0) continue;

    for (const v of region.vertices) {
      const dx = v.x - x;
      const dy = v.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = {
          regionId: region.id,
          vertex: { ...v },
          distance,
        };
      }
    }
  }

  return nearest;
}

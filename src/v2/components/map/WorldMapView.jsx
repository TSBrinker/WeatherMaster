import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { Settings, Plus, MapPin, ZoomIn, ZoomOut, RotateCcw, Layers, Route, Thermometer, Cloud, Crown, Link } from 'lucide-react';
import { useGesture } from '@use-gesture/react';
import { useWorld } from '../../contexts/WorldContext';
import {
  calculateVisibleBands,
  calculateCurvedBands,
  generateBandPath,
  getLatitudeBandAtPosition,
  pixelToMiles,
  BAND_LABELS
} from '../../utils/mapUtils';
import {
  waypointsToSvgPoints,
  calculatePathDistance,
  getNextPathColor,
} from '../../utils/pathUtils';
import {
  verticesToSvgPoints,
  calculatePolygonPerimeter,
  calculatePolygonArea,
  getNextRegionColor,
  findNearestVertexAcrossRegions,
  findNearestPoliticalVertex,
  findNearestPoliticalEdge,
  findContainingPoliticalRegion,
  WEATHER_REGION_COLORS,
  POLITICAL_REGION_COLORS,
} from '../../utils/regionUtils';
import { v4 as uuidv4 } from 'uuid';
import MapConfigModal from './MapConfigModal';
import MapToolsPanel from './MapToolsPanel';
import './WorldMapView.css';

/**
 * WorldMapView - Interactive map display with latitude band overlay and location pins
 *
 * Props:
 * - continent: The continent object to display (has mapImage, mapScale)
 * - onPlaceLocation: Callback when user clicks to place a new location
 * - onAssignLocation: Callback when user clicks to assign an existing location to a map position
 * - onSelectRegion: Callback when user clicks on a region pin
 */
const WorldMapView = ({ continent, onPlaceLocation, onAssignLocation, onSelectRegion }) => {
  const { activeWorld, groupedRegions, createPath, updatePath, createWeatherRegion, updateWeatherRegion, createPoliticalRegion, updatePoliticalRegion, deletePoliticalRegionVertex, insertPoliticalRegionVertex, updateLinkedPoliticalVertices, setPoliticalVertexSharedId, updateRegion } = useWorld();
  const mapContainerRef = useRef(null);
  const imageRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 }); // Natural image dimensions
  const [displayedSize, setDisplayedSize] = useState({ width: 0, height: 0 }); // Displayed dimensions
  const [showConfig, setShowConfig] = useState(false);
  const [hoveredBand, setHoveredBand] = useState(null);

  // Path drawing state
  const [drawingMode, setDrawingMode] = useState('none'); // 'none' | 'path' | 'weatherRegion' | 'politicalRegion'
  const [activePath, setActivePath] = useState(null); // Path being drawn
  const [selectedPathId, setSelectedPathId] = useState(null);

  // Weather region drawing state
  const [activeWeatherRegion, setActiveWeatherRegion] = useState(null);
  const [selectedWeatherRegionId, setSelectedWeatherRegionId] = useState(null);

  // Political region drawing state
  const [activePoliticalRegion, setActivePoliticalRegion] = useState(null);
  const [selectedPoliticalRegionId, setSelectedPoliticalRegionId] = useState(null);

  // Snap preview state for political region drawing
  // { type: 'vertex'|'edge'|'warning', x, y, regionId, regionName?, vertex?, edgeIndex?, insertAfterIndex? }
  const [snapPreview, setSnapPreview] = useState(null);

  // Waypoint dragging state
  const [draggingWaypoint, setDraggingWaypoint] = useState(null);
  const dragStartRef = useRef(null);

  // Political region vertex dragging state
  const [draggingPoliticalVertex, setDraggingPoliticalVertex] = useState(null);
  const draggingPoliticalVertexRef = useRef(null); // Ref mirror for gesture callbacks
  // { regionId, vertexId, vertex (with sharedId) }

  // Edge subdivision hover state (for selected political regions)
  const [edgeSubdividePreview, setEdgeSubdividePreview] = useState(null);
  // { regionId, edgeIndex, insertAfterIndex, x, y, vertex1, vertex2 }

  // Vertex context menu state
  const [vertexContextMenu, setVertexContextMenu] = useState(null);
  // { x, y (screen coords), regionId, vertex, nearbyVertices: [{regionId, vertex, distance}] }

  // Location pin dragging state
  const [draggingPin, setDraggingPin] = useState(null);
  // { regionId, startX, startY, currentX, currentY }
  const draggingPinRef = useRef(null); // Ref mirror for gesture callbacks
  const pinDragOccurredRef = useRef(false); // Track if actual movement happened

  // Pin move mode - activated via right-click menu, allows dragging
  const [movingPinId, setMovingPinId] = useState(null);

  // Location pin context menu state
  const [pinContextMenu, setPinContextMenu] = useState(null);
  // { x, y (screen coords), region }

  // Layer visibility (default off to reduce visual clutter)
  const [showPaths, setShowPaths] = useState(false);
  const [showClimate, setShowClimate] = useState(false);
  const [showWeatherRegions, setShowWeatherRegions] = useState(false);
  const [showPoliticalRegions, setShowPoliticalRegions] = useState(false);

  // Location placement mode
  const [placingLocation, setPlacingLocation] = useState(false);
  // Location assignment mode (linking existing regions)
  const [assigningLocation, setAssigningLocation] = useState(false);

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(null);
  const [isAnimatingZoom, setIsAnimatingZoom] = useState(false); // For smooth button zoom

  // Gesture state refs (for use-gesture)
  const gestureStateRef = useRef({
    initialZoom: 1,
    initialPan: { x: 0, y: 0 },
  });

  const mapImage = continent?.mapImage;
  const mapScale = continent?.mapScale;

  // Calculate visible bands (flat for legend) and curved bands (for SVG overlay)
  const visibleBands = mapScale && imageSize.height > 0
    ? calculateVisibleBands(imageSize.height, mapScale)
    : [];

  const curvedBands = mapScale && imageSize.width > 0 && imageSize.height > 0
    ? calculateCurvedBands(imageSize.width, imageSize.height, mapScale)
    : [];

  // Get regions for this continent that have map positions
  const regionsWithPositions = continent
    ? (groupedRegions.byContinent[continent.id] || []).filter(r => r.mapPosition)
    : [];

  // Calculate adaptive scale bar
  const scaleBar = useMemo(() => {
    if (!mapScale || imageSize.width === 0 || displayedSize.width === 0) return null;

    // milesPerPixel is based on original/natural image dimensions
    const milesPerPixel = mapScale.milesPerPixel;

    // Calculate the scale factor: how the image is scaled for display
    // If natural width is 2000px but displayed at 800px, displayScale = 0.4
    const displayScale = displayedSize.width / imageSize.width;

    // Effective miles per SCREEN pixel (accounting for image scaling AND zoom)
    const milesPerScreenPixel = milesPerPixel / (displayScale * zoom);

    // Target bar width is ~100-150px on screen
    const targetPixels = 120;
    // Calculate what distance that would represent
    const rawDistance = targetPixels * milesPerScreenPixel;

    // Round to a nice number (1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, etc.)
    const niceNumbers = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
    let niceMiles = niceNumbers.find(n => n >= rawDistance) || 5000;

    // Calculate actual screen pixel width for this nice number
    const pixelWidth = niceMiles / milesPerScreenPixel;

    return {
      miles: niceMiles,
      width: pixelWidth,
      label: niceMiles >= 1000 ? `${niceMiles / 1000}k mi` : `${niceMiles} mi`,
    };
  }, [mapScale, imageSize.width, displayedSize.width, zoom]);

  const handleImageLoad = (e) => {
    setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
    // Also capture displayed size for scale bar
    const rect = e.target.getBoundingClientRect();
    setDisplayedSize({ width: rect.width, height: rect.height });
  };

  // Update displayed size on resize or when image changes
  useEffect(() => {
    const updateDisplayedSize = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        if (rect.width > 0) {
          setDisplayedSize({ width: rect.width, height: rect.height });
        }
      }
    };

    // Initial measurement (after layout)
    const timeoutId = setTimeout(updateDisplayedSize, 50);

    // Listen for window resize
    window.addEventListener('resize', updateDisplayedSize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateDisplayedSize);
    };
  }, [mapImage]); // Re-run when map image changes

  // Get click position in image coordinates
  const getImagePosition = useCallback((e) => {
    const img = e.currentTarget.querySelector?.('img') || e.target.closest('.map-image-wrapper')?.querySelector('img');
    if (!img) return null;

    const imgRect = img.getBoundingClientRect();
    const scaleX = imageSize.width / imgRect.width;
    const scaleY = imageSize.height / imgRect.height;

    const x = (e.clientX - imgRect.left) * scaleX;
    const y = (e.clientY - imgRect.top) * scaleY;

    if (x < 0 || x > imageSize.width || y < 0 || y > imageSize.height) return null;

    return { x: Math.round(x), y: Math.round(y) };
  }, [imageSize]);

  // === PATH DRAWING ===

  const handleStartDrawing = useCallback(() => {
    setDrawingMode('path');
    setSelectedPathId(null);
    setActivePath({
      waypoints: [],
      color: getNextPathColor(continent?.paths || []),
      totalDistanceMiles: 0,
    });
  }, [continent?.paths]);

  const handleFinishDrawing = useCallback(() => {
    if (!activePath || activePath.waypoints.length < 2 || !continent) {
      setDrawingMode('none');
      setActivePath(null);
      return;
    }

    // Create the path with a default name
    const pathNumber = (continent.paths?.length || 0) + 1;
    createPath(continent.id, {
      name: `Path ${pathNumber}`,
      waypoints: activePath.waypoints,
      color: activePath.color,
      totalDistanceMiles: activePath.totalDistanceMiles,
    });

    setDrawingMode('none');
    setActivePath(null);
  }, [activePath, continent, createPath]);

  const handleCancelDrawing = useCallback(() => {
    setDrawingMode('none');
    setActivePath(null);
  }, []);

  const handleAddWaypoint = useCallback((pos) => {
    if (!activePath) return;

    const newWaypoint = {
      id: `temp-${Date.now()}`,
      x: pos.x,
      y: pos.y,
    };

    const newWaypoints = [...activePath.waypoints, newWaypoint];
    const totalDistance = calculatePathDistance(newWaypoints, mapScale);

    setActivePath({
      ...activePath,
      waypoints: newWaypoints,
      totalDistanceMiles: totalDistance,
    });
  }, [activePath, mapScale]);

  // === WEATHER REGION DRAWING ===

  const handleStartWeatherRegionDrawing = useCallback(() => {
    setDrawingMode('weatherRegion');
    setSelectedWeatherRegionId(null);
    setActiveWeatherRegion({
      vertices: [],
      color: getNextRegionColor(continent?.weatherRegions || [], WEATHER_REGION_COLORS),
      perimeterMiles: 0,
      areaSquareMiles: 0,
    });
  }, [continent?.weatherRegions]);

  const handleFinishWeatherRegionDrawing = useCallback(() => {
    if (!activeWeatherRegion || activeWeatherRegion.vertices.length < 3 || !continent) {
      setDrawingMode('none');
      setActiveWeatherRegion(null);
      return;
    }

    // Create the region with a default name
    const regionNumber = (continent.weatherRegions?.length || 0) + 1;
    createWeatherRegion(continent.id, {
      name: `Weather Zone ${regionNumber}`,
      vertices: activeWeatherRegion.vertices,
      color: activeWeatherRegion.color,
      perimeterMiles: activeWeatherRegion.perimeterMiles,
      areaSquareMiles: activeWeatherRegion.areaSquareMiles,
    });

    setDrawingMode('none');
    setActiveWeatherRegion(null);
    setShowWeatherRegions(true); // Auto-show the layer when a region is created
  }, [activeWeatherRegion, continent, createWeatherRegion]);

  const handleCancelWeatherRegionDrawing = useCallback(() => {
    setDrawingMode('none');
    setActiveWeatherRegion(null);
  }, []);

  const handleAddWeatherRegionVertex = useCallback((pos) => {
    if (!activeWeatherRegion) return;

    // First priority: check for vertex snapping (clicking on an existing vertex)
    const nearestVertex = findNearestVertexAcrossRegions(
      pos.x,
      pos.y,
      continent?.weatherRegions || [],
      continent?.politicalRegions || [],
      12 // vertex snapping threshold
    );

    let vertexPosition = { x: pos.x, y: pos.y };

    if (nearestVertex) {
      // Snap to the existing vertex position
      vertexPosition = { x: nearestVertex.vertex.x, y: nearestVertex.vertex.y };
    }

    const newVertex = {
      id: `temp-${Date.now()}`,
      x: vertexPosition.x,
      y: vertexPosition.y,
    };

    const newVertices = [...activeWeatherRegion.vertices, newVertex];

    setActiveWeatherRegion({
      ...activeWeatherRegion,
      vertices: newVertices,
      perimeterMiles: calculatePolygonPerimeter(newVertices, mapScale),
      areaSquareMiles: calculatePolygonArea(newVertices, mapScale),
    });
  }, [activeWeatherRegion, continent, mapScale]);

  // === POLITICAL REGION DRAWING ===

  const handleStartPoliticalRegionDrawing = useCallback(() => {
    setDrawingMode('politicalRegion');
    setSelectedPoliticalRegionId(null);
    setActivePoliticalRegion({
      vertices: [],
      color: getNextRegionColor(continent?.politicalRegions || [], POLITICAL_REGION_COLORS),
      perimeterMiles: 0,
      areaSquareMiles: 0,
    });
  }, [continent?.politicalRegions]);

  const handleFinishPoliticalRegionDrawing = useCallback(() => {
    if (!activePoliticalRegion || activePoliticalRegion.vertices.length < 3 || !continent) {
      setDrawingMode('none');
      setActivePoliticalRegion(null);
      return;
    }

    // Create the region with a default name
    const regionNumber = (continent.politicalRegions?.length || 0) + 1;
    createPoliticalRegion(continent.id, {
      name: `Kingdom ${regionNumber}`,
      vertices: activePoliticalRegion.vertices,
      color: activePoliticalRegion.color,
      perimeterMiles: activePoliticalRegion.perimeterMiles,
      areaSquareMiles: activePoliticalRegion.areaSquareMiles,
    });

    setDrawingMode('none');
    setActivePoliticalRegion(null);
    setShowPoliticalRegions(true); // Auto-show the layer when a region is created
  }, [activePoliticalRegion, continent, createPoliticalRegion]);

  const handleCancelPoliticalRegionDrawing = useCallback(() => {
    setDrawingMode('none');
    setActivePoliticalRegion(null);
  }, []);

  const handleAddPoliticalRegionVertex = useCallback((pos) => {
    if (!activePoliticalRegion) return;

    let vertexPosition = { x: pos.x, y: pos.y };
    let sharedId = null;

    // First priority: check for vertex snapping
    const nearestVertex = findNearestPoliticalVertex(
      pos.x, pos.y,
      continent?.politicalRegions || [],
      null,
      12 // vertex snapping threshold
    );

    if (nearestVertex) {
      // Snap to existing vertex
      vertexPosition = { x: nearestVertex.vertex.x, y: nearestVertex.vertex.y };

      // Handle sharedId linking
      if (nearestVertex.vertex.sharedId) {
        // Use existing sharedId
        sharedId = nearestVertex.vertex.sharedId;
      } else {
        // Create new sharedId and update the existing vertex
        sharedId = uuidv4();
        setPoliticalVertexSharedId(
          continent.id,
          nearestVertex.regionId,
          nearestVertex.vertex.id,
          sharedId
        );
      }
    } else {
      // Second priority: check for edge snapping
      const nearestEdge = findNearestPoliticalEdge(
        pos.x, pos.y,
        continent?.politicalRegions || [],
        null,
        15 // edge snapping threshold
      );

      if (nearestEdge) {
        // Snap to edge - subdivide the existing polygon
        vertexPosition = {
          x: nearestEdge.projectedPoint.x,
          y: nearestEdge.projectedPoint.y,
        };

        // Create sharedId for the new linked vertex
        sharedId = uuidv4();

        // Insert vertex into the existing polygon at the edge
        insertPoliticalRegionVertex(
          continent.id,
          nearestEdge.regionId,
          { x: vertexPosition.x, y: vertexPosition.y, sharedId },
          nearestEdge.insertAfterIndex
        );
      }
      // If no snap, sharedId stays null (independent vertex)
    }

    const newVertex = {
      id: `temp-${Date.now()}`,
      x: vertexPosition.x,
      y: vertexPosition.y,
      sharedId,
    };

    const newVertices = [...activePoliticalRegion.vertices, newVertex];

    setActivePoliticalRegion({
      ...activePoliticalRegion,
      vertices: newVertices,
      perimeterMiles: calculatePolygonPerimeter(newVertices, mapScale),
      areaSquareMiles: calculatePolygonArea(newVertices, mapScale),
    });

    // Clear snap preview after adding vertex
    setSnapPreview(null);
  }, [activePoliticalRegion, continent, mapScale, insertPoliticalRegionVertex, setPoliticalVertexSharedId]);

  // === WAYPOINT DRAGGING ===

  const handleWaypointMouseDown = useCallback((e, pathId, waypointId) => {
    e.stopPropagation();
    e.preventDefault();

    const pos = getImagePosition(e);
    if (!pos) return;

    setDraggingWaypoint({ pathId, waypointId });
    dragStartRef.current = pos;
  }, [getImagePosition]);

  const handlePoliticalVertexMouseDown = useCallback((e, regionId, vertex) => {
    e.stopPropagation();
    e.preventDefault();

    const pos = getImagePosition(e);
    if (!pos) return;

    const dragInfo = { regionId, vertexId: vertex.id, vertex };
    setDraggingPoliticalVertex(dragInfo);
    draggingPoliticalVertexRef.current = dragInfo; // Also set ref for gesture callback
    dragStartRef.current = pos;
  }, [getImagePosition]);

  // Touch start handler for political vertices (mobile support)
  // Sets dragging state and prevents default to handle touch drag directly
  const handlePoliticalVertexTouchStart = useCallback((e, regionId, vertex) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent scrolling/panning while dragging vertex
    if (e.touches.length !== 1) return; // Only handle single touch

    const dragInfo = { regionId, vertexId: vertex.id, vertex };
    setDraggingPoliticalVertex(dragInfo);
    draggingPoliticalVertexRef.current = dragInfo;
  }, []);

  // Right-click context menu for political vertices
  const handlePoliticalVertexContextMenu = useCallback((e, regionId, vertex) => {
    e.preventDefault();
    e.stopPropagation();

    // Find nearby vertices from OTHER regions that could be linked
    const nearbyVertices = [];
    const LINK_THRESHOLD = 30; // pixels

    for (const region of continent?.politicalRegions || []) {
      if (region.id === regionId) continue; // Skip same region
      for (const v of region.vertices || []) {
        const dx = v.x - vertex.x;
        const dy = v.y - vertex.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < LINK_THRESHOLD) {
          nearbyVertices.push({
            regionId: region.id,
            regionName: region.name,
            vertex: v,
            distance,
          });
        }
      }
    }

    // Sort by distance
    nearbyVertices.sort((a, b) => a.distance - b.distance);

    setVertexContextMenu({
      x: e.clientX,
      y: e.clientY,
      regionId,
      vertex,
      nearbyVertices,
      canDelete: (continent?.politicalRegions?.find(r => r.id === regionId)?.vertices?.length || 0) > 3,
    });
  }, [continent?.politicalRegions]);

  // Handle delete vertex from context menu
  const handleDeleteVertex = useCallback(() => {
    if (!vertexContextMenu || !continent) return;

    const region = continent.politicalRegions?.find(r => r.id === vertexContextMenu.regionId);
    if (region) {
      // Build updated vertices without the deleted one
      const updatedVertices = region.vertices.filter(v => v.id !== vertexContextMenu.vertex.id);

      // Delete the vertex
      deletePoliticalRegionVertex(
        continent.id,
        vertexContextMenu.regionId,
        vertexContextMenu.vertex.id
      );

      // Recalculate area/perimeter
      updatePoliticalRegion(continent.id, vertexContextMenu.regionId, {
        perimeterMiles: calculatePolygonPerimeter(updatedVertices, mapScale),
        areaSquareMiles: calculatePolygonArea(updatedVertices, mapScale),
      });
    }

    setVertexContextMenu(null);
  }, [vertexContextMenu, continent, deletePoliticalRegionVertex, updatePoliticalRegion, mapScale]);

  // Handle link vertices from context menu
  const handleLinkVertices = useCallback((targetRegionId, targetVertex) => {
    if (!vertexContextMenu || !continent) return;

    const sourceVertex = vertexContextMenu.vertex;

    // Determine sharedId to use
    let sharedId;
    if (sourceVertex.sharedId && targetVertex.sharedId) {
      // Both already have sharedIds - use source's (could merge groups, but keeping simple for now)
      sharedId = sourceVertex.sharedId;
      // Update target to use source's sharedId
      setPoliticalVertexSharedId(continent.id, targetRegionId, targetVertex.id, sharedId);
    } else if (sourceVertex.sharedId) {
      // Source has sharedId, target doesn't - add target to source's group
      sharedId = sourceVertex.sharedId;
      setPoliticalVertexSharedId(continent.id, targetRegionId, targetVertex.id, sharedId);
    } else if (targetVertex.sharedId) {
      // Target has sharedId, source doesn't - add source to target's group
      sharedId = targetVertex.sharedId;
      setPoliticalVertexSharedId(continent.id, vertexContextMenu.regionId, sourceVertex.id, sharedId);
    } else {
      // Neither has sharedId - create new one for both
      sharedId = uuidv4();
      setPoliticalVertexSharedId(continent.id, vertexContextMenu.regionId, sourceVertex.id, sharedId);
      setPoliticalVertexSharedId(continent.id, targetRegionId, targetVertex.id, sharedId);
    }

    // Also snap positions together (use source position)
    updateLinkedPoliticalVertices(continent.id, sharedId, { x: sourceVertex.x, y: sourceVertex.y });

    setVertexContextMenu(null);
  }, [vertexContextMenu, continent, setPoliticalVertexSharedId, updateLinkedPoliticalVertices]);

  // Close context menu when clicking elsewhere
  const handleCloseContextMenu = useCallback(() => {
    setVertexContextMenu(null);
  }, []);

  // Close pin context menu
  const handleClosePinContextMenu = useCallback(() => {
    setPinContextMenu(null);
  }, []);

  // === LOCATION PIN DRAGGING ===

  const handlePinMouseDown = useCallback((e, region) => {
    // Only start drag on left click (not right-click for context menu)
    if (e.button !== 0) return;

    // Only allow dragging if this pin is in move mode (activated via right-click menu)
    if (movingPinId !== region.id) return;

    e.stopPropagation();
    e.preventDefault();

    const pos = getImagePosition(e);
    if (!pos || !region.mapPosition) return;

    const dragInfo = {
      regionId: region.id,
      region,
      startX: region.mapPosition.x,
      startY: region.mapPosition.y,
      currentX: region.mapPosition.x,
      currentY: region.mapPosition.y,
    };
    setDraggingPin(dragInfo);
    draggingPinRef.current = dragInfo;
    pinDragOccurredRef.current = false; // Reset - no movement yet
    dragStartRef.current = pos;
  }, [getImagePosition, movingPinId]);

  const handlePinTouchStart = useCallback((e, region) => {
    // Only allow dragging if this pin is in move mode (activated via right-click menu)
    if (movingPinId !== region.id) return;

    e.stopPropagation();
    e.preventDefault();
    if (e.touches.length !== 1) return;

    if (!region.mapPosition) return;

    const dragInfo = {
      regionId: region.id,
      region,
      startX: region.mapPosition.x,
      startY: region.mapPosition.y,
      currentX: region.mapPosition.x,
      currentY: region.mapPosition.y,
    };
    setDraggingPin(dragInfo);
    draggingPinRef.current = dragInfo;
  }, [movingPinId]);

  // Right-click context menu for location pins
  const handlePinContextMenu = useCallback((e, region) => {
    e.preventDefault();
    e.stopPropagation();

    setPinContextMenu({
      x: e.clientX,
      y: e.clientY,
      region,
    });
  }, []);

  // Finalize pin drag - update region's mapPosition
  const finalizePinDrag = useCallback(() => {
    const dragInfo = draggingPinRef.current;
    if (!dragInfo || !mapScale) return;

    const { regionId, startX, startY, currentX, currentY } = dragInfo;

    // Only save if position actually changed
    if (currentX !== startX || currentY !== startY) {
      // Calculate new latitude band and observer radius from new Y position
      const newLatitudeBand = getLatitudeBandAtPosition(currentY, imageSize.height, mapScale);
      const newObserverRadius = pixelToMiles(currentY, mapScale);

      updateRegion(regionId, {
        mapPosition: {
          x: currentX,
          y: currentY,
          observerRadius: newObserverRadius,
        },
        // Update latitude band if it changed
        ...(newLatitudeBand && { latitudeBand: newLatitudeBand }),
      });
    }

    setDraggingPin(null);
    draggingPinRef.current = null;
    dragStartRef.current = null;
    setMovingPinId(null); // Exit move mode after drop
  }, [mapScale, imageSize.height, updateRegion]);

  // Remove pin from map (unassign from location)
  const handleUnassignPin = useCallback(() => {
    if (!pinContextMenu) return;

    updateRegion(pinContextMenu.region.id, {
      mapPosition: null,
    });

    setPinContextMenu(null);
  }, [pinContextMenu, updateRegion]);

  const handleMouseMove = useCallback((e) => {
    // Handle band hover
    if (!mapScale || imageSize.height === 0) return;

    const img = e.currentTarget.querySelector('img');
    if (!img) return;

    const imgRect = img.getBoundingClientRect();
    const scaleY = imageSize.height / imgRect.height;
    const y = (e.clientY - imgRect.top) * scaleY;

    const band = getLatitudeBandAtPosition(y, imageSize.height, mapScale);
    setHoveredBand(band);

    // Handle snap preview during political region drawing
    if (drawingMode === 'politicalRegion' && continent?.politicalRegions) {
      const pos = getImagePosition(e);
      if (pos) {
        // First priority: check existing vertices
        const nearestVertex = findNearestPoliticalVertex(
          pos.x, pos.y,
          continent.politicalRegions,
          null, // Don't exclude any region
          12 // vertex snapping threshold
        );

        if (nearestVertex) {
          setSnapPreview({
            type: 'vertex',
            x: nearestVertex.vertex.x,
            y: nearestVertex.vertex.y,
            regionId: nearestVertex.regionId,
            vertex: nearestVertex.vertex,
          });
        } else {
          // Second priority: check edges
          const nearestEdge = findNearestPoliticalEdge(
            pos.x, pos.y,
            continent.politicalRegions,
            null, // Don't exclude any region
            15 // edge snapping threshold
          );

          if (nearestEdge) {
            setSnapPreview({
              type: 'edge',
              x: nearestEdge.projectedPoint.x,
              y: nearestEdge.projectedPoint.y,
              regionId: nearestEdge.regionId,
              regionName: nearestEdge.regionName,
              edgeIndex: nearestEdge.edgeIndex,
              insertAfterIndex: nearestEdge.insertAfterIndex,
              vertex1: nearestEdge.vertex1,
              vertex2: nearestEdge.vertex2,
            });
          } else {
            // Check if inside an existing polygon (warning case)
            const containing = findContainingPoliticalRegion(
              pos.x, pos.y,
              continent.politicalRegions,
              null
            );

            if (containing) {
              setSnapPreview({
                type: 'warning',
                x: pos.x,
                y: pos.y,
                regionId: containing.regionId,
                regionName: containing.regionName,
              });
            } else {
              setSnapPreview(null);
            }
          }
        }
      } else {
        setSnapPreview(null);
      }
    } else if (snapPreview) {
      setSnapPreview(null);
    }

    // Handle edge subdivision preview for selected political regions (not in drawing mode)
    if (drawingMode === 'none' && selectedPoliticalRegionId && showPoliticalRegions && continent?.politicalRegions) {
      const pos = getImagePosition(e);
      if (pos) {
        // Find the selected region
        const selectedRegion = continent.politicalRegions.find(r => r.id === selectedPoliticalRegionId);
        if (selectedRegion && selectedRegion.vertices.length >= 3) {
          // First check if we're near a vertex - if so, don't show edge preview
          // (vertices take priority for dragging)
          const nearVertex = findNearestPoliticalVertex(
            pos.x, pos.y,
            [selectedRegion],
            null,
            12 // vertex detection threshold (same as vertex marker size)
          );

          if (nearVertex) {
            // Near a vertex, don't show edge preview
            setEdgeSubdividePreview(null);
          } else {
            // Check if near an edge of the selected region only
            const nearestEdge = findNearestPoliticalEdge(
              pos.x, pos.y,
              [selectedRegion], // Only check the selected region
              null,
              15 // edge detection threshold
            );

            if (nearestEdge) {
              setEdgeSubdividePreview({
                regionId: selectedRegion.id,
                edgeIndex: nearestEdge.edgeIndex,
                insertAfterIndex: nearestEdge.insertAfterIndex,
                x: nearestEdge.projectedPoint.x,
                y: nearestEdge.projectedPoint.y,
                vertex1: nearestEdge.vertex1,
                vertex2: nearestEdge.vertex2,
              });
            } else {
              setEdgeSubdividePreview(null);
            }
          }
        } else {
          setEdgeSubdividePreview(null);
        }
      } else {
        setEdgeSubdividePreview(null);
      }
    } else if (edgeSubdividePreview) {
      setEdgeSubdividePreview(null);
    }

    // Handle waypoint dragging
    if (draggingWaypoint && continent) {
      const pos = getImagePosition(e);
      if (!pos) return;

      const path = continent.paths?.find(p => p.id === draggingWaypoint.pathId);
      if (!path) return;

      const updatedWaypoints = path.waypoints.map(wp =>
        wp.id === draggingWaypoint.waypointId
          ? { ...wp, x: pos.x, y: pos.y }
          : wp
      );

      const totalDistance = calculatePathDistance(updatedWaypoints, mapScale);

      updatePath(continent.id, draggingWaypoint.pathId, {
        waypoints: updatedWaypoints,
        totalDistanceMiles: totalDistance,
      });
    }

    // Handle political vertex dragging (with linked vertex support)
    if (draggingPoliticalVertex && continent) {
      const pos = getImagePosition(e);
      if (!pos) return;

      const vertex = draggingPoliticalVertex.vertex;

      if (vertex.sharedId) {
        // Update all linked vertices
        updateLinkedPoliticalVertices(continent.id, vertex.sharedId, { x: pos.x, y: pos.y });

        // Recalculate area/perimeter for all affected regions
        for (const region of continent.politicalRegions || []) {
          const hasLinkedVertex = region.vertices?.some(v => v.sharedId === vertex.sharedId);
          if (hasLinkedVertex) {
            const updatedVertices = region.vertices.map(v =>
              v.sharedId === vertex.sharedId ? { ...v, x: pos.x, y: pos.y } : v
            );
            updatePoliticalRegion(continent.id, region.id, {
              perimeterMiles: calculatePolygonPerimeter(updatedVertices, mapScale),
              areaSquareMiles: calculatePolygonArea(updatedVertices, mapScale),
            });
          }
        }
      } else {
        // Update just this vertex
        const updatedVertices = continent.politicalRegions
          ?.find(r => r.id === draggingPoliticalVertex.regionId)
          ?.vertices.map(v =>
            v.id === draggingPoliticalVertex.vertexId
              ? { ...v, x: pos.x, y: pos.y }
              : v
          ) || [];

        updatePoliticalRegion(continent.id, draggingPoliticalVertex.regionId, {
          vertices: updatedVertices,
          perimeterMiles: calculatePolygonPerimeter(updatedVertices, mapScale),
          areaSquareMiles: calculatePolygonArea(updatedVertices, mapScale),
        });
      }
    }

    // Handle location pin dragging
    if (draggingPin) {
      const pos = getImagePosition(e);
      if (!pos) return;

      // Update the visual position during drag (stored in state, not persisted yet)
      const updatedDragInfo = {
        ...draggingPin,
        currentX: pos.x,
        currentY: pos.y,
      };
      setDraggingPin(updatedDragInfo);
      draggingPinRef.current = updatedDragInfo;

      // Mark that actual movement occurred (so click handler knows to skip)
      if (pos.x !== draggingPin.startX || pos.y !== draggingPin.startY) {
        pinDragOccurredRef.current = true;
      }
    }
  }, [mapScale, imageSize, draggingWaypoint, draggingPoliticalVertex, draggingPin, continent, getImagePosition, updatePath, updatePoliticalRegion, updateLinkedPoliticalVertices, drawingMode, snapPreview, selectedPoliticalRegionId, showPoliticalRegions, edgeSubdividePreview]);

  const handleMouseUp = useCallback(() => {
    // Finalize pin drag if active
    if (draggingPin) {
      finalizePinDrag();
    }
    setDraggingWaypoint(null);
    setDraggingPoliticalVertex(null);
    draggingPoliticalVertexRef.current = null;
    dragStartRef.current = null;
  }, [draggingPin, finalizePinDrag]);

  const handleMapClick = (e) => {
    // If dragging just ended, don't process as a click
    if (dragStartRef.current) {
      return;
    }

    // If in pin move mode, clicking on the map (not on the pin) cancels it
    if (movingPinId) {
      setMovingPinId(null);
      return;
    }

    const pos = getImagePosition(e);
    if (!pos) return;

    // In path drawing mode, add waypoint
    if (drawingMode === 'path') {
      handleAddWaypoint(pos);
      return;
    }

    // In weather region drawing mode, add vertex
    if (drawingMode === 'weatherRegion') {
      handleAddWeatherRegionVertex(pos);
      return;
    }

    // In political region drawing mode, add vertex
    if (drawingMode === 'politicalRegion') {
      handleAddPoliticalRegionVertex(pos);
      return;
    }

    // Edge subdivision: clicking on an edge of a selected political region
    if (edgeSubdividePreview && selectedPoliticalRegionId && continent) {
      const region = continent.politicalRegions?.find(r => r.id === selectedPoliticalRegionId);
      if (region) {
        // Build the updated vertices array with the new vertex inserted
        const newVertex = {
          x: edgeSubdividePreview.x,
          y: edgeSubdividePreview.y,
          sharedId: null
        };
        const updatedVertices = [...region.vertices];
        updatedVertices.splice(edgeSubdividePreview.insertAfterIndex + 1, 0, newVertex);

        // Insert the vertex
        insertPoliticalRegionVertex(
          continent.id,
          selectedPoliticalRegionId,
          newVertex,
          edgeSubdividePreview.insertAfterIndex
        );

        // Recalculate area/perimeter
        updatePoliticalRegion(continent.id, selectedPoliticalRegionId, {
          perimeterMiles: calculatePolygonPerimeter(updatedVertices, mapScale),
          areaSquareMiles: calculatePolygonArea(updatedVertices, mapScale),
        });
      }

      setEdgeSubdividePreview(null);
      return;
    }

    // In location placement mode, place the location
    if (placingLocation && mapScale && onPlaceLocation) {
      const latitudeBand = getLatitudeBandAtPosition(pos.y, imageSize.height, mapScale);

      if (latitudeBand) {
        // Calculate exact observer radius from Y position for precise sunrise/sunset
        const observerRadius = pixelToMiles(pos.y, mapScale);

        onPlaceLocation({
          x: pos.x,
          y: pos.y,
          latitudeBand,
          observerRadius
        });
        setPlacingLocation(false); // Exit placement mode after placing
      }
    }

    // In location assignment mode, open the assignment modal
    if (assigningLocation && mapScale && onAssignLocation) {
      const latitudeBand = getLatitudeBandAtPosition(pos.y, imageSize.height, mapScale);

      if (latitudeBand) {
        const observerRadius = pixelToMiles(pos.y, mapScale);

        onAssignLocation({
          x: pos.x,
          y: pos.y,
          latitudeBand,
          observerRadius
        });
        setAssigningLocation(false); // Exit assignment mode after clicking
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredBand(null);
    setSnapPreview(null);
    setEdgeSubdividePreview(null);
    if (draggingWaypoint) {
      setDraggingWaypoint(null);
      dragStartRef.current = null;
    }
    if (draggingPoliticalVertex) {
      setDraggingPoliticalVertex(null);
      draggingPoliticalVertexRef.current = null;
      dragStartRef.current = null;
    }
    if (draggingPin) {
      // Finalize pin drag when mouse leaves (save position)
      finalizePinDrag();
    }
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }
  };

  // === ZOOM AND PAN ===

  const handleZoomIn = useCallback(() => {
    setIsAnimatingZoom(true);
    setZoom(prevZoom => {
      const newZoom = Math.min(prevZoom * 1.5, 5);
      // Scale pan to keep current view center stable
      const zoomChange = newZoom / prevZoom;
      setPan(prevPan => ({
        x: prevPan.x * zoomChange,
        y: prevPan.y * zoomChange,
      }));
      return newZoom;
    });
    setTimeout(() => setIsAnimatingZoom(false), 200);
  }, []);

  const handleZoomOut = useCallback(() => {
    setIsAnimatingZoom(true);
    setZoom(prevZoom => {
      const newZoom = Math.max(prevZoom / 1.5, 1);
      // Scale pan to keep current view center stable
      const zoomChange = newZoom / prevZoom;
      setPan(prevPan => ({
        x: prevPan.x * zoomChange,
        y: prevPan.y * zoomChange,
      }));
      return newZoom;
    });
    setTimeout(() => setIsAnimatingZoom(false), 200);
  }, []);

  const handleResetZoom = useCallback(() => {
    setIsAnimatingZoom(true);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setTimeout(() => setIsAnimatingZoom(false), 200);
  }, []);

  // Scroll-to-zoom: attach wheel handler with { passive: false } to allow preventDefault
  // Zooms toward cursor position for intuitive navigation
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

      // Get current values synchronously to avoid stale closure issues
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Offset from center to cursor (in screen pixels)
      const offsetX = cursorX - centerX;
      const offsetY = cursorY - centerY;

      setZoom(prevZoom => {
        const newZoom = Math.min(Math.max(prevZoom * zoomFactor, 1), 5);

        // If zoom didn't actually change (hit min/max), don't adjust pan
        if (newZoom === prevZoom) return prevZoom;

        // Adjust pan so the point under cursor stays fixed
        // The key insight: cursor offset from center stays constant in screen space,
        // but represents different image coordinates at different zoom levels.
        // We need to adjust pan to compensate.
        const zoomRatio = newZoom / prevZoom;

        setPan(prevPan => ({
          x: prevPan.x * zoomRatio - offsetX * (zoomRatio - 1),
          y: prevPan.y * zoomRatio - offsetY * (zoomRatio - 1),
        }));

        return newZoom;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handlePanStart = useCallback((e) => {
    // Middle mouse button or shift+left click for panning
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [pan]);

  const handlePanMove = useCallback((e) => {
    if (isPanning && panStartRef.current) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }
  }, [isPanning]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    panStartRef.current = null;
  }, []);

  // === TOUCH/POINTER GESTURES (using @use-gesture/react) ===

  // Helper: convert screen coordinates to image coordinates
  const screenToImageCoords = useCallback((clientX, clientY) => {
    const img = mapContainerRef.current?.querySelector('img');
    if (!img) return null;

    const imgRect = img.getBoundingClientRect();
    const scaleX = imageSize.width / imgRect.width;
    const scaleY = imageSize.height / imgRect.height;

    const x = Math.round((clientX - imgRect.left) * scaleX);
    const y = Math.round((clientY - imgRect.top) * scaleY);

    if (x < 0 || x > imageSize.width || y < 0 || y > imageSize.height) return null;
    return { x, y };
  }, [imageSize]);

  // Helper: update vertex position (for drag operations)
  // Uses ref instead of state to avoid stale closure issues in gesture callbacks
  const updateVertexPosition = useCallback((pos) => {
    const dragInfo = draggingPoliticalVertexRef.current;
    if (!dragInfo || !continent) return;

    const vertex = dragInfo.vertex;

    if (vertex.sharedId) {
      // Update all linked vertices
      updateLinkedPoliticalVertices(continent.id, vertex.sharedId, { x: pos.x, y: pos.y });

      // Recalculate area/perimeter for all affected regions
      for (const region of continent.politicalRegions || []) {
        const hasLinkedVertex = region.vertices?.some(v => v.sharedId === vertex.sharedId);
        if (hasLinkedVertex) {
          const updatedVertices = region.vertices.map(v =>
            v.sharedId === vertex.sharedId ? { ...v, x: pos.x, y: pos.y } : v
          );
          updatePoliticalRegion(continent.id, region.id, {
            perimeterMiles: calculatePolygonPerimeter(updatedVertices, mapScale),
            areaSquareMiles: calculatePolygonArea(updatedVertices, mapScale),
          });
        }
      }
    } else {
      // Update just this vertex
      const updatedVertices = continent.politicalRegions
        ?.find(r => r.id === dragInfo.regionId)
        ?.vertices.map(v =>
          v.id === dragInfo.vertexId
            ? { ...v, x: pos.x, y: pos.y }
            : v
        ) || [];

      updatePoliticalRegion(continent.id, dragInfo.regionId, {
        vertices: updatedVertices,
        perimeterMiles: calculatePolygonPerimeter(updatedVertices, mapScale),
        areaSquareMiles: calculatePolygonArea(updatedVertices, mapScale),
      });
    }
  }, [continent, mapScale, updateLinkedPoliticalVertices, updatePoliticalRegion]);

  // Touch move handler for political vertices (mobile support)
  // Handles continuous drag directly on the vertex element
  // NOTE: Must be defined after screenToImageCoords and updateVertexPosition
  const handlePoliticalVertexTouchMove = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!draggingPoliticalVertexRef.current) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const pos = screenToImageCoords(touch.clientX, touch.clientY);
    if (pos) {
      updateVertexPosition(pos);
    }
  }, [screenToImageCoords, updateVertexPosition]);

  // Touch end handler for political vertices (mobile support)
  const handlePoliticalVertexTouchEnd = useCallback((e) => {
    e.stopPropagation();

    if (draggingPoliticalVertexRef.current) {
      setDraggingPoliticalVertex(null);
      draggingPoliticalVertexRef.current = null;
      dragStartRef.current = null;
    }
  }, []);

  // Unified gesture handler using use-gesture
  const bindGestures = useGesture(
    {
      onPinch: ({ first, offset: [scale], origin: [ox, oy], delta: [ds, da], memo }) => {
        if (first) {
          // Store initial state when pinch starts
          return {
            initialZoom: zoom,
            lastOrigin: [ox, oy],
          };
        }

        if (!memo) return memo;

        // Use offset which gives us a normalized scale factor (1 = no change)
        const newZoom = Math.min(Math.max(memo.initialZoom * scale, 1), 5);
        setZoom(newZoom);

        // Pan based on origin movement (two-finger drag during pinch)
        const originDx = ox - memo.lastOrigin[0];
        const originDy = oy - memo.lastOrigin[1];
        if (Math.abs(originDx) > 0.5 || Math.abs(originDy) > 0.5) {
          setPan(prev => ({
            x: prev.x + originDx,
            y: prev.y + originDy,
          }));
        }

        return {
          ...memo,
          lastOrigin: [ox, oy],
        };
      },
      onPinchEnd: () => {
        // Reset drag state if it was set during pinch
        if (draggingPoliticalVertexRef.current) {
          setDraggingPoliticalVertex(null);
          draggingPoliticalVertexRef.current = null;
        }
      },
      onDrag: ({ pinching, cancel, delta: [dx, dy], last, xy: [x, y], touches, event, tap }) => {
        // Skip taps
        if (tap) return;

        // Don't interfere with pinch gestures (pan is handled in onPinch)
        if (pinching) {
          cancel();
          return;
        }

        // Get touch count from various sources
        const touchCount = touches || event?.touches?.length || 0;

        // Two-finger drag for panning (when NOT pinching)
        if (touchCount >= 2) {
          setPan(prev => ({
            x: prev.x + dx,
            y: prev.y + dy,
          }));
          return;
        }

        // Single-finger drag for vertex dragging (only if a vertex is being dragged)
        // Use ref to access current value (avoids stale closure)
        if (draggingPoliticalVertexRef.current && touchCount <= 1) {
          const pos = screenToImageCoords(x, y);
          if (pos) {
            updateVertexPosition(pos);
          }

          // Clear vertex drag state when this drag gesture ends
          if (last) {
            setDraggingPoliticalVertex(null);
            draggingPoliticalVertexRef.current = null;
            dragStartRef.current = null;
          }
        }
      },
      onDragEnd: () => {
        // Only clear non-vertex drag state here
        // Vertex dragging is cleared in onDrag when last=true
        dragStartRef.current = null;
      },
    },
    {
      eventOptions: { passive: false },
      drag: {
        filterTaps: true,
        pointer: { touch: true },
        threshold: 5, // Small threshold to distinguish from taps
      },
      pinch: {
        scaleBounds: { min: 0.2, max: 5 },
        rubberband: true,
      },
    }
  );

  // Handle clicking on a region pin
  const handlePinClick = (e, region) => {
    e.stopPropagation(); // Don't trigger map click

    // If we just finished dragging this pin (with actual movement), don't also select it
    if (pinDragOccurredRef.current) {
      pinDragOccurredRef.current = false; // Reset for next interaction
      return;
    }

    // In path drawing mode, add waypoint at the pin's location instead of selecting region
    if (drawingMode === 'path' && region.mapPosition) {
      handleAddWaypoint({ x: region.mapPosition.x, y: region.mapPosition.y });
      return;
    }

    // In weather region drawing mode, add vertex at the pin's location
    if (drawingMode === 'weatherRegion' && region.mapPosition) {
      handleAddWeatherRegionVertex({ x: region.mapPosition.x, y: region.mapPosition.y });
      return;
    }

    // In political region drawing mode, add vertex at the pin's location
    if (drawingMode === 'politicalRegion' && region.mapPosition) {
      handleAddPoliticalRegionVertex({ x: region.mapPosition.x, y: region.mapPosition.y });
      return;
    }

    if (onSelectRegion) {
      onSelectRegion(region.id);
    }
  };

  // No continent provided
  if (!continent) {
    return (
      <div className="world-map-empty">
        <MapPin size={48} className="empty-icon" />
        <h5>No Continent Selected</h5>
        <p>Select a continent to view its map.</p>
      </div>
    );
  }

  // No map configured for this continent
  if (!mapImage) {
    return (
      <div className="world-map-empty">
        <MapPin size={48} className="empty-icon" />
        <h5>No Map Configured</h5>
        <p>Upload a map image for {continent.name} to visualize its geography and place locations.</p>
        <Button variant="primary" onClick={() => setShowConfig(true)}>
          <Plus size={18} className="me-2" />
          Add Map
        </Button>
        <MapConfigModal show={showConfig} onHide={() => setShowConfig(false)} continent={continent} />
      </div>
    );
  }

  return (
    <div className="world-map-view">
      <div className="map-header">
        <h5>{continent.name}</h5>
        <div className="map-header-controls">
          {/* Add Location button */}
          {onPlaceLocation && (
            <Button
              variant={placingLocation ? 'primary' : 'outline-secondary'}
              size="sm"
              onClick={() => {
                setPlacingLocation(!placingLocation);
                setAssigningLocation(false);
              }}
              title={placingLocation ? 'Cancel adding location' : 'Add a new location'}
              className="layer-toggle"
            >
              <MapPin size={14} />
            </Button>
          )}
          {/* Link Existing Location button */}
          {onAssignLocation && (
            <Button
              variant={assigningLocation ? 'success' : 'outline-secondary'}
              size="sm"
              onClick={() => {
                setAssigningLocation(!assigningLocation);
                setPlacingLocation(false);
              }}
              title={assigningLocation ? 'Cancel linking' : 'Link existing location to map'}
              className="layer-toggle"
            >
              <Link size={14} />
            </Button>
          )}
          <div className="header-divider" />
          {/* Layer toggles */}
          <Button
            variant={showClimate ? 'primary' : 'outline-secondary'}
            size="sm"
            onClick={() => setShowClimate(!showClimate)}
            title={showClimate ? 'Hide climate bands' : 'Show climate bands'}
            className="layer-toggle"
          >
            <Thermometer size={14} />
          </Button>
          <Button
            variant={showPaths ? 'primary' : 'outline-secondary'}
            size="sm"
            onClick={() => setShowPaths(!showPaths)}
            title={showPaths ? 'Hide paths' : 'Show paths'}
            className="layer-toggle"
          >
            <Route size={14} />
          </Button>
          <Button
            variant={showWeatherRegions ? 'info' : 'outline-secondary'}
            size="sm"
            onClick={() => setShowWeatherRegions(!showWeatherRegions)}
            title={showWeatherRegions ? 'Hide weather regions' : 'Show weather regions'}
            className="layer-toggle"
          >
            <Cloud size={14} />
          </Button>
          <Button
            variant={showPoliticalRegions ? 'warning' : 'outline-secondary'}
            size="sm"
            onClick={() => setShowPoliticalRegions(!showPoliticalRegions)}
            title={showPoliticalRegions ? 'Hide political regions' : 'Show political regions'}
            className="layer-toggle"
          >
            <Crown size={14} />
          </Button>
          <div className="header-divider" />
          {/* Zoom controls */}
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </Button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleResetZoom}
            disabled={zoom <= 1}
            title="Reset zoom"
          >
            <RotateCcw size={14} />
          </Button>
          <div className="header-divider" />
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowConfig(true)}
            title="Map settings"
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className={`map-container ${drawingMode !== 'none' ? 'drawing-mode' : ''} ${placingLocation ? 'placing-mode' : ''} ${assigningLocation ? 'assigning-mode' : ''} ${draggingWaypoint ? 'dragging' : ''} ${draggingPin ? 'dragging-pin' : ''} ${isPanning ? 'panning' : ''}`}
        onClick={handleMapClick}
        onMouseMove={(e) => { handleMouseMove(e); handlePanMove(e); }}
        onMouseUp={(e) => { handleMouseUp(); handlePanEnd(); }}
        onMouseDown={handlePanStart}
        onMouseLeave={handleMouseLeave}
        {...bindGestures()}
      >
        {/* Wrapper that matches the image's displayed size exactly */}
        <div
          className={`map-image-wrapper ${isAnimatingZoom ? 'animating' : ''}`}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
          }}
        >
          <img
            ref={imageRef}
            src={mapImage}
            alt="World map"
            className="map-image"
            onLoad={handleImageLoad}
            draggable={false}
          />

          {/* SVG overlay for bands and paths */}
          {imageSize.width > 0 && (
            <svg
              className="band-overlay-svg"
              viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Curved latitude bands */}
              {showClimate && curvedBands.map((band) => {
                const path = generateBandPath(band, imageSize.width, imageSize.height);
                if (!path) return null;

                const labelY = band.outerArc?.points?.[0]?.y ?? 0;
                const labelX = imageSize.width - 10;

                return (
                  <g key={band.name} className={hoveredBand === band.name ? 'hovered' : ''}>
                    <path
                      d={path}
                      fill={band.color}
                      stroke={band.strokeColor}
                      strokeWidth="1"
                      className="band-path"
                    />
                    <text
                      x={labelX}
                      y={labelY + 15}
                      className="band-label-svg"
                      textAnchor="end"
                    >
                      {band.label}
                    </text>
                  </g>
                );
              })}

              {/* Saved weather regions (rendered first, behind paths) */}
              {showWeatherRegions && continent?.weatherRegions?.filter(r => r.isVisible).map(region => (
                <g
                  key={region.id}
                  className={`map-region weather-region ${selectedWeatherRegionId === region.id ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWeatherRegionId(region.id === selectedWeatherRegionId ? null : region.id);
                  }}
                >
                  <polygon
                    points={verticesToSvgPoints(region.vertices)}
                    fill={region.color}
                    fillOpacity="0.3"
                    stroke={region.color}
                    strokeWidth="2"
                    className="region-polygon"
                  />
                  {/* Invisible wider polygon for easier click targeting */}
                  <polygon
                    points={verticesToSvgPoints(region.vertices)}
                    fill="transparent"
                    stroke="transparent"
                    strokeWidth="10"
                    style={{ cursor: 'pointer' }}
                  />
                  {/* Vertex handles (show when selected) */}
                  {selectedWeatherRegionId === region.id && region.vertices.map((v, idx) => (
                    <circle
                      key={v.id}
                      cx={v.x}
                      cy={v.y}
                      r="6"
                      className="vertex-marker"
                      fill={region.color}
                      stroke="white"
                      strokeWidth="2"
                      style={{ cursor: 'grab' }}
                    />
                  ))}
                </g>
              ))}

              {/* Active weather region being drawn */}
              {activeWeatherRegion && activeWeatherRegion.vertices.length > 0 && (
                <g className="map-region weather-region active-drawing">
                  {/* Draw as polygon if 3+ vertices, otherwise as polyline */}
                  {activeWeatherRegion.vertices.length >= 3 ? (
                    <polygon
                      points={verticesToSvgPoints(activeWeatherRegion.vertices)}
                      fill={activeWeatherRegion.color}
                      fillOpacity="0.2"
                      stroke={activeWeatherRegion.color}
                      strokeWidth="2"
                      strokeDasharray="8 4"
                      className="region-polygon"
                    />
                  ) : (
                    <polyline
                      points={verticesToSvgPoints(activeWeatherRegion.vertices)}
                      fill="none"
                      stroke={activeWeatherRegion.color}
                      strokeWidth="2"
                      strokeDasharray="8 4"
                    />
                  )}
                  {/* Vertex markers while drawing */}
                  {activeWeatherRegion.vertices.map((v, idx) => (
                    <circle
                      key={v.id}
                      cx={v.x}
                      cy={v.y}
                      r="6"
                      className={`vertex-marker drawing ${idx === 0 ? 'start' : ''}`}
                      fill={activeWeatherRegion.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  ))}
                </g>
              )}

              {/* Saved political regions (rendered after weather regions) */}
              {/* Render non-selected regions first, then selected region on top */}
              {showPoliticalRegions && continent?.politicalRegions?.filter(r => r.isVisible && r.id !== selectedPoliticalRegionId).map(region => (
                <g
                  key={region.id}
                  className="map-region political-region"
                  onClick={(e) => {
                    if (drawingMode === 'politicalRegion') return;
                    e.stopPropagation();
                    setSelectedPoliticalRegionId(region.id);
                  }}
                >
                  <polygon
                    points={verticesToSvgPoints(region.vertices)}
                    fill={region.color}
                    fillOpacity="0.2"
                    stroke={region.color}
                    strokeWidth="3"
                    strokeDasharray="12 4"
                    className="region-polygon political"
                    style={{ pointerEvents: drawingMode === 'politicalRegion' ? 'none' : 'auto' }}
                  />
                  <polygon
                    points={verticesToSvgPoints(region.vertices)}
                    fill="transparent"
                    stroke="transparent"
                    strokeWidth="10"
                    style={{
                      cursor: drawingMode === 'politicalRegion' ? 'crosshair' : 'pointer',
                      pointerEvents: drawingMode === 'politicalRegion' ? 'none' : 'auto'
                    }}
                  />
                </g>
              ))}
              {/* Selected political region rendered last (on top) */}
              {showPoliticalRegions && selectedPoliticalRegionId && continent?.politicalRegions?.filter(r => r.isVisible && r.id === selectedPoliticalRegionId).map(region => (
                <g
                  key={region.id}
                  className={`map-region political-region ${selectedPoliticalRegionId === region.id ? 'selected' : ''}`}
                  onClick={(e) => {
                    // In drawing mode, let the click pass through to add vertices
                    if (drawingMode === 'politicalRegion') {
                      return; // Don't stop propagation, don't select
                    }
                    // If there's an edge subdivide preview, let the click through to add a vertex
                    if (edgeSubdividePreview) {
                      return; // Don't stop propagation, let handleMapClick handle it
                    }
                    e.stopPropagation();
                    setSelectedPoliticalRegionId(region.id === selectedPoliticalRegionId ? null : region.id);
                  }}
                >
                  <polygon
                    points={verticesToSvgPoints(region.vertices)}
                    fill={region.color}
                    fillOpacity="0.2"
                    stroke={region.color}
                    strokeWidth="3"
                    strokeDasharray="12 4"
                    className="region-polygon political"
                    style={{ pointerEvents: drawingMode === 'politicalRegion' ? 'none' : 'auto' }}
                  />
                  {/* Invisible wider polygon for easier click targeting (disabled during drawing) */}
                  <polygon
                    points={verticesToSvgPoints(region.vertices)}
                    fill="transparent"
                    stroke="transparent"
                    strokeWidth="10"
                    style={{
                      cursor: drawingMode === 'politicalRegion' ? 'crosshair' : 'pointer',
                      pointerEvents: drawingMode === 'politicalRegion' ? 'none' : 'auto'
                    }}
                  />
                  {/* Vertex handles (show when selected) */}
                  {selectedPoliticalRegionId === region.id && region.vertices.map((v, idx) => (
                    <g key={v.id}>
                      {/* Invisible larger touch target for mobile */}
                      <circle
                        cx={v.x}
                        cy={v.y}
                        r="20"
                        fill="transparent"
                        style={{ cursor: 'grab', touchAction: 'none' }}
                        onMouseDown={(e) => handlePoliticalVertexMouseDown(e, region.id, v)}
                        onTouchStart={(e) => handlePoliticalVertexTouchStart(e, region.id, v)}
                        onTouchMove={handlePoliticalVertexTouchMove}
                        onTouchEnd={handlePoliticalVertexTouchEnd}
                        onContextMenu={(e) => handlePoliticalVertexContextMenu(e, region.id, v)}
                      />
                      {/* Visible vertex marker */}
                      <circle
                        cx={v.x}
                        cy={v.y}
                        r="6"
                        className={`vertex-marker political ${v.sharedId ? 'shared' : ''}`}
                        fill={region.color}
                        stroke={v.sharedId ? '#2ecc71' : 'white'}
                        strokeWidth={v.sharedId ? 3 : 2}
                        style={{ cursor: 'grab', pointerEvents: 'none' }}
                      />
                    </g>
                  ))}
                </g>
              ))}

              {/* Snappable vertices indicator (during political region drawing) */}
              {drawingMode === 'politicalRegion' && showPoliticalRegions && continent?.politicalRegions?.filter(r => r.isVisible).map(region => (
                <g key={`snap-${region.id}`} className="snappable-vertices">
                  {region.vertices.map(v => (
                    <circle
                      key={v.id}
                      cx={v.x}
                      cy={v.y}
                      r="8"
                      fill="rgba(46, 204, 113, 0.2)"
                      stroke="rgba(46, 204, 113, 0.5)"
                      strokeWidth="1"
                      className="snappable-vertex-marker"
                      style={{ pointerEvents: 'none' }}
                    />
                  ))}
                </g>
              ))}

              {/* Snap preview indicators */}
              {snapPreview && drawingMode === 'politicalRegion' && (
                <g className="snap-preview">
                  {snapPreview.type === 'vertex' && (
                    <>
                      {/* Highlight ring around vertex being snapped to */}
                      <circle
                        cx={snapPreview.x}
                        cy={snapPreview.y}
                        r="12"
                        fill="none"
                        stroke="#2ecc71"
                        strokeWidth="3"
                        className="snap-vertex-ring"
                      />
                      <circle
                        cx={snapPreview.x}
                        cy={snapPreview.y}
                        r="5"
                        fill="#2ecc71"
                      />
                    </>
                  )}

                  {snapPreview.type === 'edge' && (
                    <>
                      {/* Highlight the edge being snapped to */}
                      <line
                        x1={snapPreview.vertex1.x}
                        y1={snapPreview.vertex1.y}
                        x2={snapPreview.vertex2.x}
                        y2={snapPreview.vertex2.y}
                        stroke="#2ecc71"
                        strokeWidth="4"
                        className="snap-edge-highlight"
                      />
                      {/* Show snap point on the edge */}
                      <circle
                        cx={snapPreview.x}
                        cy={snapPreview.y}
                        r="6"
                        fill="#2ecc71"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </>
                  )}

                  {snapPreview.type === 'warning' && (
                    <>
                      {/* Warning indicator - vertex would be inside existing polygon */}
                      <circle
                        cx={snapPreview.x}
                        cy={snapPreview.y}
                        r="10"
                        fill="none"
                        stroke="#e74c3c"
                        strokeWidth="3"
                        strokeDasharray="4 2"
                        className="snap-warning-ring"
                      />
                    </>
                  )}
                </g>
              )}

              {/* Edge subdivision preview (for selected political regions) */}
              {edgeSubdividePreview && drawingMode === 'none' && (
                <g className="edge-subdivide-preview">
                  {/* Highlight the edge being subdivided */}
                  <line
                    x1={edgeSubdividePreview.vertex1.x}
                    y1={edgeSubdividePreview.vertex1.y}
                    x2={edgeSubdividePreview.vertex2.x}
                    y2={edgeSubdividePreview.vertex2.y}
                    stroke="#3498db"
                    strokeWidth="4"
                    className="snap-edge-highlight"
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Show the point where new vertex will be added */}
                  <circle
                    cx={edgeSubdividePreview.x}
                    cy={edgeSubdividePreview.y}
                    r="8"
                    fill="#3498db"
                    stroke="white"
                    strokeWidth="2"
                    className="snap-vertex-ring"
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Plus icon indicator */}
                  <text
                    x={edgeSubdividePreview.x}
                    y={edgeSubdividePreview.y + 1}
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ pointerEvents: 'none' }}
                  >
                    +
                  </text>
                </g>
              )}

              {/* Active political region being drawn */}
              {activePoliticalRegion && activePoliticalRegion.vertices.length > 0 && (
                <g className="map-region political-region active-drawing">
                  {/* Draw as polygon if 3+ vertices, otherwise as polyline */}
                  {activePoliticalRegion.vertices.length >= 3 ? (
                    <polygon
                      points={verticesToSvgPoints(activePoliticalRegion.vertices)}
                      fill={activePoliticalRegion.color}
                      fillOpacity="0.15"
                      stroke={activePoliticalRegion.color}
                      strokeWidth="3"
                      strokeDasharray="8 4"
                      className="region-polygon political"
                    />
                  ) : (
                    <polyline
                      points={verticesToSvgPoints(activePoliticalRegion.vertices)}
                      fill="none"
                      stroke={activePoliticalRegion.color}
                      strokeWidth="3"
                      strokeDasharray="8 4"
                    />
                  )}
                  {/* Vertex markers while drawing */}
                  {activePoliticalRegion.vertices.map((v, idx) => (
                    <circle
                      key={v.id}
                      cx={v.x}
                      cy={v.y}
                      r="6"
                      className={`vertex-marker drawing political ${idx === 0 ? 'start' : ''}`}
                      fill={activePoliticalRegion.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  ))}
                </g>
              )}

              {/* Saved paths */}
              {showPaths && continent?.paths?.filter(p => p.isVisible).map(path => (
                <g
                  key={path.id}
                  className={`map-path ${selectedPathId === path.id ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPathId(path.id === selectedPathId ? null : path.id);
                  }}
                >
                  <polyline
                    points={waypointsToSvgPoints(path.waypoints)}
                    fill="none"
                    stroke={path.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="path-line"
                  />
                  {/* Invisible wider line for easier click targeting */}
                  <polyline
                    points={waypointsToSvgPoints(path.waypoints)}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ cursor: 'pointer' }}
                  />
                  {/* Waypoint handles (show when selected) */}
                  {selectedPathId === path.id && path.waypoints.map((wp, idx) => (
                    <circle
                      key={wp.id}
                      cx={wp.x}
                      cy={wp.y}
                      r="8"
                      className={`waypoint-marker ${idx === 0 ? 'start' : ''} ${idx === path.waypoints.length - 1 ? 'end' : ''}`}
                      fill={path.color}
                      stroke="white"
                      strokeWidth="2"
                      onMouseDown={(e) => handleWaypointMouseDown(e, path.id, wp.id)}
                      style={{ cursor: 'grab' }}
                    />
                  ))}
                </g>
              ))}

              {/* Active path being drawn */}
              {activePath && activePath.waypoints.length > 0 && (
                <g className="map-path active-drawing">
                  <polyline
                    points={waypointsToSvgPoints(activePath.waypoints)}
                    fill="none"
                    stroke={activePath.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="8 4"
                    className="path-line"
                  />
                  {/* Waypoint markers while drawing */}
                  {activePath.waypoints.map((wp, idx) => (
                    <circle
                      key={wp.id}
                      cx={wp.x}
                      cy={wp.y}
                      r="6"
                      className={`waypoint-marker drawing ${idx === 0 ? 'start' : ''}`}
                      fill={activePath.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  ))}
                </g>
              )}
            </svg>
          )}

          {/* Location pins - scale inversely with zoom */}
          {regionsWithPositions.map((region) => {
            // Check if this pin is being dragged or in move mode
            const isDragging = draggingPin?.regionId === region.id;
            const isMovable = movingPinId === region.id;
            const pinX = isDragging ? draggingPin.currentX : region.mapPosition.x;
            const pinY = isDragging ? draggingPin.currentY : region.mapPosition.y;

            return (
              <div
                key={region.id}
                className={`location-pin ${onSelectRegion ? 'clickable' : ''} ${isDragging ? 'dragging' : ''} ${isMovable ? 'movable' : ''}`}
                style={{
                  left: `${(pinX / imageSize.width) * 100}%`,
                  top: `${(pinY / imageSize.height) * 100}%`,
                  transform: `translate(-50%, -100%) scale(${1 / zoom})`,
                }}
                title={isMovable ? 'Drag to reposition, or click elsewhere to cancel' : region.name}
                onClick={(e) => handlePinClick(e, region)}
                onMouseDown={(e) => handlePinMouseDown(e, region)}
                onTouchStart={(e) => handlePinTouchStart(e, region)}
                onContextMenu={(e) => handlePinContextMenu(e, region)}
              >
                <MapPin size={24} className="pin-icon" />
                <span className="pin-label">{region.name}</span>
              </div>
            );
          })}
        </div>

        {/* Click hint overlay */}
        {drawingMode === 'path' ? (
          <div className="click-hint drawing">
            Click to add waypoints
            {activePath?.waypoints?.length >= 2 && ' - Click checkmark to finish'}
          </div>
        ) : drawingMode === 'weatherRegion' ? (
          <div className="click-hint drawing weather">
            Click to add vertices (min 3) - click near existing vertices to snap
            {activeWeatherRegion?.vertices?.length >= 3 && ' - Click checkmark to finish'}
          </div>
        ) : drawingMode === 'politicalRegion' ? (
          <div className={`click-hint drawing political ${
            snapPreview?.type === 'edge' ? 'snap-edge' :
            snapPreview?.type === 'vertex' ? 'snap-vertex' :
            snapPreview?.type === 'warning' ? 'snap-warning' : ''
          }`}>
            {snapPreview?.type === 'edge' ? (
              <>Click to snap to edge and create shared border</>
            ) : snapPreview?.type === 'vertex' ? (
              <>Click to snap to vertex and share corner</>
            ) : snapPreview?.type === 'warning' ? (
              <>Warning: Inside {snapPreview.regionName} - will create overlap</>
            ) : (
              <>Click to add vertices (min 3) - hover near borders to snap</>
            )}
            {activePoliticalRegion?.vertices?.length >= 3 && ' - Click checkmark to finish'}
          </div>
        ) : placingLocation ? (
          <div className="click-hint placing">
            Click to place a new location
            {hoveredBand && (
              <span className="hint-band"> in {BAND_LABELS[hoveredBand]}</span>
            )}
          </div>
        ) : assigningLocation ? (
          <div className="click-hint assigning">
            Click to link an existing location here
            {hoveredBand && (
              <span className="hint-band"> in {BAND_LABELS[hoveredBand]}</span>
            )}
          </div>
        ) : draggingPin && mapScale ? (
          <div className="click-hint dragging-pin">
            Dragging {draggingPin.region.name}
            {(() => {
              const newBand = getLatitudeBandAtPosition(draggingPin.currentY, imageSize.height, mapScale);
              return newBand ? (
                <span className="hint-band"> to {BAND_LABELS[newBand]}</span>
              ) : null;
            })()}
          </div>
        ) : movingPinId && (
          <div className="click-hint move-mode">
            Drag pin to reposition - click elsewhere to cancel
          </div>
        )}

        {/* Scale reference bar */}
        {scaleBar && (
          <div className="scale-bar">
            <div className="scale-bar-line" style={{ width: scaleBar.width }} />
            <span className="scale-bar-label">{scaleBar.label}</span>
          </div>
        )}
      </div>

      {/* Unified Map Tools Panel */}
      {mapImage && mapScale && (
        <MapToolsPanel
          continent={continent}
          drawingMode={drawingMode}
          // Path props
          onStartPathDrawing={handleStartDrawing}
          onFinishPathDrawing={handleFinishDrawing}
          onCancelPathDrawing={handleCancelDrawing}
          activePath={activePath}
          selectedPathId={selectedPathId}
          onSelectPath={setSelectedPathId}
          // Weather region props
          onStartWeatherRegionDrawing={handleStartWeatherRegionDrawing}
          onFinishWeatherRegionDrawing={handleFinishWeatherRegionDrawing}
          onCancelWeatherRegionDrawing={handleCancelWeatherRegionDrawing}
          activeWeatherRegion={activeWeatherRegion}
          selectedWeatherRegionId={selectedWeatherRegionId}
          onSelectWeatherRegion={setSelectedWeatherRegionId}
          // Political region props
          onStartPoliticalRegionDrawing={handleStartPoliticalRegionDrawing}
          onFinishPoliticalRegionDrawing={handleFinishPoliticalRegionDrawing}
          onCancelPoliticalRegionDrawing={handleCancelPoliticalRegionDrawing}
          activePoliticalRegion={activePoliticalRegion}
          selectedPoliticalRegionId={selectedPoliticalRegionId}
          onSelectPoliticalRegion={setSelectedPoliticalRegionId}
        />
      )}

      {/* Band legend */}
      {showClimate && visibleBands.length > 0 && (
        <div className="band-legend">
          {visibleBands.map((band) => (
            <div key={band.name} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: band.color.replace('0.3', '0.6') }}
              />
              <span className="legend-label">{band.label}</span>
              <span className="legend-range">
                {band.minMiles.toLocaleString()}-{band.maxMiles.toLocaleString()} mi
              </span>
            </div>
          ))}
        </div>
      )}

      <MapConfigModal show={showConfig} onHide={() => setShowConfig(false)} continent={continent} />

      {/* Vertex Context Menu */}
      {vertexContextMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="vertex-context-backdrop"
            onClick={handleCloseContextMenu}
          />
          <div
            className="vertex-context-menu"
            style={{
              left: vertexContextMenu.x,
              top: vertexContextMenu.y,
            }}
          >
            <div className="context-menu-header">
              Vertex Options
            </div>

            {/* Delete option */}
            <button
              className="context-menu-item danger"
              onClick={handleDeleteVertex}
              disabled={!vertexContextMenu.canDelete}
              title={!vertexContextMenu.canDelete ? 'Cannot delete: polygon needs at least 3 vertices' : 'Delete this vertex'}
            >
              Delete Vertex
              {!vertexContextMenu.canDelete && <span className="context-menu-hint">(min 3)</span>}
            </button>

            {/* Link options */}
            {vertexContextMenu.nearbyVertices.length > 0 && (
              <>
                <div className="context-menu-divider" />
                <div className="context-menu-section">Link to:</div>
                {vertexContextMenu.nearbyVertices.map((nearby) => (
                  <button
                    key={`${nearby.regionId}-${nearby.vertex.id}`}
                    className="context-menu-item"
                    onClick={() => handleLinkVertices(nearby.regionId, nearby.vertex)}
                  >
                    {nearby.regionName}
                    <span className="context-menu-hint">({Math.round(nearby.distance)}px)</span>
                  </button>
                ))}
              </>
            )}

            {vertexContextMenu.nearbyVertices.length === 0 && !vertexContextMenu.vertex.sharedId && (
              <div className="context-menu-info">
                No nearby vertices to link
              </div>
            )}

            {vertexContextMenu.vertex.sharedId && (
              <div className="context-menu-info linked">
                ✓ Already linked
              </div>
            )}
          </div>
        </>
      )}

      {/* Pin Context Menu */}
      {pinContextMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="pin-context-backdrop"
            onClick={handleClosePinContextMenu}
          />
          <div
            className="pin-context-menu"
            style={{
              left: pinContextMenu.x,
              top: pinContextMenu.y,
            }}
          >
            <div className="context-menu-header">
              {pinContextMenu.region.name}
            </div>

            {/* Move pin option - enables drag mode */}
            <button
              className="context-menu-item"
              onClick={() => {
                setMovingPinId(pinContextMenu.region.id);
                setPinContextMenu(null);
              }}
            >
              Move Pin
            </button>

            {/* Edit option - select the region */}
            <button
              className="context-menu-item"
              onClick={() => {
                if (onSelectRegion) {
                  onSelectRegion(pinContextMenu.region.id);
                }
                setPinContextMenu(null);
              }}
            >
              Edit Region
            </button>

            <div className="context-menu-divider" />

            {/* Remove from map option */}
            <button
              className="context-menu-item danger"
              onClick={handleUnassignPin}
              title="Remove this pin from the map (region data is preserved)"
            >
              Remove from Map
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default WorldMapView;

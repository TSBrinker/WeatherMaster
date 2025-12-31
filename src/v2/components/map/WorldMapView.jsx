import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { Settings, Plus, MapPin, ZoomIn, ZoomOut, RotateCcw, Layers, Route, Thermometer, Cloud, Crown } from 'lucide-react';
import { useWorld } from '../../contexts/WorldContext';
import {
  calculateVisibleBands,
  calculateCurvedBands,
  generateBandPath,
  getLatitudeBandAtPosition,
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
  WEATHER_REGION_COLORS,
  POLITICAL_REGION_COLORS,
} from '../../utils/regionUtils';
import MapConfigModal from './MapConfigModal';
import MapToolsPanel from './MapToolsPanel';
import './WorldMapView.css';

/**
 * WorldMapView - Interactive map display with latitude band overlay and location pins
 *
 * Props:
 * - continent: The continent object to display (has mapImage, mapScale)
 * - onPlaceLocation: Callback when user clicks to place a new location
 * - onSelectRegion: Callback when user clicks on a region pin
 */
const WorldMapView = ({ continent, onPlaceLocation, onSelectRegion }) => {
  const { activeWorld, groupedRegions, createPath, updatePath, createWeatherRegion, updateWeatherRegion, createPoliticalRegion, updatePoliticalRegion } = useWorld();
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

  // Waypoint dragging state
  const [draggingWaypoint, setDraggingWaypoint] = useState(null);
  const dragStartRef = useRef(null);

  // Layer visibility (default off to reduce visual clutter)
  const [showPaths, setShowPaths] = useState(false);
  const [showClimate, setShowClimate] = useState(false);
  const [showWeatherRegions, setShowWeatherRegions] = useState(false);
  const [showPoliticalRegions, setShowPoliticalRegions] = useState(false);

  // Location placement mode
  const [placingLocation, setPlacingLocation] = useState(false);

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(null);

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

    const newVertices = [...activePoliticalRegion.vertices, newVertex];

    setActivePoliticalRegion({
      ...activePoliticalRegion,
      vertices: newVertices,
      perimeterMiles: calculatePolygonPerimeter(newVertices, mapScale),
      areaSquareMiles: calculatePolygonArea(newVertices, mapScale),
    });
  }, [activePoliticalRegion, continent, mapScale]);

  // === WAYPOINT DRAGGING ===

  const handleWaypointMouseDown = useCallback((e, pathId, waypointId) => {
    e.stopPropagation();
    e.preventDefault();

    const pos = getImagePosition(e);
    if (!pos) return;

    setDraggingWaypoint({ pathId, waypointId });
    dragStartRef.current = pos;
  }, [getImagePosition]);

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
  }, [mapScale, imageSize, draggingWaypoint, continent, getImagePosition, updatePath]);

  const handleMouseUp = useCallback(() => {
    setDraggingWaypoint(null);
    dragStartRef.current = null;
  }, []);

  const handleMapClick = (e) => {
    // If dragging just ended, don't process as a click
    if (dragStartRef.current) {
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

    // In location placement mode, place the location
    if (placingLocation && mapScale && onPlaceLocation) {
      const latitudeBand = getLatitudeBandAtPosition(pos.y, imageSize.height, mapScale);

      if (latitudeBand) {
        onPlaceLocation({
          x: pos.x,
          y: pos.y,
          latitudeBand
        });
        setPlacingLocation(false); // Exit placement mode after placing
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredBand(null);
    if (draggingWaypoint) {
      setDraggingWaypoint(null);
      dragStartRef.current = null;
    }
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }
  };

  // === ZOOM AND PAN ===

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 5)); // Max 5x zoom
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 1)); // Min 1x (no zoom)
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(Math.max(prev * delta, 1), 5));
    }
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

  // Handle clicking on a region pin
  const handlePinClick = (e, region) => {
    e.stopPropagation(); // Don't trigger map click

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
              onClick={() => setPlacingLocation(!placingLocation)}
              title={placingLocation ? 'Cancel adding location' : 'Add a new location'}
              className="layer-toggle"
            >
              <MapPin size={14} />
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
        className={`map-container ${drawingMode !== 'none' ? 'drawing-mode' : ''} ${placingLocation ? 'placing-mode' : ''} ${draggingWaypoint ? 'dragging' : ''} ${isPanning ? 'panning' : ''}`}
        onClick={handleMapClick}
        onMouseMove={(e) => { handleMouseMove(e); handlePanMove(e); }}
        onMouseUp={(e) => { handleMouseUp(); handlePanEnd(); }}
        onMouseDown={handlePanStart}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        {/* Wrapper that matches the image's displayed size exactly */}
        <div
          className="map-image-wrapper"
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
              {showPoliticalRegions && continent?.politicalRegions?.filter(r => r.isVisible).map(region => (
                <g
                  key={region.id}
                  className={`map-region political-region ${selectedPoliticalRegionId === region.id ? 'selected' : ''}`}
                  onClick={(e) => {
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
                  {selectedPoliticalRegionId === region.id && region.vertices.map((v, idx) => (
                    <circle
                      key={v.id}
                      cx={v.x}
                      cy={v.y}
                      r="6"
                      className="vertex-marker political"
                      fill={region.color}
                      stroke="white"
                      strokeWidth="2"
                      style={{ cursor: 'grab' }}
                    />
                  ))}
                </g>
              ))}

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
          {regionsWithPositions.map((region) => (
            <div
              key={region.id}
              className={`location-pin ${onSelectRegion ? 'clickable' : ''}`}
              style={{
                left: `${(region.mapPosition.x / imageSize.width) * 100}%`,
                top: `${(region.mapPosition.y / imageSize.height) * 100}%`,
                transform: `translate(-50%, -100%) scale(${1 / zoom})`,
              }}
              title={region.name}
              onClick={(e) => handlePinClick(e, region)}
            >
              <MapPin size={24} className="pin-icon" />
              <span className="pin-label">{region.name}</span>
            </div>
          ))}
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
          <div className="click-hint drawing political">
            Click to add vertices (min 3) - click near existing vertices to snap
            {activePoliticalRegion?.vertices?.length >= 3 && ' - Click checkmark to finish'}
          </div>
        ) : placingLocation && (
          <div className="click-hint placing">
            Click to place a new location
            {hoveredBand && (
              <span className="hint-band"> in {BAND_LABELS[hoveredBand]}</span>
            )}
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
    </div>
  );
};

export default WorldMapView;

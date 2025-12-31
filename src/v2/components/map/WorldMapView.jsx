import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { Settings, Plus, MapPin, ZoomIn, ZoomOut, RotateCcw, Layers, Route, Thermometer } from 'lucide-react';
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
import MapConfigModal from './MapConfigModal';
import PathManager from './PathManager';
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
  const { activeWorld, groupedRegions, createPath, updatePath } = useWorld();
  const mapContainerRef = useRef(null);
  const imageRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 }); // Natural image dimensions
  const [displayedSize, setDisplayedSize] = useState({ width: 0, height: 0 }); // Displayed dimensions
  const [showConfig, setShowConfig] = useState(false);
  const [hoveredBand, setHoveredBand] = useState(null);

  // Path drawing state
  const [drawingMode, setDrawingMode] = useState('none'); // 'none' | 'drawing'
  const [activePath, setActivePath] = useState(null); // Path being drawn
  const [selectedPathId, setSelectedPathId] = useState(null);

  // Waypoint dragging state
  const [draggingWaypoint, setDraggingWaypoint] = useState(null);
  const dragStartRef = useRef(null);

  // Layer visibility (default off to reduce visual clutter)
  const [showPaths, setShowPaths] = useState(false);
  const [showClimate, setShowClimate] = useState(false);

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
    setDrawingMode('drawing');
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

    // In drawing mode, add waypoint
    if (drawingMode === 'drawing') {
      handleAddWaypoint(pos);
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

    // In drawing mode, add waypoint at the pin's location instead of selecting region
    if (drawingMode === 'drawing' && region.mapPosition) {
      handleAddWaypoint({ x: region.mapPosition.x, y: region.mapPosition.y });
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
        className={`map-container ${drawingMode === 'drawing' ? 'drawing-mode' : ''} ${placingLocation ? 'placing-mode' : ''} ${draggingWaypoint ? 'dragging' : ''} ${isPanning ? 'panning' : ''}`}
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
        {drawingMode === 'drawing' ? (
          <div className="click-hint drawing">
            Click to add waypoints
            {activePath?.waypoints?.length >= 2 && ' - Click checkmark to finish'}
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

      {/* Path Manager Panel */}
      {mapImage && mapScale && (
        <PathManager
          continent={continent}
          drawingMode={drawingMode}
          onStartDrawing={handleStartDrawing}
          onFinishDrawing={handleFinishDrawing}
          onCancelDrawing={handleCancelDrawing}
          activePath={activePath}
          selectedPathId={selectedPathId}
          onSelectPath={setSelectedPathId}
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

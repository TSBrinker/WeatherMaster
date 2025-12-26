import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { Settings, Plus, MapPin } from 'lucide-react';
import { useWorld } from '../../contexts/WorldContext';
import {
  calculateVisibleBands,
  calculateCurvedBands,
  generateBandPath,
  getLatitudeBandAtPosition,
  BAND_LABELS
} from '../../utils/mapUtils';
import MapConfigModal from './MapConfigModal';
import './WorldMapView.css';

/**
 * WorldMapView - Interactive map display with latitude band overlay and location pins
 */
const WorldMapView = ({ onPlaceLocation }) => {
  const { activeWorld } = useWorld();
  const mapContainerRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [showConfig, setShowConfig] = useState(false);
  const [clickPosition, setClickPosition] = useState(null);
  const [hoveredBand, setHoveredBand] = useState(null);

  const mapImage = activeWorld?.mapImage;
  const mapScale = activeWorld?.mapScale;

  // Calculate visible bands (flat for legend) and curved bands (for SVG overlay)
  const visibleBands = mapScale && imageSize.height > 0
    ? calculateVisibleBands(imageSize.height, mapScale)
    : [];

  const curvedBands = mapScale && imageSize.width > 0 && imageSize.height > 0
    ? calculateCurvedBands(imageSize.width, imageSize.height, mapScale)
    : [];

  // Get all regions with map positions
  const regionsWithPositions = activeWorld?.regions.filter(r => r.mapPosition) || [];

  const handleImageLoad = (e) => {
    setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
  };

  const handleMapClick = (e) => {
    if (!mapScale || !onPlaceLocation) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const img = e.currentTarget.querySelector('img');
    if (!img) return;

    // Calculate click position relative to the actual image
    const imgRect = img.getBoundingClientRect();
    const scaleX = imageSize.width / imgRect.width;
    const scaleY = imageSize.height / imgRect.height;

    const x = (e.clientX - imgRect.left) * scaleX;
    const y = (e.clientY - imgRect.top) * scaleY;

    // Ensure click is within image bounds
    if (x < 0 || x > imageSize.width || y < 0 || y > imageSize.height) return;

    const latitudeBand = getLatitudeBandAtPosition(y, imageSize.height, mapScale);

    if (latitudeBand) {
      onPlaceLocation({
        x: Math.round(x),
        y: Math.round(y),
        latitudeBand
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!mapScale || imageSize.height === 0) return;

    const img = e.currentTarget.querySelector('img');
    if (!img) return;

    const imgRect = img.getBoundingClientRect();
    const scaleY = imageSize.height / imgRect.height;
    const y = (e.clientY - imgRect.top) * scaleY;

    const band = getLatitudeBandAtPosition(y, imageSize.height, mapScale);
    setHoveredBand(band);
  };

  const handleMouseLeave = () => {
    setHoveredBand(null);
  };

  // No map configured
  if (!mapImage) {
    return (
      <div className="world-map-empty">
        <MapPin size={48} className="empty-icon" />
        <h5>No Map Configured</h5>
        <p>Upload a map image to visualize your world's geography and place locations.</p>
        <Button variant="primary" onClick={() => setShowConfig(true)}>
          <Plus size={18} className="me-2" />
          Add World Map
        </Button>
        <MapConfigModal show={showConfig} onHide={() => setShowConfig(false)} />
      </div>
    );
  }

  return (
    <div className="world-map-view">
      <div className="map-header">
        <h5>World Map</h5>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setShowConfig(true)}
          title="Map settings"
        >
          <Settings size={16} />
        </Button>
      </div>

      <div
        ref={mapContainerRef}
        className="map-container"
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Wrapper that matches the image's displayed size exactly */}
        <div className="map-image-wrapper">
          <img
            src={mapImage}
            alt="World map"
            className="map-image"
            onLoad={handleImageLoad}
            draggable={false}
          />

          {/* Curved latitude band overlays (SVG) */}
          {curvedBands.length > 0 && imageSize.width > 0 && (
            <svg
              className="band-overlay-svg"
              viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {curvedBands.map((band) => {
                const path = generateBandPath(band, imageSize.width, imageSize.height);
                if (!path) return null;

                // Find the center point of the band for label positioning
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
                    {/* Band label */}
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
            </svg>
          )}

          {/* Location pins */}
          {regionsWithPositions.map((region) => (
            <div
              key={region.id}
              className="location-pin"
              style={{
                left: `${(region.mapPosition.x / imageSize.width) * 100}%`,
                top: `${(region.mapPosition.y / imageSize.height) * 100}%`
              }}
              title={region.name}
            >
              <MapPin size={24} className="pin-icon" />
              <span className="pin-label">{region.name}</span>
            </div>
          ))}
        </div>

        {/* Click hint overlay */}
        {onPlaceLocation && (
          <div className="click-hint">
            Click to place a new location
            {hoveredBand && (
              <span className="hint-band"> in {BAND_LABELS[hoveredBand]}</span>
            )}
          </div>
        )}
      </div>

      {/* Band legend */}
      {visibleBands.length > 0 && (
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

      <MapConfigModal show={showConfig} onHide={() => setShowConfig(false)} />
    </div>
  );
};

export default WorldMapView;

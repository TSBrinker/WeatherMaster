import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Map, Upload, X } from 'lucide-react';
import { useWorld } from '../../contexts/WorldContext';
import { calculateVisibleBands, BAND_COLORS, BAND_LABELS } from '../../utils/mapUtils';
import './MapConfigModal.css';

/**
 * MapConfigModal - Upload and configure a world map with scale settings
 */
const MapConfigModal = ({ show, onHide }) => {
  const { activeWorld, updateWorldMap } = useWorld();
  const fileInputRef = useRef(null);

  // Local state for editing
  const [mapImage, setMapImage] = useState(null);
  const [milesPerPixel, setMilesPerPixel] = useState(0.5);
  const [topEdgeDistance, setTopEdgeDistance] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [previewBands, setPreviewBands] = useState([]);

  // Initialize from activeWorld when modal opens
  useEffect(() => {
    if (show && activeWorld) {
      setMapImage(activeWorld.mapImage || null);
      if (activeWorld.mapScale) {
        setMilesPerPixel(activeWorld.mapScale.milesPerPixel || 0.5);
        setTopEdgeDistance(activeWorld.mapScale.topEdgeDistanceFromCenter || 0);
      } else {
        setMilesPerPixel(0.5);
        setTopEdgeDistance(0);
      }
    }
  }, [show, activeWorld]);

  // Recalculate visible bands when settings change
  useEffect(() => {
    if (imageSize.height > 0) {
      const mapScale = { milesPerPixel, topEdgeDistanceFromCenter: topEdgeDistance };
      const bands = calculateVisibleBands(imageSize.height, mapScale);
      setPreviewBands(bands);
    }
  }, [milesPerPixel, topEdgeDistance, imageSize.height]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setMapImage(base64);

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMap = () => {
    setMapImage(null);
    setImageSize({ width: 0, height: 0 });
    setPreviewBands([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const mapScale = mapImage ? {
      milesPerPixel: parseFloat(milesPerPixel) || 0.5,
      topEdgeDistanceFromCenter: parseFloat(topEdgeDistance) || 0
    } : null;

    updateWorldMap(mapImage, mapScale);
    onHide();
  };

  const handleImageLoad = (e) => {
    setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
  };

  // Calculate map coverage info
  const mapHeightMiles = imageSize.height * milesPerPixel;
  const bottomEdgeMiles = topEdgeDistance + mapHeightMiles;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      className="map-config-modal"
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <Map className="me-2" size={24} style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
          World Map Configuration
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* File Upload Section */}
        <div className="upload-section mb-4">
          <h5>Map Image</h5>
          {!mapImage ? (
            <div
              className="upload-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={48} className="upload-icon" />
              <p className="upload-text">Click to upload a map image</p>
              <p className="upload-hint">PNG, JPG, or WebP recommended</p>
            </div>
          ) : (
            <div className="map-preview-container">
              <button
                className="remove-map-btn"
                onClick={handleRemoveMap}
                title="Remove map"
              >
                <X size={20} />
              </button>
              <div className="map-preview-wrapper">
                <img
                  src={mapImage}
                  alt="World map preview"
                  className="map-preview-image"
                  onLoad={handleImageLoad}
                />
                {/* Band overlay preview */}
                {previewBands.map((band) => (
                  <div
                    key={band.name}
                    className="band-overlay-preview"
                    style={{
                      top: `${(band.topPx / imageSize.height) * 100}%`,
                      height: `${(band.heightPx / imageSize.height) * 100}%`,
                      backgroundColor: band.color
                    }}
                  >
                    <span className="band-label">{band.label}</span>
                  </div>
                ))}
              </div>
              {imageSize.width > 0 && (
                <p className="image-dimensions">
                  {imageSize.width} × {imageSize.height} px
                </p>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Scale Configuration */}
        {mapImage && (
          <div className="scale-section">
            <h5>Scale Configuration</h5>

            <Form.Group className="mb-3">
              <Form.Label>Miles per Pixel</Form.Label>
              <Form.Control
                type="number"
                step="0.1"
                min="0.01"
                value={milesPerPixel}
                onChange={(e) => setMilesPerPixel(e.target.value)}
                className="scale-input"
              />
              <Form.Text className="text-muted">
                How many miles does each pixel represent?
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Distance from Top Edge to Center: <strong>{Number(topEdgeDistance).toLocaleString()} miles</strong>
              </Form.Label>
              <Form.Range
                min={0}
                max={6000}
                step={50}
                value={topEdgeDistance}
                onChange={(e) => setTopEdgeDistance(Number(e.target.value))}
                className="distance-slider"
              />
              <div className="slider-labels">
                <span>0 (Center)</span>
                <span>6,000 mi (Near Rim)</span>
              </div>
              <Form.Text className="text-muted">
                Drag to position the map - watch the bands update in the preview above
              </Form.Text>
            </Form.Group>

            {/* Coverage info */}
            <div className="coverage-info">
              <h6>Map Coverage</h6>
              <ul>
                <li>Top edge: <strong>{topEdgeDistance.toLocaleString()} miles</strong> from center</li>
                <li>Bottom edge: <strong>{Math.round(bottomEdgeMiles).toLocaleString()} miles</strong> from center</li>
                <li>Map height: <strong>{Math.round(mapHeightMiles).toLocaleString()} miles</strong></li>
              </ul>
              {previewBands.length > 0 && (
                <>
                  <h6>Visible Climate Bands</h6>
                  <div className="visible-bands-list">
                    {previewBands.map((band) => (
                      <span
                        key={band.name}
                        className="band-chip"
                        style={{ borderColor: band.color.replace('0.3', '0.8') }}
                      >
                        {band.label}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Map
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MapConfigModal;

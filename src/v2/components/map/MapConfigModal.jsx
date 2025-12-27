import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { Map, Upload, X } from 'lucide-react';
import { useWorld } from '../../contexts/WorldContext';
import { calculateVisibleBands, BAND_COLORS, BAND_LABELS } from '../../utils/mapUtils';
import { compressImage } from '../../utils/imageUtils';
import './MapConfigModal.css';

/**
 * MapConfigModal - Upload and configure a continent map with scale settings
 *
 * Compression strategy:
 * - Large images are compressed for storage (to fit in IndexedDB)
 * - BUT the user configures scale based on their ORIGINAL image dimensions
 * - On save, we adjust milesPerPixel to account for the compression
 * - This way the user's mental model stays consistent with their source image
 *
 * Props:
 * - continent: The continent object to configure (required)
 * - show: Whether the modal is visible
 * - onHide: Callback when modal is closed
 */
const MapConfigModal = ({ show, onHide, continent }) => {
  const { updateContinentMap } = useWorld();
  const fileInputRef = useRef(null);

  // Local state for editing
  const [mapImage, setMapImage] = useState(null);
  const [milesPerPixel, setMilesPerPixel] = useState(0.5);
  const [topEdgeDistance, setTopEdgeDistance] = useState(0);
  const [previewBands, setPreviewBands] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);

  // Track original vs compressed dimensions
  // originalSize: what the user thinks about (their source image)
  // scaleFactor: ratio of compressed to original (1 = no compression)
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [scaleFactor, setScaleFactor] = useState(1);
  const [wasCompressed, setWasCompressed] = useState(false);

  // Initialize from continent when modal opens
  useEffect(() => {
    if (show && continent) {
      setMapImage(continent.mapImage || null);
      if (continent.mapScale) {
        // Use userMilesPerPixel if available (new format), otherwise fall back to stored milesPerPixel
        // This ensures the user sees the value they originally entered
        setMilesPerPixel(continent.mapScale.userMilesPerPixel || continent.mapScale.milesPerPixel || 0.5);
        setTopEdgeDistance(continent.mapScale.topEdgeDistanceFromCenter || 0);
        // For existing maps, use stored originalSize if available
        if (continent.mapScale.originalSize) {
          setOriginalSize(continent.mapScale.originalSize);
          setScaleFactor(continent.mapScale.scaleFactor || 1);
          setWasCompressed(continent.mapScale.scaleFactor && continent.mapScale.scaleFactor !== 1);
        } else {
          // Legacy map without originalSize - will be set by handleImageLoad
          setOriginalSize({ width: 0, height: 0 });
          setScaleFactor(1);
          setWasCompressed(false);
        }
      } else {
        setMilesPerPixel(0.5);
        setTopEdgeDistance(0);
        setOriginalSize({ width: 0, height: 0 });
        setScaleFactor(1);
        setWasCompressed(false);
      }
    }
  }, [show, continent]);

  // Recalculate visible bands when settings change
  // Use ORIGINAL dimensions so user's scale inputs make sense
  useEffect(() => {
    if (originalSize.height > 0) {
      const mapScale = { milesPerPixel, topEdgeDistanceFromCenter: topEdgeDistance };
      const bands = calculateVisibleBands(originalSize.height, mapScale);
      setPreviewBands(bands);
    }
  }, [milesPerPixel, topEdgeDistance, originalSize.height]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsCompressing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const originalBase64 = event.target.result;

        // Compress image if needed
        const result = await compressImage(originalBase64);

        setMapImage(result.dataUrl);
        // Store ORIGINAL dimensions - this is what the user thinks about
        setOriginalSize({ width: result.originalWidth, height: result.originalHeight });
        setScaleFactor(result.scaleFactor);
        setWasCompressed(result.wasCompressed);
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setIsCompressing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMap = () => {
    setMapImage(null);
    setOriginalSize({ width: 0, height: 0 });
    setScaleFactor(1);
    setWasCompressed(false);
    setPreviewBands([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!continent) return;

    if (!mapImage) {
      updateContinentMap(continent.id, null, null);
      onHide();
      return;
    }

    // User entered milesPerPixel based on ORIGINAL image dimensions
    // We need to adjust for compression: if image was shrunk by half,
    // each pixel in the compressed image represents 2x the distance
    const userMilesPerPixel = parseFloat(milesPerPixel) || 0.5;
    const adjustedMilesPerPixel = userMilesPerPixel / scaleFactor;

    const mapScale = {
      milesPerPixel: adjustedMilesPerPixel,
      topEdgeDistanceFromCenter: parseFloat(topEdgeDistance) || 0,
      // Store original info so we can reconstruct the user's perspective when editing
      originalSize: originalSize,
      scaleFactor: scaleFactor,
      // Also store the user's original input for display purposes
      userMilesPerPixel: userMilesPerPixel,
    };

    updateContinentMap(continent.id, mapImage, mapScale);
    onHide();
  };

  const handleImageLoad = (e) => {
    // For legacy maps without originalSize stored, use the actual image dimensions
    // (This means legacy maps will use compressed dimensions, but that's the best we can do)
    if (originalSize.width === 0 && originalSize.height === 0) {
      setOriginalSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
    }
  };

  // Calculate map coverage info (based on original dimensions)
  const mapHeightMiles = originalSize.height * milesPerPixel;
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
          {continent?.name || 'Continent'} Map
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Compression notice - shown when image was compressed for storage */}
        {wasCompressed && (
          <Alert variant="info" className="mb-3">
            Your image was compressed for storage. Enter scale values based on your original image dimensions ({originalSize.width} × {originalSize.height} px) - we'll handle the rest automatically.
          </Alert>
        )}

        {/* File Upload Section */}
        <div className="upload-section mb-4">
          <h5>Map Image</h5>
          {isCompressing ? (
            <div className="upload-dropzone">
              <p className="upload-text">Compressing image...</p>
            </div>
          ) : !mapImage ? (
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
                {/* Band overlay preview - positioned as % of original dimensions */}
                {previewBands.map((band) => (
                  <div
                    key={band.name}
                    className="band-overlay-preview"
                    style={{
                      top: `${(band.topPx / originalSize.height) * 100}%`,
                      height: `${(band.heightPx / originalSize.height) * 100}%`,
                      backgroundColor: band.color
                    }}
                  >
                    <span className="band-label">{band.label}</span>
                  </div>
                ))}
              </div>
              {originalSize.width > 0 && (
                <p className="image-dimensions">
                  {originalSize.width} × {originalSize.height} px
                  {wasCompressed && <span className="compressed-badge"> (compressed for storage)</span>}
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

import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Route, Cloud, Crown, Pencil, Trash2, Eye, EyeOff, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useWorld } from '../../contexts/WorldContext';
import { formatDistance } from '../../utils/pathUtils';
import { formatArea } from '../../utils/regionUtils';
import './MapToolsPanel.css';

/**
 * MapToolsPanel - Unified panel for managing paths, weather regions, and political regions
 *
 * Consolidates PathManager, WeatherRegionManager, and PoliticalRegionManager into
 * a single accordion-style panel to reduce UI clutter.
 */
const MapToolsPanel = ({
  continent,
  // Drawing state
  drawingMode,
  // Path callbacks
  onStartPathDrawing,
  onFinishPathDrawing,
  onCancelPathDrawing,
  activePath,
  selectedPathId,
  onSelectPath,
  // Weather region callbacks
  onStartWeatherRegionDrawing,
  onFinishWeatherRegionDrawing,
  onCancelWeatherRegionDrawing,
  activeWeatherRegion,
  selectedWeatherRegionId,
  onSelectWeatherRegion,
  // Political region callbacks
  onStartPoliticalRegionDrawing,
  onFinishPoliticalRegionDrawing,
  onCancelPoliticalRegionDrawing,
  activePoliticalRegion,
  selectedPoliticalRegionId,
  onSelectPoliticalRegion,
}) => {
  const {
    updatePath, deletePath,
    updateWeatherRegion, deleteWeatherRegion,
    updatePoliticalRegion, deletePoliticalRegion,
  } = useWorld();

  // Which section is expanded (null = none, or 'paths' | 'weather' | 'political')
  const [expandedSection, setExpandedSection] = useState(null);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const paths = continent?.paths || [];
  const weatherRegions = continent?.weatherRegions || [];
  const politicalRegions = continent?.politicalRegions || [];

  // Auto-expand section when drawing
  const isDrawingPath = drawingMode === 'path';
  const isDrawingWeather = drawingMode === 'weatherRegion';
  const isDrawingPolitical = drawingMode === 'politicalRegion';

  const toggleSection = (section) => {
    if (drawingMode !== 'none') return; // Don't allow collapse while drawing
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Generic handlers
  const handleStartRename = (item) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const handleSaveRename = (type, itemId) => {
    if (!editingName.trim()) {
      handleCancelRename();
      return;
    }

    if (type === 'path') {
      updatePath(continent.id, itemId, { name: editingName.trim() });
    } else if (type === 'weather') {
      updateWeatherRegion(continent.id, itemId, { name: editingName.trim() });
    } else if (type === 'political') {
      updatePoliticalRegion(continent.id, itemId, { name: editingName.trim() });
    }
    handleCancelRename();
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleToggleVisibility = (type, item) => {
    if (type === 'path') {
      updatePath(continent.id, item.id, { isVisible: !item.isVisible });
    } else if (type === 'weather') {
      updateWeatherRegion(continent.id, item.id, { isVisible: !item.isVisible });
    } else if (type === 'political') {
      updatePoliticalRegion(continent.id, item.id, { isVisible: !item.isVisible });
    }
  };

  const handleDelete = (type, itemId) => {
    if (type === 'path') {
      if (selectedPathId === itemId) onSelectPath(null);
      deletePath(continent.id, itemId);
    } else if (type === 'weather') {
      if (selectedWeatherRegionId === itemId) onSelectWeatherRegion(null);
      deleteWeatherRegion(continent.id, itemId);
    } else if (type === 'political') {
      if (selectedPoliticalRegionId === itemId) onSelectPoliticalRegion(null);
      deletePoliticalRegion(continent.id, itemId);
    }
  };

  const handleColorChange = (type, itemId, color) => {
    if (type === 'path') {
      updatePath(continent.id, itemId, { color });
    } else if (type === 'weather') {
      updateWeatherRegion(continent.id, itemId, { color });
    } else if (type === 'political') {
      updatePoliticalRegion(continent.id, itemId, { color });
    }
  };

  if (!continent) return null;

  // Render a single item row (path or region)
  const renderItem = (type, item, isSelected, onSelect, measureLabel) => (
    <div
      key={item.id}
      className={`tool-item ${isSelected ? 'selected' : ''} ${!item.isVisible ? 'hidden-item' : ''}`}
      onClick={() => onSelect(item.id === (isSelected ? item.id : null) ? null : item.id)}
    >
      <input
        type="color"
        value={item.color}
        onChange={(e) => handleColorChange(type, item.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="item-color-picker"
      />

      {editingId === item.id ? (
        <div className="item-name-edit" onClick={(e) => e.stopPropagation()}>
          <Form.Control
            type="text"
            size="sm"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRename(type, item.id);
              if (e.key === 'Escape') handleCancelRename();
            }}
            autoFocus
          />
          <Button variant="link" size="sm" onClick={() => handleSaveRename(type, item.id)}>
            <Check size={12} />
          </Button>
          <Button variant="link" size="sm" onClick={handleCancelRename}>
            <X size={12} />
          </Button>
        </div>
      ) : (
        <div className="item-info">
          <span className="item-name">{item.name}</span>
          <span className="item-measure">{measureLabel}</span>
        </div>
      )}

      <div className="item-actions" onClick={(e) => e.stopPropagation()}>
        <Button variant="link" size="sm" onClick={() => handleStartRename(item)} title="Rename">
          <Pencil size={12} />
        </Button>
        <Button variant="link" size="sm" onClick={() => handleToggleVisibility(type, item)} title={item.isVisible ? 'Hide' : 'Show'}>
          {item.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
        </Button>
        <Button variant="link" size="sm" onClick={() => handleDelete(type, item.id)} className="delete-btn" title="Delete">
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="map-tools-panel">
      {/* PATHS SECTION */}
      <div className={`tool-section ${isDrawingPath || expandedSection === 'paths' ? 'expanded' : ''}`}>
        <div
          className="tool-section-header"
          onClick={() => toggleSection('paths')}
        >
          <span className="section-icon"><Route size={14} /></span>
          <span className="section-title">Paths</span>
          {paths.length > 0 && <span className="section-count">{paths.length}</span>}
          <span className="section-chevron">
            {isDrawingPath || expandedSection === 'paths' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </div>

        {(isDrawingPath || expandedSection === 'paths') && (
          <div className="tool-section-content">
            {/* Drawing controls */}
            {isDrawingPath ? (
              <div className="drawing-row">
                <span className="drawing-status">Drawing ({activePath?.waypoints?.length || 0} pts)</span>
                {activePath?.waypoints?.length >= 2 && (
                  <span className="drawing-measure">{formatDistance(activePath.totalDistanceMiles || 0)}</span>
                )}
                <div className="drawing-buttons">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={onFinishPathDrawing}
                    disabled={!activePath?.waypoints?.length || activePath.waypoints.length < 2}
                  >
                    <Check size={14} />
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={onCancelPathDrawing}>
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={onStartPathDrawing}
                className="draw-btn"
                disabled={drawingMode !== 'none'}
              >
                <Route size={14} /> Draw Path
              </Button>
            )}

            {/* Path list */}
            {paths.length > 0 && (
              <div className="item-list">
                {paths.map((path) => renderItem(
                  'path',
                  path,
                  selectedPathId === path.id,
                  onSelectPath,
                  formatDistance(path.totalDistanceMiles || 0)
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* WEATHER REGIONS SECTION */}
      <div className={`tool-section weather ${isDrawingWeather || expandedSection === 'weather' ? 'expanded' : ''}`}>
        <div
          className="tool-section-header"
          onClick={() => toggleSection('weather')}
        >
          <span className="section-icon"><Cloud size={14} /></span>
          <span className="section-title">Weather</span>
          {weatherRegions.length > 0 && <span className="section-count">{weatherRegions.length}</span>}
          <span className="section-chevron">
            {isDrawingWeather || expandedSection === 'weather' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </div>

        {(isDrawingWeather || expandedSection === 'weather') && (
          <div className="tool-section-content">
            {/* Drawing controls */}
            {isDrawingWeather ? (
              <div className="drawing-row weather">
                <span className="drawing-status">Drawing ({activeWeatherRegion?.vertices?.length || 0} pts)</span>
                {activeWeatherRegion?.vertices?.length >= 3 && (
                  <span className="drawing-measure">{formatArea(activeWeatherRegion.areaSquareMiles || 0)}</span>
                )}
                <div className="drawing-buttons">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={onFinishWeatherRegionDrawing}
                    disabled={!activeWeatherRegion?.vertices?.length || activeWeatherRegion.vertices.length < 3}
                  >
                    <Check size={14} />
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={onCancelWeatherRegionDrawing}>
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline-info"
                size="sm"
                onClick={onStartWeatherRegionDrawing}
                className="draw-btn"
                disabled={drawingMode !== 'none'}
              >
                <Cloud size={14} /> Draw Region
              </Button>
            )}

            {/* Weather region list */}
            {weatherRegions.length > 0 && (
              <div className="item-list">
                {weatherRegions.map((region) => renderItem(
                  'weather',
                  region,
                  selectedWeatherRegionId === region.id,
                  onSelectWeatherRegion,
                  formatArea(region.areaSquareMiles || 0)
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* POLITICAL REGIONS SECTION */}
      <div className={`tool-section political ${isDrawingPolitical || expandedSection === 'political' ? 'expanded' : ''}`}>
        <div
          className="tool-section-header"
          onClick={() => toggleSection('political')}
        >
          <span className="section-icon"><Crown size={14} /></span>
          <span className="section-title">Political</span>
          {politicalRegions.length > 0 && <span className="section-count">{politicalRegions.length}</span>}
          <span className="section-chevron">
            {isDrawingPolitical || expandedSection === 'political' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </div>

        {(isDrawingPolitical || expandedSection === 'political') && (
          <div className="tool-section-content">
            {/* Drawing controls */}
            {isDrawingPolitical ? (
              <div className="drawing-row political">
                <span className="drawing-status">Drawing ({activePoliticalRegion?.vertices?.length || 0} pts)</span>
                {activePoliticalRegion?.vertices?.length >= 3 && (
                  <span className="drawing-measure">{formatArea(activePoliticalRegion.areaSquareMiles || 0)}</span>
                )}
                <div className="drawing-buttons">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={onFinishPoliticalRegionDrawing}
                    disabled={!activePoliticalRegion?.vertices?.length || activePoliticalRegion.vertices.length < 3}
                  >
                    <Check size={14} />
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={onCancelPoliticalRegionDrawing}>
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline-warning"
                size="sm"
                onClick={onStartPoliticalRegionDrawing}
                className="draw-btn"
                disabled={drawingMode !== 'none'}
              >
                <Crown size={14} /> Draw Region
              </Button>
            )}

            {/* Political region list */}
            {politicalRegions.length > 0 && (
              <div className="item-list">
                {politicalRegions.map((region) => renderItem(
                  'political',
                  region,
                  selectedPoliticalRegionId === region.id,
                  onSelectPoliticalRegion,
                  formatArea(region.areaSquareMiles || 0)
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapToolsPanel;

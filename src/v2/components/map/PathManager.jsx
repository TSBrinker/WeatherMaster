import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Route, Pencil, Trash2, Eye, EyeOff, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useWorld } from '../../contexts/WorldContext';
import { formatDistance, getNextPathColor } from '../../utils/pathUtils';
import './PathManager.css';

/**
 * PathManager - UI panel for managing travel paths on a map
 *
 * Props:
 * - continent: The continent object containing paths
 * - drawingMode: Current drawing mode ('none' | 'drawing')
 * - onStartDrawing: Callback to enter drawing mode
 * - onFinishDrawing: Callback to exit drawing mode and save path
 * - onCancelDrawing: Callback to cancel current drawing
 * - activePath: The path currently being drawn (before save)
 * - selectedPathId: ID of currently selected path
 * - onSelectPath: Callback to select a path for editing
 */
const PathManager = ({
  continent,
  drawingMode,
  onStartDrawing,
  onFinishDrawing,
  onCancelDrawing,
  activePath,
  selectedPathId,
  onSelectPath,
}) => {
  const { updatePath, deletePath } = useWorld();
  const [editingNameId, setEditingNameId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed

  const paths = continent?.paths || [];

  // Auto-expand when drawing or when there are paths to show
  const shouldShow = drawingMode === 'drawing' || !isCollapsed;

  const handleStartRename = (path) => {
    setEditingNameId(path.id);
    setEditingName(path.name);
  };

  const handleSaveRename = (pathId) => {
    if (editingName.trim()) {
      updatePath(continent.id, pathId, { name: editingName.trim() });
    }
    setEditingNameId(null);
    setEditingName('');
  };

  const handleCancelRename = () => {
    setEditingNameId(null);
    setEditingName('');
  };

  const handleToggleVisibility = (path) => {
    updatePath(continent.id, path.id, { isVisible: !path.isVisible });
  };

  const handleDelete = (pathId) => {
    if (selectedPathId === pathId) {
      onSelectPath(null);
    }
    deletePath(continent.id, pathId);
  };

  const handleColorChange = (pathId, color) => {
    updatePath(continent.id, pathId, { color });
  };

  if (!continent) return null;

  return (
    <div className={`path-manager ${isCollapsed && drawingMode === 'none' ? 'collapsed' : ''}`}>
      <div
        className="path-manager-header"
        onClick={() => drawingMode === 'none' && setIsCollapsed(!isCollapsed)}
        style={{ cursor: drawingMode === 'none' ? 'pointer' : 'default' }}
      >
        <Route size={16} />
        <span>Travel Paths {paths.length > 0 && `(${paths.length})`}</span>
        {drawingMode === 'none' && (
          <span className="collapse-icon">
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </div>

      {shouldShow && (
        <>
          {/* Drawing controls */}
          <div className="path-controls">
            {drawingMode === 'none' ? (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={onStartDrawing}
                className="draw-path-btn"
              >
                <Route size={14} className="me-1" />
                Draw Path
              </Button>
            ) : (
              <div className="drawing-controls">
                <span className="drawing-indicator">
                  Drawing... ({activePath?.waypoints?.length || 0} points)
                </span>
                <div className="drawing-buttons">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={onFinishDrawing}
                    disabled={!activePath?.waypoints?.length || activePath.waypoints.length < 2}
                    title="Finish path (need at least 2 points)"
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={onCancelDrawing}
                    title="Cancel drawing"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Active path distance preview */}
          {drawingMode === 'drawing' && activePath?.waypoints?.length >= 2 && (
            <div className="active-path-info">
              <span className="distance-preview">
                {formatDistance(activePath.totalDistanceMiles || 0)}
              </span>
            </div>
          )}

          {/* Path list */}
          {paths.length > 0 && (
            <div className="path-list">
          {paths.map((path) => (
            <div
              key={path.id}
              className={`path-item ${selectedPathId === path.id ? 'selected' : ''} ${!path.isVisible ? 'hidden-path' : ''}`}
              onClick={() => onSelectPath(path.id === selectedPathId ? null : path.id)}
            >
              <input
                type="color"
                value={path.color}
                onChange={(e) => handleColorChange(path.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="path-color-picker"
                title="Change path color"
              />

              {editingNameId === path.id ? (
                <div className="path-name-edit" onClick={(e) => e.stopPropagation()}>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(path.id);
                      if (e.key === 'Escape') handleCancelRename();
                    }}
                    autoFocus
                  />
                  <Button variant="link" size="sm" onClick={() => handleSaveRename(path.id)}>
                    <Check size={12} />
                  </Button>
                  <Button variant="link" size="sm" onClick={handleCancelRename}>
                    <X size={12} />
                  </Button>
                </div>
              ) : (
                <div className="path-info">
                  <span className="path-name">{path.name}</span>
                  <span className="path-distance">{formatDistance(path.totalDistanceMiles || 0)}</span>
                </div>
              )}

              <div className="path-actions" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleStartRename(path)}
                  title="Rename path"
                >
                  <Pencil size={12} />
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleToggleVisibility(path)}
                  title={path.isVisible ? 'Hide path' : 'Show path'}
                >
                  {path.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleDelete(path.id)}
                  className="delete-btn"
                  title="Delete path"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

          {/* Empty state */}
          {paths.length === 0 && drawingMode === 'none' && (
            <div className="path-empty">
              <p>No paths yet. Click "Draw Path" to create a travel route.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PathManager;

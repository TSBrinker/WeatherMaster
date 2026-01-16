import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, ListGroup, Alert } from 'react-bootstrap';
import { MapPin } from 'lucide-react';
import { useWorld } from '../../contexts/WorldContext';
import { getAllLatitudeBands } from '../../data/templateHelpers';
import './RegionCreator.css';

/**
 * RegionAssigner - Modal to assign an existing region to a map position
 *
 * Shows regions that don't have a mapPosition yet, allowing the user to
 * link them to the clicked map location.
 */
const RegionAssigner = ({ show, onHide, mapPosition, continentId }) => {
  const { activeWorld, updateRegion } = useWorld();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const searchInputRef = useRef(null);

  const latitudeBands = getAllLatitudeBands();

  // Get regions without map positions
  const unassignedRegions = activeWorld?.regions?.filter(r => !r.mapPosition) || [];

  // Filter by search query
  const filteredRegions = searchQuery.trim()
    ? unassignedRegions.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : unassignedRegions;

  // Get the selected region object
  const selectedRegion = selectedRegionId
    ? unassignedRegions.find(r => r.id === selectedRegionId)
    : null;

  // Focus search input when modal opens
  useEffect(() => {
    if (show && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [show]);

  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setSearchQuery('');
      setSelectedRegionId(null);
    }
  }, [show]);

  const handleAssign = () => {
    if (!selectedRegionId || !mapPosition) return;

    // Update the region with the map position and continent
    const updates = {
      mapPosition: {
        x: mapPosition.x,
        y: mapPosition.y,
        observerRadius: mapPosition.observerRadius
      }
    };

    // Also assign to this continent if not already assigned
    if (continentId) {
      updates.continentId = continentId;
    }

    updateRegion(selectedRegionId, updates);

    // Close modal
    onHide();
  };

  const getLatitudeBandLabel = (bandKey) => {
    const band = latitudeBands.find(b => b.key === bandKey);
    return band?.label || bandKey;
  };

  return (
    <Modal show={show} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <MapPin size={20} className="me-2" />
          Link Existing Region
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {unassignedRegions.length === 0 ? (
          <Alert variant="info">
            <Alert.Heading>No Unassigned Regions</Alert.Heading>
            <p className="mb-0">
              All your regions already have map positions. Create a new region instead,
              or remove the map position from an existing region to reassign it.
            </p>
          </Alert>
        ) : (
          <>
            {/* Search input */}
            <Form.Group className="mb-3">
              <Form.Control
                ref={searchInputRef}
                type="text"
                placeholder="Search regions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="climate-search-input"
              />
              <Form.Text className="text-muted">
                {filteredRegions.length} region{filteredRegions.length !== 1 ? 's' : ''} without map position
              </Form.Text>
            </Form.Group>

            {/* Region list */}
            <div className="region-assigner-list">
              <ListGroup variant="flush">
                {filteredRegions.map(region => (
                  <ListGroup.Item
                    key={region.id}
                    action
                    active={selectedRegionId === region.id}
                    onClick={() => setSelectedRegionId(region.id)}
                    className="region-assigner-item"
                  >
                    <div className="region-assigner-item-name">{region.name}</div>
                    <div className="region-assigner-item-meta">
                      <span className="climate-band-tag">
                        {getLatitudeBandLabel(region.latitudeBand)}
                      </span>
                      {region.climate?.name && (
                        <span className="region-assigner-climate">
                          {region.climate.name}
                        </span>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              {filteredRegions.length === 0 && searchQuery.trim() && (
                <div className="climate-search-no-results p-3 text-center text-muted">
                  No regions match "{searchQuery}"
                </div>
              )}
            </div>

            {/* Selected region info */}
            {selectedRegion && (
              <Alert variant="secondary" className="mt-3 mb-0">
                <strong>{selectedRegion.name}</strong> will be placed at this location
                {continentId && selectedRegion.continentId !== continentId && (
                  <div className="small text-muted mt-1">
                    This region will also be moved to this continent
                  </div>
                )}
              </Alert>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleAssign}
          disabled={!selectedRegionId}
        >
          Assign to Map
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RegionAssigner;

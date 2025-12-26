import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useWorld } from '../../contexts/WorldContext';
import {
  getAllLatitudeBands,
  getTemplatesByLatitude,
  getTemplate,
  extractClimateProfile
} from '../../data/templateHelpers';

const RegionCreator = ({ show, onHide, initialLatitudeBand = null, mapPosition = null }) => {
  const { createRegion } = useWorld();

  // Form state
  const [latitudeBand, setLatitudeBand] = useState(initialLatitudeBand || 'temperate');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [regionName, setRegionName] = useState('');

  // Get available templates for selected latitude
  const availableTemplates = getTemplatesByLatitude(latitudeBand);
  const selectedTemplate = selectedTemplateId
    ? getTemplate(latitudeBand, selectedTemplateId)
    : null;

  // Update latitude band when initialLatitudeBand changes (e.g., from map click)
  useEffect(() => {
    if (show && initialLatitudeBand) {
      setLatitudeBand(initialLatitudeBand);
    }
  }, [show, initialLatitudeBand]);

  // Auto-select first template when latitude changes
  useEffect(() => {
    if (availableTemplates.length > 0) {
      setSelectedTemplateId(availableTemplates[0].id);
    }
  }, [latitudeBand]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!regionName.trim()) {
      alert('Please enter a region name');
      return;
    }

    if (!selectedTemplateId) {
      alert('Please select a template');
      return;
    }

    // Extract climate data from template
    const climateProfile = extractClimateProfile(selectedTemplate);

    // Create the region (include map position if provided)
    const regionData = {
      name: regionName.trim(),
      latitudeBand,
      climate: climateProfile,
      templateId: selectedTemplateId
    };

    // Add map position if region was created via map click
    if (mapPosition) {
      regionData.mapPosition = {
        x: mapPosition.x,
        y: mapPosition.y
      };
    }

    createRegion(regionData);

    // Reset form and close
    setRegionName('');
    setLatitudeBand('temperate');
    onHide();
  };

  const latitudeBands = getAllLatitudeBands();

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Create New Region</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Region Name */}
          <Form.Group className="mb-3">
            <Form.Label>Region Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., The Scorching Wastes, Frostpeak Mountains"
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              autoFocus
            />
          </Form.Group>

          {/* Latitude Band Selection */}
          <Form.Group className="mb-3">
            <Form.Label>Latitude Band</Form.Label>
            <Form.Select
              value={latitudeBand}
              onChange={(e) => setLatitudeBand(e.target.value)}
            >
              {latitudeBands.map(band => (
                <option key={band.key} value={band.key}>
                  {band.label} ({band.range})
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Determines sunrise/sunset times and seasonal variation
            </Form.Text>
          </Form.Group>

          {/* Template Selection */}
          <Form.Group className="mb-3">
            <Form.Label>Region Template</Form.Label>
            <Form.Select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              {availableTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Pre-configured climate settings for common biome types
            </Form.Text>
          </Form.Group>

          {/* Template Description */}
          {selectedTemplate && (
            <Alert variant="info">
              <Alert.Heading>{selectedTemplate.name}</Alert.Heading>
              <p className="mb-2">{selectedTemplate.description}</p>
              {selectedTemplate.gameplayImpact && (
                <>
                  <hr />
                  <p className="mb-0">
                    <strong>Gameplay Impact:</strong> {selectedTemplate.gameplayImpact}
                  </p>
                </>
              )}
            </Alert>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Create Region
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RegionCreator;

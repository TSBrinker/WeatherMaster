import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useWorld } from '../../contexts/WorldContext';
import {
  getAllLatitudeBands,
  getTemplatesByLatitude,
  getTemplate,
  extractClimateProfile
} from '../../data/templateHelpers';

/**
 * RegionEditor - Modal for editing existing regions
 * Allows changing name, continent, latitude band, and template
 */
const RegionEditor = ({ show, onHide, region }) => {
  const { updateRegion, worldContinents } = useWorld();

  // Form state
  const [regionName, setRegionName] = useState('');
  const [continentId, setContinentId] = useState('');
  const [latitudeBand, setLatitudeBand] = useState('temperate');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Get available templates for selected latitude
  const availableTemplates = getTemplatesByLatitude(latitudeBand);
  const selectedTemplate = selectedTemplateId
    ? getTemplate(latitudeBand, selectedTemplateId)
    : null;

  // Initialize form when region changes or modal opens
  useEffect(() => {
    if (show && region) {
      setRegionName(region.name || '');
      setContinentId(region.continentId || '');
      setLatitudeBand(region.latitudeBand || 'temperate');
      setSelectedTemplateId(region.templateId || '');
    }
  }, [show, region]);

  // When latitude changes, check if current template is still valid
  useEffect(() => {
    if (availableTemplates.length > 0) {
      const currentTemplateValid = availableTemplates.some(t => t.id === selectedTemplateId);
      if (!currentTemplateValid) {
        // Auto-select first template if current one isn't valid for new latitude
        setSelectedTemplateId(availableTemplates[0].id);
      }
    }
  }, [latitudeBand, availableTemplates, selectedTemplateId]);

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

    // Build updates object
    const updates = {
      name: regionName.trim(),
      continentId: continentId || null,
      latitudeBand,
      templateId: selectedTemplateId
    };

    // If latitude or template changed, update climate profile
    if (latitudeBand !== region.latitudeBand || selectedTemplateId !== region.templateId) {
      const template = getTemplate(latitudeBand, selectedTemplateId);
      if (template) {
        updates.climate = extractClimateProfile(template);
      }
    }

    updateRegion(region.id, updates);
    onHide();
  };

  const latitudeBands = getAllLatitudeBands();

  if (!region) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Region</Modal.Title>
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

          {/* Continent Selection */}
          {worldContinents.length > 0 && (
            <Form.Group className="mb-3">
              <Form.Label>Continent</Form.Label>
              <Form.Select
                value={continentId}
                onChange={(e) => setContinentId(e.target.value)}
              >
                <option value="">Uncategorized</option>
                {worldContinents.map(continent => (
                  <option key={continent.id} value={continent.id}>
                    {continent.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Move this location to a different continent
              </Form.Text>
            </Form.Group>
          )}

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
              Changing template will update climate settings
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
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RegionEditor;

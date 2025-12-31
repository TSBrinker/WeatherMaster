import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, ButtonGroup, ToggleButton } from 'react-bootstrap';
import { useWorld } from '../../contexts/WorldContext';
import {
  getAllLatitudeBands,
  getTemplatesByLatitude,
  getLandTemplatesByLatitude,
  getOceanTemplatesByLatitude,
  getTemplate,
  extractClimateProfile
} from '../../data/templateHelpers';

const RegionCreator = ({ show, onHide, initialLatitudeBand = null, mapPosition = null, initialContinentId = null }) => {
  const { createRegion, worldContinents } = useWorld();

  // Form state
  const [latitudeBand, setLatitudeBand] = useState(initialLatitudeBand || 'temperate');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [regionName, setRegionName] = useState('');
  const [continentId, setContinentId] = useState(initialContinentId || '');
  const [regionType, setRegionType] = useState('land'); // 'land' or 'ocean'

  // Get available templates for selected latitude, filtered by region type
  const availableTemplates = regionType === 'ocean'
    ? getOceanTemplatesByLatitude(latitudeBand)
    : getLandTemplatesByLatitude(latitudeBand);
  const selectedTemplate = selectedTemplateId
    ? getTemplate(latitudeBand, selectedTemplateId)
    : null;

  // Update latitude band when initialLatitudeBand changes (e.g., from map click)
  useEffect(() => {
    if (show && initialLatitudeBand) {
      setLatitudeBand(initialLatitudeBand);
    }
  }, [show, initialLatitudeBand]);

  // Update continent when initialContinentId changes (e.g., from map click)
  useEffect(() => {
    if (show && initialContinentId) {
      setContinentId(initialContinentId);
    }
  }, [show, initialContinentId]);

  // Auto-select first template when latitude or region type changes
  useEffect(() => {
    if (availableTemplates.length > 0) {
      setSelectedTemplateId(availableTemplates[0].id);
    } else {
      setSelectedTemplateId('');
    }
  }, [latitudeBand, regionType]);

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

    // Create the region (include map position and continent if provided)
    const regionData = {
      name: regionName.trim(),
      latitudeBand,
      climate: climateProfile,
      templateId: selectedTemplateId
    };

    // Add continent if selected
    if (continentId) {
      regionData.continentId = continentId;
    }

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
    setContinentId('');
    setRegionType('land');
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

          {/* Continent Selection (only show if continents exist) */}
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
                Group this location under a continent for organization
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

          {/* Region Type Toggle */}
          <Form.Group className="mb-3">
            <Form.Label>Region Type</Form.Label>
            <div>
              <ButtonGroup>
                <ToggleButton
                  id="region-type-land"
                  type="radio"
                  variant={regionType === 'land' ? 'primary' : 'outline-primary'}
                  name="regionType"
                  value="land"
                  checked={regionType === 'land'}
                  onChange={(e) => setRegionType(e.currentTarget.value)}
                >
                  Land
                </ToggleButton>
                <ToggleButton
                  id="region-type-ocean"
                  type="radio"
                  variant={regionType === 'ocean' ? 'info' : 'outline-info'}
                  name="regionType"
                  value="ocean"
                  checked={regionType === 'ocean'}
                  onChange={(e) => setRegionType(e.currentTarget.value)}
                >
                  Ocean
                </ToggleButton>
              </ButtonGroup>
            </div>
            <Form.Text className="text-muted">
              {regionType === 'ocean'
                ? 'Ocean regions display sea state, wave height, and sailing conditions'
                : 'Land regions display standard weather, ground conditions, and snow accumulation'}
            </Form.Text>
          </Form.Group>

          {/* Template Selection */}
          <Form.Group className="mb-3">
            <Form.Label>Region Template</Form.Label>
            {availableTemplates.length > 0 ? (
              <>
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
                  Pre-configured climate settings for common {regionType} types
                </Form.Text>
              </>
            ) : (
              <Alert variant="warning" className="mb-0">
                No {regionType} templates available for this latitude band. Try a different latitude or region type.
              </Alert>
            )}
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

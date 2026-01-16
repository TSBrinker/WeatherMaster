import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert, Dropdown } from 'react-bootstrap';
import { useWorld } from '../../contexts/WorldContext';
import {
  getAllLatitudeBands,
  getLandTemplatesByLatitude,
  getOceanTemplatesByLatitude,
  getTemplate,
  extractClimateProfile,
  extractRealWorldExamples,
  getDescriptionWithoutExamples,
  isOceanTemplate
} from '../../data/templateHelpers';

// Latitude band descriptions for user context
const latitudeBandDescriptions = {
  polar: "Extreme cold, extended darkness in winter, midnight sun in summer",
  subarctic: "Very cold winters, short cool summers, significant seasonal daylight variation",
  boreal: "Cold snowy winters, mild summers, coniferous forests",
  temperate: "Four distinct seasons, moderate temperatures, mixed forests",
  subtropical: "Mild winters, hot humid summers, longer growing season",
  tropical: "Warm year-round, minimal temperature variation, wet/dry seasons"
};

/**
 * RegionEditor - Modal for editing existing regions
 * Allows changing name, continent, and template
 * Latitude band is locked if region was placed on a map
 */
const RegionEditor = ({ show, onHide, region }) => {
  const { updateRegion, worldContinents } = useWorld();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Form state
  const [regionName, setRegionName] = useState('');
  const [continentId, setContinentId] = useState('');
  const [latitudeBand, setLatitudeBand] = useState('temperate');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Search state
  const [templateSearch, setTemplateSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Determine if this region was placed on a map (latitude is locked)
  const isLatitudeLocked = region?.mapPosition !== undefined && region?.mapPosition !== null;

  // Determine if this is an ocean region based on current template
  const isOceanRegion = region?.templateId ? isOceanTemplate({ id: region.templateId }) : false;

  // Get available templates for selected latitude
  const availableTemplates = isOceanRegion
    ? getOceanTemplatesByLatitude(latitudeBand)
    : getLandTemplatesByLatitude(latitudeBand);

  const selectedTemplate = selectedTemplateId
    ? getTemplate(latitudeBand, selectedTemplateId)
    : null;

  const latitudeBands = getAllLatitudeBands();

  // Get search results (filtered to current latitude band)
  const getSearchResults = () => {
    const searchLower = templateSearch.toLowerCase().trim();
    if (!searchLower) return [];

    return availableTemplates.filter(template => {
      const name = template.name?.toLowerCase() || '';
      const description = template.description?.toLowerCase() || '';
      const examples = extractRealWorldExamples(template)?.toLowerCase() || '';
      const searchTerms = (template.searchTerms || []).join(' ').toLowerCase();

      return name.includes(searchLower) ||
             description.includes(searchLower) ||
             examples.includes(searchLower) ||
             searchTerms.includes(searchLower);
    });
  };

  const searchResults = getSearchResults();

  // Initialize form when region changes or modal opens
  useEffect(() => {
    if (show && region) {
      setRegionName(region.name || '');
      setContinentId(region.continentId || '');
      setLatitudeBand(region.latitudeBand || 'temperate');
      setSelectedTemplateId(region.templateId || '');
      setTemplateSearch('');
      setShowSearchResults(false);
    }
  }, [show, region]);

  // When latitude changes, check if current template is still valid
  useEffect(() => {
    if (availableTemplates.length > 0 && !isLatitudeLocked) {
      const currentTemplateValid = availableTemplates.some(t => t.id === selectedTemplateId);
      if (!currentTemplateValid) {
        // Clear selection if current template isn't valid for new latitude
        setSelectedTemplateId('');
      }
    }
  }, [latitudeBand, availableTemplates, selectedTemplateId, isLatitudeLocked]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setTemplateSearch(value);
    setShowSearchResults(value.trim().length > 0);
  };

  // Handle selecting a template from search results
  const handleSearchResultSelect = (template) => {
    setSelectedTemplateId(template.id);
    setTemplateSearch('');
    setShowSearchResults(false);
  };

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

          {/* Latitude Band - locked or editable */}
          {isLatitudeLocked ? (
            /* Locked latitude band (map-placed region) */
            <Alert variant="secondary" className="mb-3">
              <strong>{latitudeBands.find(b => b.key === latitudeBand)?.label}</strong>
              <span className="text-muted ms-2">({latitudeBands.find(b => b.key === latitudeBand)?.range})</span>
              <div className="small text-muted mt-1">{latitudeBandDescriptions[latitudeBand]}</div>
              <div className="small text-muted mt-1">
                <em>Latitude is determined by map position</em>
              </div>
            </Alert>
          ) : (
            /* Editable latitude band (non-map region) */
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
                {latitudeBandDescriptions[latitudeBand]}
              </Form.Text>
            </Form.Group>
          )}

          {/* Climate Selection */}
          {!selectedTemplate ? (
            /* State A: No template selected - show search and dropdown */
            <>
              {/* Search Bar */}
              <div className="climate-search-container mb-3" ref={searchContainerRef}>
                <Form.Label>{isLatitudeLocked ? 'Select Climate' : 'Climate Template'}</Form.Label>
                <Form.Control
                  ref={searchInputRef}
                  type="text"
                  placeholder={`Search ${latitudeBands.find(b => b.key === latitudeBand)?.label.toLowerCase()} climates...`}
                  value={templateSearch}
                  onChange={handleSearchChange}
                  onFocus={() => templateSearch.trim() && setShowSearchResults(true)}
                  className="climate-search-input"
                />

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="climate-search-dropdown">
                    {searchResults.map(template => {
                      const examples = extractRealWorldExamples(template);
                      return (
                        <div
                          key={template.id}
                          className="climate-search-result"
                          onClick={() => handleSearchResultSelect(template)}
                        >
                          <div className="climate-search-result-name">{template.name}</div>
                          {examples && <div className="climate-search-result-examples">{examples}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No results message */}
                {showSearchResults && templateSearch.trim() && searchResults.length === 0 && (
                  <div className="climate-search-dropdown">
                    <div className="climate-search-no-results">
                      No climates match "{templateSearch}" in {latitudeBands.find(b => b.key === latitudeBand)?.label.toLowerCase()} band
                    </div>
                  </div>
                )}

                <Form.Text className="text-muted">
                  {templateSearch.trim()
                    ? `${searchResults.length} matching climate${searchResults.length !== 1 ? 's' : ''}`
                    : `${availableTemplates.length} climate${availableTemplates.length !== 1 ? 's' : ''} available`}
                </Form.Text>
              </div>

              {/* Template Dropdown */}
              <Form.Group className="mb-3">
                {availableTemplates.length > 0 ? (
                  <Dropdown className="climate-template-dropdown">
                    <Dropdown.Toggle variant="outline-secondary" className="climate-template-toggle">
                      <span className="climate-template-placeholder">Select a climate...</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="climate-template-menu">
                      {availableTemplates.map(template => {
                        const examples = extractRealWorldExamples(template);
                        return (
                          <Dropdown.Item
                            key={template.id}
                            onClick={() => setSelectedTemplateId(template.id)}
                            className="climate-template-item"
                          >
                            <div className="climate-template-item-name">{template.name}</div>
                            {examples && <div className="climate-template-item-examples">{examples}</div>}
                          </Dropdown.Item>
                        );
                      })}
                    </Dropdown.Menu>
                  </Dropdown>
                ) : (
                  <Alert variant="warning" className="mb-0">
                    No templates available for this latitude band.
                  </Alert>
                )}
              </Form.Group>
            </>
          ) : (
            /* State B: Template selected - show details with change button */
            <>
              <div className="climate-selected-header mb-2">
                <Form.Label className="mb-0">Climate</Form.Label>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setSelectedTemplateId('')}
                  className="ms-2"
                >
                  Change
                </Button>
              </div>
              <Alert variant="info" className="climate-template-info">
                <Alert.Heading>{selectedTemplate.name}</Alert.Heading>
                {extractRealWorldExamples(selectedTemplate) && (
                  <div className="climate-template-examples">
                    {extractRealWorldExamples(selectedTemplate)}
                  </div>
                )}
                <p className="mb-2">{getDescriptionWithoutExamples(selectedTemplate)}</p>
                {selectedTemplate.gameplayImpact && (
                  <>
                    <hr />
                    <p className="mb-0">
                      <strong>Gameplay Impact:</strong> {selectedTemplate.gameplayImpact}
                    </p>
                  </>
                )}
              </Alert>
            </>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!selectedTemplateId}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RegionEditor;

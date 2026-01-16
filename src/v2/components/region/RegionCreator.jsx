import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, ButtonGroup, ToggleButton, Alert, Dropdown } from 'react-bootstrap';
import { useWorld } from '../../contexts/WorldContext';
import {
  getAllLatitudeBands,
  getLandTemplatesByLatitude,
  getOceanTemplatesByLatitude,
  getTemplate,
  extractClimateProfile,
  extractRealWorldExamples,
  getDescriptionWithoutExamples,
  getAllTemplates,
  isOceanTemplate
} from '../../data/templateHelpers';
import './RegionCreator.css';

// Latitude band descriptions for user context
const latitudeBandDescriptions = {
  polar: "Extreme cold, extended darkness in winter, midnight sun in summer",
  subarctic: "Very cold winters, short cool summers, significant seasonal daylight variation",
  boreal: "Cold snowy winters, mild summers, coniferous forests",
  temperate: "Four distinct seasons, moderate temperatures, mixed forests",
  subtropical: "Mild winters, hot humid summers, longer growing season",
  tropical: "Warm year-round, minimal temperature variation, wet/dry seasons"
};

const RegionCreator = ({ show, onHide, initialLatitudeBand = null, mapPosition = null, initialContinentId = null }) => {
  const { createRegion, worldContinents } = useWorld();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Wizard step state (1 = details, 2 = climate)
  const [step, setStep] = useState(1);

  // Form state
  const [regionName, setRegionName] = useState('');
  const [continentId, setContinentId] = useState(initialContinentId || '');
  const [regionType, setRegionType] = useState('land');
  const [latitudeBand, setLatitudeBand] = useState(initialLatitudeBand || 'temperate');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // When placed via map, latitude band is locked to the clicked position
  const isLatitudeLocked = mapPosition !== null && initialLatitudeBand !== null;

  // Search state
  const [templateSearch, setTemplateSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const latitudeBands = getAllLatitudeBands();

  // Get templates for the selected latitude band
  const availableTemplates = regionType === 'ocean'
    ? getOceanTemplatesByLatitude(latitudeBand)
    : getLandTemplatesByLatitude(latitudeBand);

  // Get search results (filtered by search, region type, and optionally locked latitude band)
  const getSearchResults = () => {
    const searchLower = templateSearch.toLowerCase().trim();
    if (!searchLower) return [];

    // When latitude is locked (map-placed pin), only search within that band's templates
    const templatesToSearch = isLatitudeLocked
      ? availableTemplates
      : getAllTemplates();

    const seenIds = new Set();

    return templatesToSearch.filter(template => {
      // Deduplicate by template id (same template can appear in multiple bands)
      if (seenIds.has(template.id)) return false;
      seenIds.add(template.id);

      // Filter by region type (only needed when searching all templates)
      if (!isLatitudeLocked) {
        const isOcean = isOceanTemplate(template);
        if (regionType === 'ocean' && !isOcean) return false;
        if (regionType === 'land' && isOcean) return false;
      }

      // Search in name, description, real-world examples, and search terms
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

  // Get the currently selected template
  const selectedTemplate = selectedTemplateId
    ? getTemplate(latitudeBand, selectedTemplateId)
    : null;

  // Update latitude band when initialLatitudeBand changes
  useEffect(() => {
    if (show && initialLatitudeBand) {
      setLatitudeBand(initialLatitudeBand);
    }
  }, [show, initialLatitudeBand]);

  // Update continent when initialContinentId changes
  useEffect(() => {
    if (show && initialContinentId) {
      setContinentId(initialContinentId);
    }
  }, [show, initialContinentId]);

  // Reset to step 1 when modal opens
  useEffect(() => {
    if (show) {
      setStep(1);
    }
  }, [show]);

  // Focus search input when entering step 2
  useEffect(() => {
    if (step === 2 && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Clear template selection when latitude or region type changes (no auto-select)
  useEffect(() => {
    setSelectedTemplateId('');
  }, [latitudeBand, regionType]);

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
    // Update latitude band to match the template (only if not locked by map position)
    if (!isLatitudeLocked && template.latitudeBand && template.latitudeBand !== 'special') {
      setLatitudeBand(template.latitudeBand);
    }
    setSelectedTemplateId(template.id);
    setTemplateSearch('');
    setShowSearchResults(false);
  };

  // Handle latitude band change
  const handleLatitudeBandChange = (newBand) => {
    setLatitudeBand(newBand);
  };

  // Handle Next button - validate and proceed to step 2
  const handleNext = () => {
    if (!regionName.trim()) {
      alert('Please enter a region name');
      return;
    }
    setStep(2);
  };

  // Handle Back button - return to step 1 (preserve selections)
  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!regionName.trim()) {
      alert('Please enter a region name');
      return;
    }

    if (!selectedTemplateId) {
      alert('Please select a climate template');
      return;
    }

    // Extract climate data from template
    const climateProfile = extractClimateProfile(selectedTemplate);

    // Create the region
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
    // Include observerRadius for precise sunrise/sunset calculations
    if (mapPosition) {
      regionData.mapPosition = {
        x: mapPosition.x,
        y: mapPosition.y,
        observerRadius: mapPosition.observerRadius
      };
    }

    createRegion(regionData);

    // Reset form and close
    setRegionName('');
    setContinentId('');
    setRegionType('land');
    setLatitudeBand('temperate');
    setSelectedTemplateId('');
    setTemplateSearch('');
    setShowSearchResults(false);
    setStep(1);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {step === 1 ? 'Create New Region' : 'Select Climate'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {step === 1 ? (
            /* ===== PAGE 1: Region Details ===== */
            <>
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
              </Form.Group>

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
                </Form.Group>
              )}
            </>
          ) : (
            /* ===== PAGE 2: Climate Selection ===== */
            <div className="climate-section">
              {!selectedTemplate ? (
                /* State A: Selecting a climate */
                <>
                  {/* Show locked latitude band info when placed via map */}
                  {isLatitudeLocked && (
                    <Alert variant="secondary" className="mb-3">
                      <strong>{latitudeBands.find(b => b.key === latitudeBand)?.label}</strong>
                      <span className="text-muted ms-2">({latitudeBands.find(b => b.key === latitudeBand)?.range})</span>
                      <div className="small text-muted mt-1">{latitudeBandDescriptions[latitudeBand]}</div>
                    </Alert>
                  )}

                  {/* Search Bar with Autocomplete Dropdown */}
                  <div className="climate-search-container" ref={searchContainerRef}>
                    <Form.Control
                      ref={searchInputRef}
                      type="text"
                      placeholder={isLatitudeLocked
                        ? `Search ${latitudeBands.find(b => b.key === latitudeBand)?.label.toLowerCase()} climates...`
                        : "Search climates (e.g., Minnesota, Island, Desert, Seattle...)"}
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
                          const bandLabel = latitudeBands.find(b => b.key === template.latitudeBand)?.label;
                          return (
                            <div
                              key={`${template.latitudeBand}-${template.id}`}
                              className="climate-search-result"
                              onClick={() => handleSearchResultSelect(template)}
                            >
                              <div className="climate-search-result-name">
                                {template.name}
                                {/* Only show band tag when not locked (searching all bands) */}
                                {!isLatitudeLocked && bandLabel && <span className="climate-band-tag">{bandLabel}</span>}
                              </div>
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
                          No {regionType} climates match "{templateSearch}"
                          {isLatitudeLocked && ` in ${latitudeBands.find(b => b.key === latitudeBand)?.label.toLowerCase()} band`}
                        </div>
                      </div>
                    )}

                    <Form.Text className="text-muted">
                      {templateSearch.trim()
                        ? `${searchResults.length} matching climate${searchResults.length !== 1 ? 's' : ''}`
                        : isLatitudeLocked
                          ? `${availableTemplates.length} ${regionType} climate${availableTemplates.length !== 1 ? 's' : ''} available`
                          : 'Search by climate name, description, or real-world location'}
                    </Form.Text>
                  </div>

                  {/* OR Divider - only show when latitude is NOT locked */}
                  {!isLatitudeLocked && (
                    <div className="climate-or-divider">
                      <span>or browse by latitude</span>
                    </div>
                  )}

                  {/* Latitude Band Dropdown - only show when NOT locked */}
                  {!isLatitudeLocked && (
                    <Form.Group className="mb-3">
                      <Form.Label>Latitude Band</Form.Label>
                      <Form.Select
                        value={latitudeBand}
                        onChange={(e) => handleLatitudeBandChange(e.target.value)}
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

                  {/* Template Dropdown */}
                  <Form.Group className="mb-3">
                    <Form.Label>{isLatitudeLocked ? 'Select Climate' : 'Climate Template'}</Form.Label>
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
                        No {regionType} templates available for this latitude band.
                      </Alert>
                    )}
                  </Form.Group>
                </>
              ) : (
                /* State B: Climate selected - show details with clear button */
                <>
                  <div className="climate-selected-header">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setSelectedTemplateId('')}
                      className="clear-selection-btn"
                    >
                      Clear Selection
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
            </div>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        {step === 1 ? (
          /* Page 1 Footer */
          <>
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleNext}>
              Next
            </Button>
          </>
        ) : (
          /* Page 2 Footer */
          <>
            <Button variant="outline-secondary" onClick={handleBack}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!selectedTemplateId}
            >
              Create Region
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default RegionCreator;

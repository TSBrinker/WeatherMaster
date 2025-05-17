// src/components/region/RegionTemplateSelector.jsx
import React, { useState, useEffect } from "react";
import {
  latitudeBands,
  getTemplatesForLatitudeBand,
} from "../../data-tables/region-templates";

/**
 * Component for selecting a region template
 * @param {Object} props
 * @param {Function} props.onTemplateSelected - Callback when a template is selected
 * @param {string} props.initialLatitudeBand - Initial latitude band selection (optional)
 * @param {string} props.initialTemplateId - Initial template ID selection (optional)
 */
const RegionTemplateSelector = ({
  onTemplateSelected,
  initialLatitudeBand = "temperate",
  initialTemplateId = null,
}) => {
  const [selectedBand, setSelectedBand] = useState(initialLatitudeBand);
  const [selectedTemplateId, setSelectedTemplateId] =
    useState(initialTemplateId);
  const [templates, setTemplates] = useState({});

  // Load templates when the latitude band changes
  useEffect(() => {
    const templatesForBand = getTemplatesForLatitudeBand(selectedBand);
    setTemplates(templatesForBand);

    // Reset template selection if the current one isn't available
    if (selectedTemplateId && !templatesForBand[selectedTemplateId]) {
      setSelectedTemplateId(null);
    }
  }, [selectedBand]);

  // Notify parent when a template is selected
  useEffect(() => {
    if (selectedTemplateId && templates[selectedTemplateId]) {
      onTemplateSelected(
        selectedBand,
        selectedTemplateId,
        templates[selectedTemplateId]
      );
    }
  }, [selectedTemplateId, templates, onTemplateSelected]);

  // Handle latitude band change
  const handleBandChange = (e) => {
    setSelectedBand(e.target.value);
  };

  // Handle template selection
  const handleTemplateChange = (e) => {
    setSelectedTemplateId(e.target.value);
  };

  return (
    <div className="region-template-selector">
      <div className="form-group">
        <label htmlFor="latitude-band">Climate Zone:</label>
        <select
          id="latitude-band"
          value={selectedBand}
          onChange={handleBandChange}
          className="form-control"
        >
          {Object.entries(latitudeBands).map(([key, { label, range }]) => (
            <option key={key} value={key}>
              {label} ({range})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="region-template">Region Template:</label>
        <select
          id="region-template"
          value={selectedTemplateId || ""}
          onChange={handleTemplateChange}
          className="form-control"
          disabled={Object.keys(templates).length === 0}
        >
          <option value="">-- Select a template --</option>
          {Object.entries(templates).map(([id, template]) => (
            <option key={id} value={id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTemplateId && templates[selectedTemplateId] && (
        <div className="template-details">
          <h4>{templates[selectedTemplateId].name}</h4>
          <p className="description">
            {templates[selectedTemplateId].description}
          </p>
          <div className="gameplay-impact">
            <h5>Gameplay Impact:</h5>
            <p>{templates[selectedTemplateId].gameplayImpact}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionTemplateSelector;

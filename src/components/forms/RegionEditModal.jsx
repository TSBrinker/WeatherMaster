// src/components/forms/RegionEditModal.jsx - Clean version without dice table references
import React, { useState, useEffect } from "react";
import { useRegion } from "../../contexts/RegionContext";
import { getTemplatesForLatitudeBand } from "../../data-tables/region-templates";
import weatherManager from "../../services/weatherManager";

const RegionEditModal = ({ region, onClose }) => {
  const { updateRegion } = useRegion();

  // Initialize form data from region
  const [formData, setFormData] = useState({
    name: region.name || "",
    climate:
      region.climate ||
      (region.profile && region.profile.climate) ||
      (region.profile && region.profile.biome) ||
      "temperate-deciduous",
    latitudeBand:
      region.latitudeBand ||
      (region.profile && region.profile.latitudeBand) ||
      "temperate",
    templateId:
      region.templateId ||
      (region.templateInfo && region.templateInfo.templateId) ||
      null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Update available templates when latitude band changes
  useEffect(() => {
    if (formData.latitudeBand) {
      const templates = getTemplatesForLatitudeBand(formData.latitudeBand);
      setAvailableTemplates(templates);
      
      // If current template is not available in new latitude band, clear it
      if (formData.templateId && !templates[formData.templateId]) {
        setFormData(prev => ({ ...prev, templateId: null }));
        setSelectedTemplate(null);
      }
    }
  }, [formData.latitudeBand, formData.templateId]);

  // Update selected template when templateId changes
  useEffect(() => {
    if (formData.templateId && availableTemplates[formData.templateId]) {
      setSelectedTemplate(availableTemplates[formData.templateId]);
    } else {
      setSelectedTemplate(null);
    }
  }, [formData.templateId, availableTemplates]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value || null;
    setFormData(prev => ({
      ...prev,
      templateId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create updated region data
      const updatedRegion = {
        ...region,
        name: formData.name.trim(),
        climate: formData.climate,
        latitudeBand: formData.latitudeBand,
        templateId: formData.templateId,
      };

      // If a template is selected, merge its properties
      if (selectedTemplate) {
        updatedRegion.templateInfo = {
          templateId: formData.templateId,
          name: selectedTemplate.name,
          description: selectedTemplate.description,
        };
        
        // Merge template properties into region profile
        if (selectedTemplate.generateProfile) {
          const templateProfile = selectedTemplate.generateProfile();
          updatedRegion.profile = {
            ...region.profile,
            ...templateProfile,
            // Preserve essential properties
            biome: formData.climate,
            latitudeBand: formData.latitudeBand,
          };
        }
      }

      // Update the region
      await updateRegion(updatedRegion);

      // Clear any existing weather data to force regeneration with new settings
      weatherManager.clearRegionWeather(region.id);

      onClose();
    } catch (error) {
      console.error("Error updating region:", error);
      alert("Failed to update region. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const climatePairings = {
    "tropical-rainforest": ["tropical", "equatorial"],
    "tropical-seasonal": ["tropical", "subtropical"],
    "temperate-deciduous": ["temperate", "subtropical"],
    "temperate-rainforest": ["temperate", "coastal"],
    "temperate-grassland": ["temperate", "continental"],
    "boreal-forest": ["subarctic", "continental"],
    "desert": ["tropical", "subtropical", "temperate", "continental"],
    "tundra": ["arctic", "subarctic"],
  };

  const getRecommendedLatitudeBands = (climate) => {
    return climatePairings[climate] || ["temperate"];
  };

  const isLatitudeBandRecommended = (climate, latitudeBand) => {
    return getRecommendedLatitudeBands(climate).includes(latitudeBand);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}>
      <div className="modal-content region-edit-modal">
        <div className="modal-header">
          <h2>Edit Region</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="region-edit-form">
          {/* Region Name */}
          <div className="form-group">
            <label htmlFor="name">Region Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter region name"
            />
          </div>

          {/* Climate Selection */}
          <div className="form-group">
            <label htmlFor="climate">Climate Type</label>
            <select
              id="climate"
              name="climate"
              value={formData.climate}
              onChange={handleInputChange}
              required
            >
              <option value="temperate-deciduous">Temperate Deciduous</option>
              <option value="temperate-rainforest">Temperate Rainforest</option>
              <option value="temperate-grassland">Temperate Grassland</option>
              <option value="tropical-rainforest">Tropical Rainforest</option>
              <option value="tropical-seasonal">Tropical Seasonal</option>
              <option value="boreal-forest">Boreal Forest</option>
              <option value="desert">Desert</option>
              <option value="tundra">Tundra</option>
            </select>
          </div>

          {/* Latitude Band Selection */}
          <div className="form-group">
            <label htmlFor="latitudeBand">Latitude Band</label>
            <select
              id="latitudeBand"
              name="latitudeBand"
              value={formData.latitudeBand}
              onChange={handleInputChange}
              required
            >
              <option value="tropical">Tropical (0° - 23.5°)</option>
              <option value="subtropical">Subtropical (23.5° - 35°)</option>
              <option value="temperate">Temperate (35° - 50°)</option>
              <option value="continental">Continental (40° - 60°)</option>
              <option value="subarctic">Subarctic (50° - 66.5°)</option>
              <option value="arctic">Arctic (66.5° - 90°)</option>
              <option value="equatorial">Equatorial (0° - 10°)</option>
              <option value="coastal">Coastal (variable)</option>
            </select>
            
            {!isLatitudeBandRecommended(formData.climate, formData.latitudeBand) && (
              <div className="form-warning">
                ⚠️ This latitude band is not typically associated with {formData.climate} climate. 
                Recommended: {getRecommendedLatitudeBands(formData.climate).join(", ")}
              </div>
            )}
          </div>

          {/* Template Selection */}
          {Object.keys(availableTemplates).length > 0 && (
            <div className="form-group">
              <label htmlFor="templateId">Region Template (Optional)</label>
              <select
                id="templateId"
                name="templateId"
                value={formData.templateId || ""}
                onChange={handleTemplateChange}
              >
                <option value="">No Template</option>
                {Object.entries(availableTemplates).map(([id, template]) => (
                  <option key={id} value={id}>
                    {template.name}
                  </option>
                ))}
              </select>
              
              {selectedTemplate && (
                <div className="template-description">
                  <p><strong>Description:</strong> {selectedTemplate.description}</p>
                  {selectedTemplate.gameplayImpact && (
                    <p><strong>Gameplay Impact:</strong> {selectedTemplate.gameplayImpact}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegionEditModal;
// src/components/forms/RegionEditModal.jsx
import React, { useState, useEffect } from "react";
import { useRegion } from "../../contexts/RegionContext";
import { usePreferences } from "../../contexts/PreferencesContext";
import { getTemplatesForLatitudeBand } from "../../data-tables/region-templates";

const RegionEditModal = ({ region, onClose }) => {
  const { updateRegion } = useRegion();
  const { state: preferences } = usePreferences();

  const [formData, setFormData] = useState({
    name: region.name,
    climate: region.climate || "temperate-deciduous",
    latitudeBand: region.latitudeBand || "temperate",
    templateId:
      region.templateId ||
      (region.templateInfo ? region.templateInfo.templateId : null),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Update available templates when latitude band changes
  useEffect(() => {
    if (formData.latitudeBand) {
      const templates = getTemplatesForLatitudeBand(formData.latitudeBand);
      setAvailableTemplates(templates);

      // Clear selected template if it's not available in new latitude band
      if (formData.templateId && !templates[formData.templateId]) {
        setFormData((prev) => ({ ...prev, templateId: null }));
        setSelectedTemplate(null);
      }
    }
  }, [formData.latitudeBand]);

  // Update selected template when templateId changes
  useEffect(() => {
    if (formData.templateId && availableTemplates[formData.templateId]) {
      setSelectedTemplate(availableTemplates[formData.templateId]);

      // Update climate to match template's default biome
      if (availableTemplates[formData.templateId].defaultBiome) {
        setFormData((prev) => ({
          ...prev,
          climate: availableTemplates[formData.templateId].defaultBiome,
        }));
      }
    } else {
      setSelectedTemplate(null);
    }
  }, [formData.templateId, availableTemplates]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setFormData((prev) => ({ ...prev, templateId }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update region based on template or basic parameters
      if (formData.templateId) {
        updateRegion(region.id, {
          name: formData.name,
          latitudeBand: formData.latitudeBand,
          templateId: formData.templateId,
          // Still pass climate in case it's needed for fallback
          climate: formData.climate,
        });
      } else {
        updateRegion(region.id, {
          name: formData.name,
          climate: formData.climate,
          latitudeBand: formData.latitudeBand,
          templateId: null, // Explicitly clear template ID if none selected
        });
      }
      onClose();
    } catch (error) {
      console.error("Error updating region:", error);
      setIsSubmitting(false);
    }
  };

  // Handle click outside to close
  const handleModalClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleModalClick}>
      <div className="modal-content">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Edit Region</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2">
              Region Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 rounded bg-surface-light text-white border border-border"
              required
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label htmlFor="latitudeBand" className="block mb-2">
              Climate Zone
            </label>
            <select
              id="latitudeBand"
              name="latitudeBand"
              value={formData.latitudeBand}
              onChange={handleChange}
              className="w-full p-2 rounded bg-surface-light text-white border border-border"
              required
            >
              <option value="equatorial">Equatorial (0° - 10°)</option>
              <option value="tropical">Tropical (10° - 30°)</option>
              <option value="temperate">Temperate (30° - 60°)</option>
              <option value="subarctic">Subarctic (60° - 75°)</option>
              <option value="polar">Polar (75° - 90°)</option>
            </select>
            <div className="text-sm text-gray-400 mt-1">
              Affects day/night cycle, seasonal daylight hours, and available
              templates
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="templateId" className="block mb-2">
              Region Template
            </label>
            <select
              id="templateId"
              name="templateId"
              value={formData.templateId || ""}
              onChange={handleTemplateChange}
              className="w-full p-2 rounded bg-surface-light text-white border border-border"
              disabled={Object.keys(availableTemplates).length === 0}
            >
              <option value="">-- Select a template --</option>
              {Object.entries(availableTemplates).map(([id, template]) => (
                <option key={id} value={id}>
                  {template.name}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-400 mt-1">
              Templates provide pre-configured climate settings with rich
              descriptions and gameplay impacts
            </div>
          </div>

          {/* Template details */}
          {selectedTemplate && (
            <div className="mb-4 p-3 bg-surface-dark rounded border border-border">
              <h3 className="font-semibold mb-1">{selectedTemplate.name}</h3>
              <p className="text-sm mb-2">{selectedTemplate.description}</p>
              {selectedTemplate.gameplayImpact && (
                <div className="mt-3">
                  <div className="text-sm font-semibold text-accent mb-1">
                    Gameplay Impact:
                  </div>
                  <p className="text-xs text-gray-300">
                    {selectedTemplate.gameplayImpact}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* <div className="mb-4">
            <label htmlFor="climate" className="block mb-2">
              Biome Type
            </label>
            <select
              id="climate"
              name="climate"
              value={formData.climate}
              onChange={handleChange}
              className="w-full p-2 rounded bg-surface-light text-white border border-border"
              required
            >
              <option value="tropical-rainforest">Tropical Rainforest</option>
              <option value="tropical-seasonal">Tropical Seasonal</option>
              <option value="desert">Desert</option>
              <option value="temperate-grassland">Temperate Grassland</option>
              <option value="temperate-deciduous">
                Temperate Deciduous Forest
              </option>
              <option value="temperate-rainforest">
                Temperate Rainforest
              </option>
              <option value="boreal-forest">Boreal Forest</option>
              <option value="tundra">Tundra</option>
            </select>
            <div className="text-sm text-gray-400 mt-1">
              Determines weather patterns and temperature ranges
            </div>
          </div> */}

          {/* Weather system info (now just showing the global setting) */}
          {/* <div className="mb-4 p-3 bg-surface-light rounded">
            <h3 className="font-semibold mb-1">Weather Generation System</h3>
            <div className="text-sm text-gray-300">
              Using{" "}
              {preferences.weatherSystem === "meteorological"
                ? "Advanced (Meteorological)"
                : "Basic (Dice Tables)"}{" "}
              system for all regions
            </div>
            <div className="text-xs text-gray-400 mt-1">
              This setting can be changed in App Preferences
            </div>
          </div> */}

          <div className="flex justify-end gap-3 pt-3 border-t border-border mt-6">
            <button type="button" onClick={onClose} className="btn">
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

// src/components/forms/RegionFormModal.jsx - Fixed
import React, { useState, useEffect } from "react";
import { useRegion } from "../../contexts/RegionContext";
import { usePreferences } from "../../contexts/PreferencesContext";
import { getTemplatesForLatitudeBand } from "../../data-tables/region-templates";
import weatherManager from "../../services/weatherManager";

const RegionFormModal = ({ onClose }) => {
  const { createRegion } = useRegion();
  const { state: preferences } = usePreferences();

  const [formData, setFormData] = useState({
    name: "",
    climate: "temperate-deciduous",
    latitudeBand: "temperate",
    templateId: null,
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
    console.log("[RegionFormModal] Form submitted with data:", formData);
    setIsSubmitting(true);

    try {
      // Get weather system preference
      const weatherType = preferences.weatherSystem || "diceTable";
      console.log(`[RegionFormModal] Using weather system: ${weatherType}`);

      // Create region with weather type - explicit logging
      console.log("[RegionFormModal] Calling createRegion with:", {
        name: formData.name,
        climate: formData.climate,
        latitudeBand: formData.latitudeBand,
        templateId: formData.templateId,
        weatherType,
      });

      const newRegion = createRegion({
        name: formData.name,
        climate: formData.climate,
        latitudeBand: formData.latitudeBand,
        templateId: formData.templateId,
        weatherType: weatherType,
      });

      console.log("[RegionFormModal] New region created:", {
        id: newRegion?.id,
        name: newRegion?.name,
        latitudeBand: newRegion?.latitudeBand,
        profile: {
          latitudeBand: newRegion?.profile?.latitudeBand,
          biome: newRegion?.profile?.biome,
          climate: newRegion?.profile?.climate,
        },
      });

      // Close modal immediately
      onClose();

      // Initialize weather after a delay
      if (newRegion && newRegion.id) {
        setTimeout(() => {
          try {
            console.log(
              `[RegionFormModal] Initializing weather for region ${newRegion.id}`
            );

            // Determine climate and latitude band from the new region for weather init
            const regionClimate =
              newRegion.climate ||
              (newRegion.profile && newRegion.profile.climate) ||
              newRegion.profile?.biome ||
              "temperate-deciduous";

            // Initialize weather with explicit type
            weatherManager.initializeWeather(
              newRegion.id,
              regionClimate,
              "auto",
              new Date(),
              weatherType
            );
          } catch (error) {
            console.error(
              "[RegionFormModal] Error initializing weather:",
              error
            );
          }
        }, 200); // Slightly longer delay to ensure region is saved
      }
    } catch (error) {
      console.error("[RegionFormModal] Error creating region:", error);
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
          <h2 className="text-xl font-semibold">Create New Region</h2>
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
              placeholder="e.g., The Misty Mountains"
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

          {/* Debug info about selected latitude band */}
          <div className="mb-4 p-2 bg-gray-800 rounded text-xs border border-gray-700">
            <div>
              <strong>Selected latitude band:</strong> {formData.latitudeBand}
            </div>
            <div>
              <strong>Default latitude:</strong>{" "}
              {formData.latitudeBand === "polar"
                ? "80°"
                : formData.latitudeBand === "subarctic"
                ? "65°"
                : formData.latitudeBand === "temperate"
                ? "45°"
                : formData.latitudeBand === "tropical"
                ? "20°"
                : "5°"}
            </div>
            {formData.latitudeBand === "polar" && (
              <div className="mt-1 text-green-400">
                Polar latitude should produce 24hr daylight near summer solstice
              </div>
            )}
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

          <div className="flex justify-end gap-3 pt-3 border-t border-border mt-6">
            <button type="button" onClick={onClose} className="btn">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Region"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegionFormModal;

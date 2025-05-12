// src/components/forms/RegionFormModal.jsx
import React, { useState, useEffect } from "react";
import { useRegion } from "../../contexts/RegionContext";
import RegionTemplateSelector from "../region/RegionTemplateSelector";
import AdvancedRegionParameters from "../region/AdvancedRegionParameters";
import {
  getTemplateById,
  getParametersForTemplate,
} from "../../data-tables/regionTemplates";

/**
 * Modal for creating new regions with template selection and advanced parameters
 */
const RegionFormModal = ({ onClose }) => {
  const { createRegion } = useRegion();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    climate: "temperate-deciduous",
    latitudeBand: "temperate",
    weatherType: "diceTable", // Default to dice table if not set
    parameters: null, // For meteorological system
    templateId: null, // Selected template ID
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic info, 2: Template selection, 3: Advanced params

  // When a template is selected, update the form data with template values
  useEffect(() => {
    if (formData.templateId) {
      const template = getTemplateById(formData.templateId);
      if (template) {
        setFormData((prev) => ({
          ...prev,
          climate: template.biomeMapping || template.id,
          parameters: template.parameters,
        }));
      }
    }
  }, [formData.templateId]);

  // Handle basic field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle weather system type change
  const handleWeatherTypeChange = (e) => {
    const newType = e.target.value;
    setFormData((prev) => ({
      ...prev,
      weatherType: newType,
      // For meteorological system, we need parameters
      parameters:
        newType === "meteorological"
          ? prev.parameters || getDefaultParameters()
          : null,
    }));
  };

  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    setFormData((prev) => ({
      ...prev,
      templateId,
      parameters: getParametersForTemplate(templateId),
    }));
  };

  // Handle parameters change
  const handleParametersChange = (newParameters) => {
    setFormData((prev) => ({
      ...prev,
      parameters: newParameters,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create region with all the data
      createRegion(formData);
      onClose();
    } catch (error) {
      console.error("Error creating region:", error);
      setIsSubmitting(false);
    }
  };

  // Get default parameters for a new region
  const getDefaultParameters = () => {
    return {
      latitude: 45,
      elevation: 1000,
      maritimeInfluence: 0.5,
      terrainRoughness: 0.5,
      specialFactors: {},
    };
  };

  // Handle click outside to close
  const handleModalClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      onClose();
    }
  };

  // Move to next step
  const nextStep = () => {
    if (step === 1 && formData.weatherType === "diceTable") {
      // Skip template selection for dice table system
      handleSubmit({ preventDefault: () => {} });
    } else {
      setStep(step + 1);
    }
  };

  // Move to previous step
  const prevStep = () => {
    setStep(step - 1);
  };

  // Render form based on current step
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
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
              <label htmlFor="weatherType" className="block mb-2">
                Weather System
              </label>
              <select
                id="weatherType"
                name="weatherType"
                value={formData.weatherType}
                onChange={handleWeatherTypeChange}
                className="w-full p-2 rounded bg-surface-light text-white border border-border"
              >
                <option value="diceTable">Basic (Dice Tables)</option>
                <option value="meteorological">
                  Advanced (Meteorological)
                </option>
              </select>
              <div className="text-sm text-gray-400 mt-1">
                {formData.weatherType === "diceTable"
                  ? "Simple dice-based generation with minimal setup"
                  : "Realistic physics-based weather with detailed parameters"}
              </div>
            </div>

            {formData.weatherType === "diceTable" && (
              <>
                <div className="mb-4">
                  <label htmlFor="climate" className="block mb-2">
                    Climate Type
                  </label>
                  <select
                    id="climate"
                    name="climate"
                    value={formData.climate}
                    onChange={handleChange}
                    className="w-full p-2 rounded bg-surface-light text-white border border-border"
                    required
                  >
                    <option value="tropical-rainforest">
                      Tropical Rainforest
                    </option>
                    <option value="tropical-seasonal">Tropical Seasonal</option>
                    <option value="desert">Desert</option>
                    <option value="temperate-grassland">
                      Temperate Grassland
                    </option>
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
                </div>

                <div className="mb-4">
                  <label htmlFor="latitudeBand" className="block mb-2">
                    Latitude Band
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
                    Affects day/night cycle and seasonal daylight hours
                  </div>
                </div>
              </>
            )}

            {/* Description of next steps for meteorological system */}
            {formData.weatherType === "meteorological" && (
              <div className="mt-6 p-4 bg-surface-light rounded">
                <h3 className="font-semibold mb-2">Advanced Weather System</h3>
                <p className="text-sm mb-2">
                  You've selected the advanced meteorological weather system. In
                  the next steps, you'll:
                </p>
                <ol className="text-sm list-decimal pl-5 space-y-1">
                  <li>Choose from pre-configured region templates</li>
                  <li>Optionally fine-tune detailed weather parameters</li>
                </ol>
              </div>
            )}
          </>
        );

      case 2:
        return (
          <RegionTemplateSelector
            selectedTemplate={formData.templateId}
            onSelectTemplate={handleTemplateSelect}
          />
        );

      case 3:
        return (
          <>
            <h3 className="text-xl font-semibold mb-4">Advanced Parameters</h3>
            <p className="text-sm text-gray-400 mb-4">
              Fine-tune your region's meteorological parameters or use the
              defaults from your selected template.
            </p>
            <AdvancedRegionParameters
              parameters={formData.parameters || getDefaultParameters()}
              onChange={handleParametersChange}
              isExpanded={true}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={handleModalClick}>
      <div className="modal-content max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Create New Region</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Step indicator */}
          {formData.weatherType === "meteorological" && (
            <div className="flex mb-6 border-b border-gray-700 pb-4">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`flex-1 text-center relative ${
                    stepNum < step
                      ? "text-primary"
                      : stepNum === step
                      ? "text-white"
                      : "text-gray-500"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                      stepNum < step
                        ? "bg-primary text-white"
                        : stepNum === step
                        ? "border-2 border-primary"
                        : "border border-gray-600"
                    }`}
                  >
                    {stepNum}
                  </div>
                  <div className="text-xs">
                    {stepNum === 1
                      ? "Basic Info"
                      : stepNum === 2
                      ? "Template"
                      : "Parameters"}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`absolute top-4 w-full h-0.5 ${
                        stepNum < step ? "bg-primary" : "bg-gray-600"
                      }`}
                      style={{ left: "50%" }}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step content */}
          {renderStepContent()}

          {/* Navigation buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border mt-6">
            {step > 1 && (
              <button type="button" onClick={prevStep} className="btn">
                Back
              </button>
            )}

            {step < 3 && formData.weatherType === "meteorological" ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary"
                disabled={isSubmitting || (step === 2 && !formData.templateId)}
              >
                {step === 2 ? "Continue" : "Next"}
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  isSubmitting ||
                  (formData.weatherType === "meteorological" &&
                    !formData.parameters)
                }
              >
                {isSubmitting ? "Creating..." : "Create Region"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegionFormModal;

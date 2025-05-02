// components/world/EnhancedRegionCreationForm.jsx
import React, { useState } from "react";
import useWorld from "../../hooks/useWorld";
import { getLatitudeBandFromClimate } from "../../utils/celestialUtils";

const EnhancedRegionCreationForm = ({ worldId, onCancel, onSuccess }) => {
  const { createRegion, isLoading } = useWorld();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    climate: "temperate-deciduous",
    latitudeBand: "temperate", // New field for latitude band
    description: "",
  });

  // Form validation state
  const [errors, setErrors] = useState({});

  // Handler for form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for climate selection to auto-set latitudeBand
    if (name === "climate") {
      const suggestedLatitudeBand = getLatitudeBandFromClimate(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        latitudeBand: suggestedLatitudeBand,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Region name is required";
    }

    // Climate validation
    if (!formData.climate) {
      newErrors.climate = "Climate is required";
    }

    // Latitude band validation
    if (!formData.latitudeBand) {
      newErrors.latitudeBand = "Latitude band is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Create the region
    const newRegion = await createRegion(worldId, formData);

    if (newRegion) {
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(newRegion);
      }
    }
  };

  // Climate options with display names
  const climateOptions = [
    { value: "temperate-deciduous", label: "Temperate Forest" },
    { value: "temperate-grassland", label: "Plains/Grassland" },
    { value: "desert", label: "Desert" },
    { value: "tundra", label: "Arctic/Tundra" },
    { value: "tropical-rainforest", label: "Tropical Rainforest" },
    { value: "tropical-seasonal", label: "Tropical Seasonal/Swamp" },
    { value: "temperate-rainforest", label: "Coastal Rainforest" },
    { value: "boreal-forest", label: "Boreal/Mountain Forest" },
  ];

  // Latitude band options
  const latitudeBandOptions = [
    { value: "equatorial", label: "Equatorial (0-10°)" },
    { value: "tropical", label: "Tropical (10-23.5°)" },
    { value: "temperate", label: "Temperate (23.5-55°)" },
    { value: "subarctic", label: "Subarctic (55-66.5°)" },
    { value: "polar", label: "Polar (66.5-90°)" },
  ];

  return (
    <div className="region-creation-form card">
      <div className="card-title">Create New Region</div>

      <form onSubmit={handleSubmit}>
        {/* Region Name */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Region Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={`form-input ${errors.name ? "border-danger" : ""}`}
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter region name"
          />
          {errors.name && (
            <div className="text-danger text-sm mt-1">{errors.name}</div>
          )}
        </div>

        {/* Climate Type */}
        <div className="form-group">
          <label htmlFor="climate" className="form-label">
            Climate
          </label>
          <select
            id="climate"
            name="climate"
            className={`form-select ${errors.climate ? "border-danger" : ""}`}
            value={formData.climate}
            onChange={handleChange}
          >
            {climateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.climate && (
            <div className="text-danger text-sm mt-1">{errors.climate}</div>
          )}

          <div className="text-xs text-gray-400 mt-1">
            The climate determines the weather patterns and conditions for this
            region.
          </div>
        </div>

        {/* Latitude Band */}
        <div className="form-group">
          <label htmlFor="latitudeBand" className="form-label">
            Latitude Band
          </label>
          <select
            id="latitudeBand"
            name="latitudeBand"
            className={`form-select ${
              errors.latitudeBand ? "border-danger" : ""
            }`}
            value={formData.latitudeBand}
            onChange={handleChange}
          >
            {latitudeBandOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.latitudeBand && (
            <div className="text-danger text-sm mt-1">
              {errors.latitudeBand}
            </div>
          )}

          <div className="text-xs text-gray-400 mt-1">
            The latitude band affects day length and seasonal variations. It was
            automatically set based on the climate, but you can adjust it.
          </div>
        </div>

        {/* Description (optional) */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            className="form-textarea"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter region description"
            rows={3}
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions flex justify-end gap-4 mt-6">
          <button
            type="button"
            className="btn"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Region"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedRegionCreationForm;

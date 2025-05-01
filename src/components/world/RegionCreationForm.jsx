// components/world/RegionCreationForm.jsx
import React, { useState } from "react";
import useWorld from "../../hooks/useWorld";

const RegionCreationForm = ({ worldId, onCancel, onSuccess }) => {
  const { createRegion, isLoading } = useWorld();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    climate: "temperate-deciduous",
    description: "",
  });

  // Form validation state
  const [errors, setErrors] = useState({});

  // Handler for form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

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

export default RegionCreationForm;

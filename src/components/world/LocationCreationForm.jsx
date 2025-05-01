// components/world/LocationCreationForm.jsx
import React, { useState } from "react";
import useWorld from "../../hooks/useWorld";

const LocationCreationForm = ({ worldId, regionId, onCancel, onSuccess }) => {
  const { createLocation, getActiveWorld, isLoading } = useWorld();

  const worldDate = getActiveWorld()?.startDate || new Date().toISOString();
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    currentDate: worldDate.split("T")[0], // YYYY-MM-DD format
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
      newErrors.name = "Location name is required";
    }

    // Date validation
    if (!formData.currentDate) {
      newErrors.currentDate = "Starting date is required";
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

    // Create the location
    const newLocation = await createLocation(worldId, regionId, formData);

    if (newLocation) {
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(newLocation);
      }
    }
  };

  return (
    <div className="location-creation-form card">
      <div className="card-title">Create New Location</div>

      <form onSubmit={handleSubmit}>
        {/* Location Name */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Location Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={`form-input ${errors.name ? "border-danger" : ""}`}
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter location name"
          />
          {errors.name && (
            <div className="text-danger text-sm mt-1">{errors.name}</div>
          )}
        </div>

        {/* Starting Date */}
        <div className="form-group">
          <label htmlFor="currentDate" className="form-label">
            Starting Date
          </label>
          <input
            type="date"
            id="currentDate"
            name="currentDate"
            className={`form-input ${
              errors.currentDate ? "border-danger" : ""
            }`}
            value={formData.currentDate}
            onChange={handleChange}
          />
          {errors.currentDate && (
            <div className="text-danger text-sm mt-1">{errors.currentDate}</div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            This will be the current date in this location when weather
            generation begins.
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
            placeholder="Enter location description"
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
            {isLoading ? "Creating..." : "Create Location"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocationCreationForm;

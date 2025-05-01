// components/world/WorldCreationForm.jsx
import React, { useState } from "react";
import useWorld from "../../hooks/useWorld";

const WorldCreationForm = ({ onCancel, onSuccess }) => {
  const { createWorld, isLoading } = useWorld();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    calendar: "gregorian",
    startDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
    winterSolstice: "12-21", // MM-DD format
    summerSolstice: "06-21",
    springEquinox: "03-20",
    fallEquinox: "09-22",
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
      newErrors.name = "World name is required";
    }

    // Calendar validation
    if (!formData.calendar) {
      newErrors.calendar = "Calendar is required";
    }

    // Date format validation for seasonal dates (MM-DD)
    const seasonalDatePattern = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

    if (!seasonalDatePattern.test(formData.winterSolstice)) {
      newErrors.winterSolstice = "Use MM-DD format (e.g., 12-21)";
    }

    if (!seasonalDatePattern.test(formData.summerSolstice)) {
      newErrors.summerSolstice = "Use MM-DD format (e.g., 06-21)";
    }

    if (!seasonalDatePattern.test(formData.springEquinox)) {
      newErrors.springEquinox = "Use MM-DD format (e.g., 03-20)";
    }

    if (!seasonalDatePattern.test(formData.fallEquinox)) {
      newErrors.fallEquinox = "Use MM-DD format (e.g., 09-22)";
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

    // Create the world
    const newWorld = await createWorld(formData);

    if (newWorld) {
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(newWorld);
      }
    }
  };

  return (
    <div className="world-creation-form card">
      <div className="card-title">Create New World</div>

      <form onSubmit={handleSubmit}>
        {/* World Name */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            World Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={`form-input ${errors.name ? "border-danger" : ""}`}
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter world name"
          />
          {errors.name && (
            <div className="text-danger text-sm mt-1">{errors.name}</div>
          )}
        </div>

        {/* Calendar Type */}
        <div className="form-group">
          <label htmlFor="calendar" className="form-label">
            Calendar
          </label>
          <select
            id="calendar"
            name="calendar"
            className={`form-select ${errors.calendar ? "border-danger" : ""}`}
            value={formData.calendar}
            onChange={handleChange}
          >
            <option value="gregorian">Gregorian (Earth Standard)</option>
            <option value="fantasy">Fantasy (12 months, 30 days each)</option>
            <option value="lunar">Lunar (13 months, 28 days each)</option>
            <option value="custom">Custom</option>
          </select>
          {errors.calendar && (
            <div className="text-danger text-sm mt-1">{errors.calendar}</div>
          )}
        </div>

        {/* Start Date */}
        <div className="form-group">
          <label htmlFor="startDate" className="form-label">
            Starting Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            className={`form-input ${errors.startDate ? "border-danger" : ""}`}
            value={formData.startDate}
            onChange={handleChange}
          />
          {errors.startDate && (
            <div className="text-danger text-sm mt-1">{errors.startDate}</div>
          )}
        </div>

        {/* Seasonal Dates */}
        <details className="mb-4">
          <summary className="cursor-pointer p-2 bg-surface-light rounded-lg mb-2">
            Advanced Calendar Settings
          </summary>
          <div className="p-4 bg-surface-light rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="winterSolstice" className="form-label">
                  Winter Solstice (MM-DD)
                </label>
                <input
                  type="text"
                  id="winterSolstice"
                  name="winterSolstice"
                  className={`form-input ${
                    errors.winterSolstice ? "border-danger" : ""
                  }`}
                  value={formData.winterSolstice}
                  onChange={handleChange}
                  placeholder="12-21"
                />
                {errors.winterSolstice && (
                  <div className="text-danger text-sm mt-1">
                    {errors.winterSolstice}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="summerSolstice" className="form-label">
                  Summer Solstice (MM-DD)
                </label>
                <input
                  type="text"
                  id="summerSolstice"
                  name="summerSolstice"
                  className={`form-input ${
                    errors.summerSolstice ? "border-danger" : ""
                  }`}
                  value={formData.summerSolstice}
                  onChange={handleChange}
                  placeholder="06-21"
                />
                {errors.summerSolstice && (
                  <div className="text-danger text-sm mt-1">
                    {errors.summerSolstice}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="springEquinox" className="form-label">
                  Spring Equinox (MM-DD)
                </label>
                <input
                  type="text"
                  id="springEquinox"
                  name="springEquinox"
                  className={`form-input ${
                    errors.springEquinox ? "border-danger" : ""
                  }`}
                  value={formData.springEquinox}
                  onChange={handleChange}
                  placeholder="03-20"
                />
                {errors.springEquinox && (
                  <div className="text-danger text-sm mt-1">
                    {errors.springEquinox}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="fallEquinox" className="form-label">
                  Fall Equinox (MM-DD)
                </label>
                <input
                  type="text"
                  id="fallEquinox"
                  name="fallEquinox"
                  className={`form-input ${
                    errors.fallEquinox ? "border-danger" : ""
                  }`}
                  value={formData.fallEquinox}
                  onChange={handleChange}
                  placeholder="09-22"
                />
                {errors.fallEquinox && (
                  <div className="text-danger text-sm mt-1">
                    {errors.fallEquinox}
                  </div>
                )}
              </div>
            </div>
          </div>
        </details>

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
            {isLoading ? "Creating..." : "Create World"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorldCreationForm;

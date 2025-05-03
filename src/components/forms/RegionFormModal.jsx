// src/components/forms/RegionFormModal.jsx

import React, { useState } from "react";
import { useRegion } from "../../contexts/RegionContext";

const RegionFormModal = ({ onClose }) => {
  const { createRegion } = useRegion();
  const [formData, setFormData] = useState({
    name: "",
    climate: "temperate-deciduous",
    latitudeBand: "temperate",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      createRegion(formData);
      onClose();
    } catch (error) {
      console.error("Error creating region:", error);
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay"
      onClick={handleModalClick}
    >
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-md m-4 max-h-90vh overflow-y-auto">
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
              <option value="tropical-rainforest">Tropical Rainforest</option>
              <option value="tropical-seasonal">Tropical Seasonal</option>
              <option value="desert">Desert</option>
              <option value="temperate-grassland">Temperate Grassland</option>
              <option value="temperate-deciduous">
                Temperate Deciduous Forest
              </option>
              <option value="temperate-rainforest">Temperate Rainforest</option>
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

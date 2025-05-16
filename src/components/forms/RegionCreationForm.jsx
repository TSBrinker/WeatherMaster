// Modified RegionCreationForm.jsx with weather system selection

import React, { useState } from "react";
import { useRegion } from "../../../src/contexts/RegionContext";

const RegionCreationForm = ({ onComplete }) => {
  const { createRegion } = useRegion();
  const [formData, setFormData] = useState({
    name: "",
    climate: "temperate-deciduous",
    latitudeBand: "temperate",
    weatherType: "diceTable", // Default to dice table system
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
      setFormData({
        name: "",
        climate: "temperate-deciduous",
        latitudeBand: "temperate",
        weatherType: "diceTable",
      });
      if (onComplete) onComplete();
    } catch (error) {
      console.error("Error creating region:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-4">
      <h2 className="text-xl font-semibold mb-4">Create New Region</h2>

      <form onSubmit={handleSubmit}>
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
          <div className="text-sm text-text-secondary mt-1">
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
          <div className="text-sm text-text-secondary mt-1">
            Affects day/night cycle and seasonal daylight hours
          </div>
        </div>

        {/* New Weather System selection */}
        <div className="mb-4">
          <label htmlFor="weatherType" className="block mb-2">
            Weather System
          </label>
          <select
            id="weatherType"
            name="weatherType"
            value={formData.weatherType}
            onChange={handleChange}
            className="w-full p-2 rounded bg-surface-light text-white border border-border"
          >
            <option value="diceTable">Basic (Dice Tables)</option>
            <option value="meteorological">Advanced (Meteorological)</option>
          </select>
          <div className="text-sm text-text-secondary mt-1">
            Choose between simple dice-based generation or more realistic
            meteorological modeling
          </div>
        </div>

        <div className="flex justify-end mt-6">
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
  );
};

// export default RegionCreationForm;

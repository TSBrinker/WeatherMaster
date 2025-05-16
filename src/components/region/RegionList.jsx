// src/components/region/RegionList.jsx - With delete functionality
import React from "react";
import { useRegion } from "../../contexts/RegionContext";

const RegionList = () => {
  const { regions, activeRegion, setActiveRegion, deleteRegion } = useRegion();

  // Climate display names
  const climateNames = {
    "tropical-rainforest": "Tropical Rainforest",
    "tropical-seasonal": "Tropical Seasonal",
    desert: "Desert",
    "temperate-grassland": "Temperate Grassland",
    "temperate-deciduous": "Temperate Deciduous",
    "temperate-rainforest": "Temperate Rainforest",
    "boreal-forest": "Boreal Forest",
    tundra: "Tundra",
  };

  // Latitude band display names
  const latitudeBandNames = {
    equatorial: "Equatorial",
    tropical: "Tropical",
    temperate: "Temperate",
    subarctic: "Subarctic",
    polar: "Polar",
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this region?")) {
      deleteRegion(id);
    }
  };

  if (regions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🗺️</div>
        <h2 className="empty-state-title">No Regions Yet</h2>
        <p className="empty-state-desc">
          Create your first region to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h2 className="text-xl font-semibold mb-4">Your Regions</h2>

      <div className="space-y-3">
        {regions.map((region) => (
          <div
            key={region.id}
            className={`p-3 rounded cursor-pointer transition-all hover:scale-102 ${
              activeRegion?.id === region.id ? "bg-primary" : "bg-surface-light"
            }`}
            onClick={() => setActiveRegion(region.id)}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{region.name}</h3>
              <button
                onClick={(e) => handleDelete(e, region.id)}
                className="text-text-secondary hover:text-danger text-sm p-1"
                title="Delete Region"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>
                <span className="text-text-secondary">Climate: </span>
                {climateNames[region.climate] || region.climate}
              </div>
              <div>
                <span className="text-text-secondary">Latitude: </span>
                {latitudeBandNames[region.latitudeBand] || region.latitudeBand}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegionList;

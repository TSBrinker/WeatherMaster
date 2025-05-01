// components/world/RegionList.jsx
import React, { useState } from "react";
import useWorld from "../../hooks/useWorld";

const RegionList = ({ worldId, onCreateNew, onSelectRegion }) => {
  const {
    worlds,
    activeWorldId,
    activeRegionId,
    setActiveRegion,
    deleteRegion,
    isLoading,
  } = useWorld();

  const [confirmDelete, setConfirmDelete] = useState(null);

  // Get the current world
  const currentWorld = worlds.find((world) => world.id === worldId);

  // Get regions for the current world
  const regions = currentWorld?.regions || [];

  // Handler for selecting a region
  const handleSelect = (regionId) => {
    setActiveRegion(worldId, regionId);
    if (onSelectRegion) {
      onSelectRegion(regionId);
    }
  };

  // Handler for deleting a region
  const handleDelete = (regionId) => {
    // Show delete confirmation
    setConfirmDelete(regionId);
  };

  // Confirm delete
  const confirmDeleteRegion = () => {
    if (confirmDelete) {
      deleteRegion(worldId, confirmDelete);
      setConfirmDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  // Get climate display name
  const getClimateDisplayName = (climate) => {
    const climateMap = {
      "temperate-deciduous": "Temperate Forest",
      desert: "Desert",
      tundra: "Arctic/Tundra",
      "tropical-rainforest": "Tropical Rainforest",
      "temperate-rainforest": "Coastal Rainforest",
      "boreal-forest": "Boreal/Mountain Forest",
      "temperate-grassland": "Plains/Grassland",
      "tropical-seasonal": "Tropical Seasonal/Swamp",
    };

    return climateMap[climate] || climate;
  };

  // Get climate badge color
  const getClimateBadgeClass = (climate) => {
    const climateClassMap = {
      "temperate-deciduous": "badge-temperate",
      desert: "badge-desert",
      tundra: "badge-arctic",
      "tropical-rainforest": "badge-tropical",
      "temperate-rainforest": "badge-coastal",
      "boreal-forest": "badge-mountain",
      "temperate-grassland": "badge-temperate",
      "tropical-seasonal": "badge-tropical",
    };

    return climateClassMap[climate] || "";
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="region-list card">
        <div className="card-title">Regions</div>
        <div className="loading-state text-center py-4">
          <p>Loading regions...</p>
        </div>
      </div>
    );
  }

  // Render when no world is selected
  if (!currentWorld) {
    return (
      <div className="region-list card">
        <div className="card-title">Regions</div>
        <div className="empty-state text-center py-10">
          <div className="empty-state-icon">🏔️</div>
          <div className="empty-state-title">No World Selected</div>
          <div className="empty-state-desc">
            Please select a world to view regions.
          </div>
        </div>
      </div>
    );
  }

  // Render empty state
  if (regions.length === 0) {
    return (
      <div className="region-list card">
        <div className="card-title">Regions in {currentWorld.name}</div>
        <div className="empty-state text-center py-10">
          <div className="empty-state-icon">🏔️</div>
          <div className="empty-state-title">No Regions Yet</div>
          <div className="empty-state-desc">
            Create your first region to get started.
          </div>
          <button className="btn btn-primary mt-4" onClick={onCreateNew}>
            Create Region
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="region-list card">
      <div className="flex justify-between items-center mb-4">
        <div className="card-title">Regions in {currentWorld.name}</div>
        <button className="btn btn-primary btn-small" onClick={onCreateNew}>
          + New Region
        </button>
      </div>

      <div className="regions-container">
        {regions.map((region) => (
          <div
            key={region.id}
            className={`region-item p-4 mb-2 rounded-lg cursor-pointer transition-all hover:scale-102 flex justify-between items-center ${
              region.id === activeRegionId
                ? "bg-primary text-white"
                : "bg-surface-light"
            }`}
            onClick={() => handleSelect(region.id)}
          >
            <div className="region-info">
              <div className="region-name font-semibold">{region.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`badge ${getClimateBadgeClass(region.climate)}`}
                >
                  {getClimateDisplayName(region.climate)}
                </span>
                <span className="region-meta text-sm text-gray-400">
                  {region.locations?.length || 0} Locations
                </span>
              </div>
            </div>

            {/* Delete button */}
            <button
              className="delete-btn p-1 rounded hover:bg-surface-light"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(region.id);
              }}
            >
              <span role="img" aria-label="Delete">
                🗑️
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="delete-confirm-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal-content bg-surface p-6 rounded-lg max-w-md">
            <h3 className="text-xl font-bold mb-4">Delete Region?</h3>
            <p className="mb-6">
              Are you sure you want to delete this region? This action cannot be
              undone, and all locations will be permanently deleted.
            </p>
            <div className="flex justify-end gap-4">
              <button className="btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDeleteRegion}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionList;

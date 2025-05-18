// src/components/world/WorldRegionsMenu.jsx - Bug fix
import React, { useState } from "react";
import { useWorldSettings } from "../../contexts/WorldSettings";
import { useRegion } from "../../contexts/RegionContext";
import RegionFormModal from "../forms/RegionFormModal";
import RegionEditModal from "../forms/RegionEditModal";

const WorldRegionsMenu = ({
  isOpen,
  onClose,
  onRequestCreateRegion,
  onRequestEditRegion,
}) => {
  const { state: worldSettings } = useWorldSettings();
  const { regions, activeRegion, setActiveRegion, hasRegions, deleteRegion } =
    useRegion();

  // Handle clicking outside to close
  const handleModalClick = (e) => {
    if (e.target.classList.contains("world-regions-overlay")) {
      onClose();
    }
  };

  const handleRegionSelect = (regionId) => {
    setActiveRegion(regionId);
    onClose();
  };

  const handleCreateNew = () => {
    // First close this modal, then signal to parent to open create form
    onClose();
    // Small delay to ensure modal is closed first
    setTimeout(() => {
      onRequestCreateRegion();
    }, 1);
  };

  const handleEditRegion = (e, region) => {
    e.stopPropagation(); // Prevent region selection
    onClose();
    // Small delay to ensure modal is closed first
    setTimeout(() => {
      onRequestEditRegion(region);
    }, 100);
  };

  const handleDeleteRegion = (e, regionId) => {
    e.stopPropagation(); // Prevent region selection
    if (window.confirm("Are you sure you want to delete this region?")) {
      deleteRegion(regionId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="world-regions-overlay" onClick={handleModalClick}>
      <div className="world-regions-modal">
        {/* Header with close button */}
        <div className="world-regions-header">
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        </div>

        {/* World name in large text */}
        <div className="world-name-container">
          <h1 className="world-name-large">
            {worldSettings?.worldName || "My Fantasy World"}
          </h1>
        </div>

        {/* Create new region button */}
        <div className="create-region-container">
          <button onClick={handleCreateNew} className="create-region-button">
            <span className="plus-icon">+</span> Create new region...
          </button>
        </div>

        {/* Regions list */}
        <div className="regions-list-container">
          {hasRegions ? (
            <div className="regions-list">
              {regions.map((region) => (
                <div
                  key={region.id}
                  className={`region-list-item ${
                    activeRegion?.id === region.id ? "region-active" : ""
                  }`}
                  onClick={() => handleRegionSelect(region.id)}
                >
                  <div className="region-info">
                    <div className="region-name">{region.name}</div>
                    <div className="region-biome">
                      {region.profile?.biome
                        ? region.profile.biome.replace("-", " ")
                        : region.climate?.replace("-", " ") ||
                          "Unknown climate"}
                    </div>
                  </div>
                  <div className="region-actions">
                    <button
                      className="region-edit-button"
                      onClick={(e) => handleEditRegion(e, region)}
                      title="Edit region"
                    >
                      <span className="pencil-icon">✎</span>
                    </button>
                    <button
                      className="region-delete-button"
                      onClick={(e) => handleDeleteRegion(e, region.id)}
                      title="Delete region"
                    >
                      <span className="delete-icon">✕</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state text-center p-6">
              <div className="text-4xl mb-3">🗺️</div>
              <h3 className="text-lg mb-2">No Regions Yet</h3>
              <p className="text-sm text-gray-400 mb-4">
                Create your first region to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorldRegionsMenu;

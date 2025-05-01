// components/world/WorldManager.jsx
import React, { useState, useEffect } from "react";
import useWorld from "../../hooks/useWorld";

// Import world components
import WorldList from "./WorldList";
import WorldCreationForm from "./WorldCreationForm";
import RegionList from "./RegionList";
import RegionCreationForm from "./RegionCreationForm";
import LocationList from "./LocationList";
import LocationCreationForm from "./LocationCreationForm";

const WorldManager = ({ onLocationSelected }) => {
  const {
    activeWorldId,
    activeRegionId,
    activeLocationId,
    loadWorlds,
    createExampleWorld,
    isLoading,
  } = useWorld();

  // UI state
  const [showWorldCreation, setShowWorldCreation] = useState(false);
  const [showRegionCreation, setShowRegionCreation] = useState(false);
  const [showLocationCreation, setShowLocationCreation] = useState(false);

  // Load worlds on component mount
  useEffect(() => {
    loadWorlds();
  }, [loadWorlds]);

  // Handler for creating a example world
  const handleCreateExampleWorld = () => {
    const exampleWorld = createExampleWorld();
    if (exampleWorld && onLocationSelected) {
      // Find the first location in the example world
      const firstRegion = exampleWorld.regions[0];
      if (firstRegion && firstRegion.locations && firstRegion.locations[0]) {
        onLocationSelected(firstRegion.locations[0].id);
      }
    }
  };

  // Handler for creating a new world
  const handleCreateWorld = () => {
    setShowWorldCreation(true);
  };

  // Handler for world creation success
  const handleWorldCreated = (newWorld) => {
    setShowWorldCreation(false);
  };

  // Handler for canceling world creation
  const handleCancelWorldCreation = () => {
    setShowWorldCreation(false);
  };

  // Handler for creating a new region
  const handleCreateRegion = () => {
    setShowRegionCreation(true);
  };

  // Handler for region creation success
  const handleRegionCreated = (newRegion) => {
    setShowRegionCreation(false);
  };

  // Handler for canceling region creation
  const handleCancelRegionCreation = () => {
    setShowRegionCreation(false);
  };

  // Handler for creating a new location
  const handleCreateLocation = () => {
    setShowLocationCreation(true);
  };

  // Handler for location creation success
  const handleLocationCreated = (newLocation) => {
    setShowLocationCreation(false);

    // Notify parent component of location selection
    if (onLocationSelected) {
      onLocationSelected(newLocation.id);
    }
  };

  // Handler for canceling location creation
  const handleCancelLocationCreation = () => {
    setShowLocationCreation(false);
  };

  // Handler for location selection
  const handleLocationSelected = (locationId) => {
    if (onLocationSelected) {
      onLocationSelected(locationId);
    }
  };

  // Render creation forms or lists based on UI state
  const renderWorldSection = () => {
    if (showWorldCreation) {
      return (
        <WorldCreationForm
          onCancel={handleCancelWorldCreation}
          onSuccess={handleWorldCreated}
        />
      );
    }

    return (
      <WorldList onCreateNew={handleCreateWorld} onSelectWorld={() => {}} />
    );
  };

  const renderRegionSection = () => {
    if (!activeWorldId) {
      return (
        <div className="region-section card">
          <div className="card-title">Regions</div>
          <div className="empty-state text-center py-6">
            <p>Please select a world first</p>
          </div>
        </div>
      );
    }

    if (showRegionCreation) {
      return (
        <RegionCreationForm
          worldId={activeWorldId}
          onCancel={handleCancelRegionCreation}
          onSuccess={handleRegionCreated}
        />
      );
    }

    return (
      <RegionList
        worldId={activeWorldId}
        onCreateNew={handleCreateRegion}
        onSelectRegion={() => {}}
      />
    );
  };

  const renderLocationSection = () => {
    if (!activeWorldId || !activeRegionId) {
      return (
        <div className="location-section card">
          <div className="card-title">Locations</div>
          <div className="empty-state text-center py-6">
            <p>Please select a region first</p>
          </div>
        </div>
      );
    }

    if (showLocationCreation) {
      return (
        <LocationCreationForm
          worldId={activeWorldId}
          regionId={activeRegionId}
          onCancel={handleCancelLocationCreation}
          onSuccess={handleLocationCreated}
        />
      );
    }

    return (
      <LocationList
        worldId={activeWorldId}
        regionId={activeRegionId}
        onCreateNew={handleCreateLocation}
        onSelectLocation={handleLocationSelected}
      />
    );
  };

  // Render loading state
  if (isLoading && !activeWorldId && !activeRegionId && !activeLocationId) {
    return (
      <div className="world-manager p-4">
        <div className="loading-state text-center py-10">
          <div className="text-xl mb-2">Loading world data...</div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="world-manager p-4">
      <h2 className="text-xl font-bold mb-4">World Manager</h2>

      {/* Quick start option */}
      {(!activeWorldId || !activeRegionId || !activeLocationId) && (
        <div className="quick-start-panel card mb-4 p-4">
          <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
          <p className="mb-4">
            Need to get started quickly? Create an example world with default
            settings.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleCreateExampleWorld}
          >
            Create Example World
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="world-section">{renderWorldSection()}</div>

        <div className="region-section">{renderRegionSection()}</div>

        <div className="location-section">{renderLocationSection()}</div>
      </div>
    </div>
  );
};

export default WorldManager;

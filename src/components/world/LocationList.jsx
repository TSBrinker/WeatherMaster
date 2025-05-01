// components/world/LocationList.jsx
import React, { useState } from "react";
import useWorld from "../../hooks/useWorld";
import { formatDate } from "../../utils/dateUtils";

const LocationList = ({ worldId, regionId, onCreateNew, onSelectLocation }) => {
  const {
    worlds,
    activeLocationId,
    setActiveLocation,
    deleteLocation,
    isLoading,
  } = useWorld();

  const [confirmDelete, setConfirmDelete] = useState(null);

  // Get the current world
  const currentWorld = worlds.find((world) => world.id === worldId);

  // Get the current region
  const currentRegion = currentWorld?.regions?.find(
    (region) => region.id === regionId
  );

  // Get locations for the current region
  const locations = currentRegion?.locations || [];

  // Handler for selecting a location
  const handleSelect = (locationId) => {
    setActiveLocation(worldId, regionId, locationId);
    if (onSelectLocation) {
      onSelectLocation(locationId);
    }
  };

  // Handler for deleting a location
  const handleDelete = (locationId) => {
    // Show delete confirmation
    setConfirmDelete(locationId);
  };

  // Confirm delete
  const confirmDeleteLocation = () => {
    if (confirmDelete) {
      deleteLocation(worldId, regionId, confirmDelete);
      setConfirmDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="location-list card">
        <div className="card-title">Locations</div>
        <div className="loading-state text-center py-4">
          <p>Loading locations...</p>
        </div>
      </div>
    );
  }

  // Render when no region is selected
  if (!currentRegion) {
    return (
      <div className="location-list card">
        <div className="card-title">Locations</div>
        <div className="empty-state text-center py-10">
          <div className="empty-state-icon">🏙️</div>
          <div className="empty-state-title">No Region Selected</div>
          <div className="empty-state-desc">
            Please select a region to view locations.
          </div>
        </div>
      </div>
    );
  }

  // Render empty state
  if (locations.length === 0) {
    return (
      <div className="location-list card">
        <div className="card-title">Locations in {currentRegion.name}</div>
        <div className="empty-state text-center py-10">
          <div className="empty-state-icon">🏙️</div>
          <div className="empty-state-title">No Locations Yet</div>
          <div className="empty-state-desc">
            Create your first location to get started.
          </div>
          <button className="btn btn-primary mt-4" onClick={onCreateNew}>
            Create Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="location-list card">
      <div className="flex justify-between items-center mb-4">
        <div className="card-title">Locations in {currentRegion.name}</div>
        <button className="btn btn-primary btn-small" onClick={onCreateNew}>
          + New Location
        </button>
      </div>

      <div className="locations-container">
        {locations.map((location) => (
          <div
            key={location.id}
            className={`location-item p-4 mb-2 rounded-lg cursor-pointer transition-all hover:scale-102 flex justify-between items-center ${
              location.id === activeLocationId
                ? "bg-primary text-white"
                : "bg-surface-light"
            }`}
            onClick={() => handleSelect(location.id)}
          >
            <div className="location-info">
              <div className="location-name font-semibold">{location.name}</div>
              <div className="mt-1 text-sm text-gray-400">
                Current Date: {formatDate(location.currentDate, "dateOnly")}
              </div>
            </div>

            {/* Weather status indicator */}
            <div className="weather-status mr-4">
              {location.weatherData ? (
                <div className="flex items-center">
                  <span
                    className="weather-icon mr-1"
                    role="img"
                    aria-label={location.weatherData.condition}
                  >
                    {getWeatherIcon(location.weatherData.condition)}
                  </span>
                  <span className="temperature">
                    {location.weatherData.temperature}°F
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">No weather data</span>
              )}
            </div>

            {/* Delete button */}
            <button
              className="delete-btn p-1 rounded hover:bg-surface-light"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(location.id);
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
            <h3 className="text-xl font-bold mb-4">Delete Location?</h3>
            <p className="mb-6">
              Are you sure you want to delete this location? This action cannot
              be undone, and all weather data will be permanently deleted.
            </p>
            <div className="flex justify-end gap-4">
              <button className="btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDeleteLocation}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get weather icon
const getWeatherIcon = (condition) => {
  switch (condition) {
    case "Clear Skies":
      return "☀️";
    case "Light Clouds":
      return "🌤️";
    case "Heavy Clouds":
      return "☁️";
    case "Rain":
      return "🌧️";
    case "Heavy Rain":
      return "⛈️";
    case "Snow":
      return "❄️";
    case "Freezing Cold":
      return "🥶";
    case "Cold Winds":
      return "🌬️";
    case "Scorching Heat":
      return "🔥";
    case "Thunderstorm":
      return "⚡";
    case "Blizzard":
      return "🌨️";
    case "High Humidity Haze":
      return "🌫️";
    case "Cold Snap":
      return "❄️";
    default:
      return "❓";
  }
};

export default LocationList;

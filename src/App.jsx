// src/App.jsx - Updated with a single improved dropdown
import React, { useState, useEffect, useRef } from "react";
import { WorldProvider } from "./contexts/WorldContext";
import { useRegion, RegionProvider } from "./contexts/RegionContext";
import {
  WorldSettingsProvider,
  useWorldSettings,
} from "./contexts/WorldSettings";
import WeatherDashboard from "./components/WeatherDashboard";
import RegionFormModal from "./components/forms/RegionFormModal";
import RegionEditModal from "./components/forms/RegionEditModal";
import WorldConfigButton from "./components/world/WorldConfigButton";
import WorldSetupModal from "./components/world/WorldSetupModal";

// App content that uses the world settings
const AppContent = () => {
  const [showRegionForm, setShowRegionForm] = useState(false);
  const [showWorldSetup, setShowWorldSetup] = useState(false);
  const [showRegionList, setShowRegionList] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const { state: worldSettings } = useWorldSettings();
  const { regions, activeRegion, setActiveRegion, deleteRegion } = useRegion();
  const dropdownRef = useRef(null);

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

  // Show world setup modal if not configured
  useEffect(() => {
    if (
      !worldSettings.isConfigured &&
      !localStorage.getItem("gm-weather-companion-world-settings")
    ) {
      setShowWorldSetup(true);
    }
  }, [worldSettings.isConfigured]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowRegionList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleRegionSelect = (regionId) => {
    setActiveRegion(regionId);
    setShowRegionList(false);
  };

  const handleRegionDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this region?")) {
      deleteRegion(id);
      setShowRegionList(false);
    }
  };

  const handleRegionEdit = (e, region) => {
    e.stopPropagation();
    setEditingRegion(region);
    setShowRegionList(false);
  };

  return (
    <div className="app-container">
      <header className="flex justify-between items-center mb-6 p-4 bg-surface rounded-lg">
        <div className="header-content">
          <h1 className="text-2xl font-bold">GM Weather Companion</h1>
        </div>

        <div className="flex items-center gap-3">
          <WorldConfigButton onClick={() => setShowWorldSetup(true)} />

          <div className="dropdown-wrapper" ref={dropdownRef}>
            <button
              className="region-selector-button"
              onClick={() => setShowRegionList(!showRegionList)}
              type="button"
            >
              {activeRegion
                ? activeRegion.name
                : regions.length > 0
                ? "Select Region"
                : "+ New Region"}
              <span className="ml-2">{showRegionList ? "▲" : "▼"}</span>
            </button>

            {showRegionList && (
              <div className="dropdown-menu">
                {regions.length > 0 ? (
                  <>
                    <div className="dropdown-header">Select a region</div>
                    <div className="dropdown-items">
                      {regions.map((region) => (
                        <div
                          key={region.id}
                          className={`dropdown-item ${
                            activeRegion?.id === region.id ? "active" : ""
                          }`}
                          onClick={() => handleRegionSelect(region.id)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">{region.name}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => handleRegionEdit(e, region)}
                                className="text-text-secondary hover:text-primary text-sm p-1"
                                title="Edit Region"
                              >
                                ✎
                              </button>
                              <button
                                onClick={(e) =>
                                  handleRegionDelete(e, region.id)
                                }
                                className="text-text-secondary hover:text-danger text-sm p-1"
                                title="Delete Region"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {climateNames[region.climate] || region.climate}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className="dropdown-footer"
                      onClick={() => {
                        setShowRegionForm(true);
                        setShowRegionList(false);
                      }}
                    >
                      + New Region
                    </div>
                  </>
                ) : (
                  <div
                    className="dropdown-item text-center"
                    onClick={() => {
                      setShowRegionForm(true);
                      setShowRegionList(false);
                    }}
                  >
                    + Create Your First Region
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <WeatherDashboard />
      </main>

      {showRegionForm && (
        <RegionFormModal onClose={() => setShowRegionForm(false)} />
      )}

      {editingRegion && (
        <RegionEditModal
          region={editingRegion}
          onClose={() => setEditingRegion(null)}
        />
      )}

      {showWorldSetup && (
        <WorldSetupModal onClose={() => setShowWorldSetup(false)} />
      )}
    </div>
  );
};

// Main App component with providers
function App() {
  return (
    <div className="container mx-auto p-4">
      <WorldSettingsProvider>
        <WorldProvider>
          <RegionProvider>
            <AppContent />
          </RegionProvider>
        </WorldProvider>
      </WorldSettingsProvider>
    </div>
  );
}

export default App;

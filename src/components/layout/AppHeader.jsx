// src/components/layout/AppHeader.jsx
import React, { useState } from "react";
import { usePreferences } from "../../contexts/PreferencesContext";
import WorldRegionsMenu from "../world/WorldRegionsMenu";
import RegionFormModal from "../forms/RegionFormModal";
import RegionEditModal from "../forms/RegionEditModal";
import WorldSetupModal from "../world/WorldSetupModal"; // Make sure this is imported
import { useRegion } from "../../contexts/RegionContext";
import appIcon from "../../WM TP WithText.png";

const AppHeader = () => {
  const { togglePreferencesMenu } = usePreferences();
  const { activeRegion } = useRegion();
  const [showRegionsMenu, setShowRegionsMenu] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [showWorldSetup, setShowWorldSetup] = useState(false); // Add this state

  const handleOpenRegionsMenu = () => {
    // Make sure other modals are closed
    setShowCreateForm(false);
    setEditingRegion(null);
    setShowWorldSetup(false); // Close world setup if open
    setShowRegionsMenu(true);
  };

  const handleCloseRegionsMenu = () => {
    setShowRegionsMenu(false);
  };

  const handleRequestCreateRegion = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleRequestEditRegion = (region) => {
    setEditingRegion(region);
  };

  const handleCloseEditForm = () => {
    setEditingRegion(null);
  };

  // Add this handler for opening world settings
  const handleOpenWorldSettings = () => {
    console.log("Opening world settings modal");
    // First close the regions menu if it's open
    setShowRegionsMenu(false);
    // Schedule opening the world setup modal after regions menu closes
    setTimeout(() => {
      setShowWorldSetup(true);
    }, 100);
  };

  return (
    <header className="app-header">
      <div className="app-brand">
        <img src={appIcon} alt="WeatherMaster" className="header-icon" />
        {/* <h1>WeatherMaster</h1> */}
      </div>

      <div className="app-controls">
        {/* Hamburger menu button */}
        <button
          className="flex items-center gap-2 px-3 py-2 bg-surface-light hover:bg-surface rounded"
          onClick={handleOpenRegionsMenu}
          title="Regions & Worlds"
        >
          {/* Hamburger icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <span className="font-medium">Regions</span>
        </button>

        {/* Settings button */}
        <button
          className="icon-button"
          onClick={togglePreferencesMenu}
          title="App Preferences"
        >
          {/* Gear icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>

      {/* Modals */}
      <WorldRegionsMenu
        isOpen={showRegionsMenu}
        onClose={handleCloseRegionsMenu}
        onRequestCreateRegion={handleRequestCreateRegion}
        onRequestEditRegion={handleRequestEditRegion}
        onOpenWorldSettings={handleOpenWorldSettings} // Pass the handler
      />

      {showCreateForm && <RegionFormModal onClose={handleCloseCreateForm} />}

      {editingRegion && (
        <RegionEditModal region={editingRegion} onClose={handleCloseEditForm} />
      )}

      {/* Add the WorldSetupModal */}
      {showWorldSetup && (
        <WorldSetupModal
          onClose={() => setShowWorldSetup(false)}
          forceShow={false}
          editMode={true} // Set this to true for manual editing
        />
      )}
    </header>
  );
};

export default AppHeader;

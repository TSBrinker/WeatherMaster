// src/components/layout/AppHeader.jsx - Updated
import React, { useState } from "react";
import { usePreferences } from "../../contexts/PreferencesContext";
import WorldRegionsMenu from "../world/WorldRegionsMenu";
import RegionFormModal from "../forms/RegionFormModal";
import RegionEditModal from "../forms/RegionEditModal";
import { useRegion } from "../../contexts/RegionContext";

const AppHeader = () => {
  const { togglePreferencesMenu } = usePreferences();
  const { activeRegion } = useRegion();
  const [showRegionsMenu, setShowRegionsMenu] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);

  const handleOpenRegionsMenu = () => {
    // Make sure other modals are closed
    setShowCreateForm(false);
    setEditingRegion(null);
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

  return (
    <header className="app-header">
      <div className="app-brand">
        <h1>WeatherMaster.io</h1>
      </div>

      <div className="app-controls">
        {/* Hamburger menu button */}
        <button
          className="icon-button"
          onClick={handleOpenRegionsMenu}
          title="Regions & Worlds"
        >
          {/* Hamburger icon */}
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
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
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
      />

      {showCreateForm && <RegionFormModal onClose={handleCloseCreateForm} />}

      {editingRegion && (
        <RegionEditModal region={editingRegion} onClose={handleCloseEditForm} />
      )}
    </header>
  );
};

export default AppHeader;

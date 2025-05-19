// src/App.jsx
// Update to include the first-time setup and pass the world settings handler

import React, { useState, useEffect } from "react";
import { WorldProvider } from "./contexts/WorldContext";
import { useRegion, RegionProvider } from "./contexts/RegionContext";
import {
  WorldSettingsProvider,
  useWorldSettings,
} from "./contexts/WorldSettings";
import {
  PreferencesProvider,
  usePreferences,
} from "./contexts/PreferencesContext";
import AppHeader from "./components/layout/AppHeader";
import PreferencesMenu from "./components/preferences/PreferencesMenu";
import WeatherDashboard from "./components/WeatherDashboard";
import RegionFormModal from "./components/forms/RegionFormModal";
import RegionEditModal from "./components/forms/RegionEditModal";
import WorldConfigButton from "./components/world/WorldConfigButton";
import WorldSetupModal from "./components/world/WorldSetupModal";
import FirstTimeSetup from "./components/onboarding/FirstTimeSetup"; // Add this import

function App() {
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);

  // Check if this is a first-time user
  useEffect(() => {
    // Check if this is the user's first time (no world settings and no regions)
    const hasWorldSettings = localStorage.getItem(
      "gm-weather-companion-world-settings"
    );
    const hasRegions = localStorage.getItem("gm-weather-companion-regions");

    if (!hasWorldSettings || !hasRegions) {
      setShowFirstTimeSetup(true);
    }
  }, []);

  return (
    <PreferencesProvider>
      <WorldSettingsProvider>
        <WorldProvider>
          <RegionProvider>
            <div className="app-container">
              <AppHeader />
              <main className="app-main">
                <WeatherDashboard />
              </main>
              <PreferencesMenu />

              {/* Add the FirstTimeSetup component */}
              {showFirstTimeSetup && (
                <FirstTimeSetup
                  onComplete={() => setShowFirstTimeSetup(false)}
                />
              )}
            </div>
          </RegionProvider>
        </WorldProvider>
      </WorldSettingsProvider>
    </PreferencesProvider>
  );
}

export default App;

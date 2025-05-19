// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
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
import FirstTimeSetup from "./components/onboarding/FirstTimeSetup";

// Main App component with providers
function App() {
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);
  const [showWorldSetup, setShowWorldSetup] = useState(false);
  const [isInitialCheck, setIsInitialCheck] = useState(true);
  const setupCheckRef = useRef(false);

  // Perform initial check for world settings
  useEffect(() => {
    // Skip if we already did this check
    if (setupCheckRef.current) return;
    setupCheckRef.current = true;

    // Debug
    console.log("Checking for initial setup state...");

    // Get all relevant localStorage items
    const worldSettings = localStorage.getItem(
      "gm-weather-companion-world-settings"
    );
    const regions = localStorage.getItem("gm-weather-companion-regions");
    const setupCompleted = localStorage.getItem(
      "gm-weather-companion-setup-completed"
    );

    console.log("Storage check:", {
      hasWorldSettings: !!worldSettings,
      hasRegions: !!regions,
      setupCompleted,
    });

    // If setup is explicitly marked as completed, respect that
    if (setupCompleted === "true") {
      console.log("Setup explicitly marked as completed, skipping setup");
      return;
    }

    // Add this check: Set a flag in localStorage to track initialization attempt
    // This ensures we know if the page was loaded but setup wasn't completed
    const setupAttempted = localStorage.getItem(
      "gm-weather-companion-setup-attempted"
    );

    // If no settings exist, or setup was attempted but not completed, show the modal
    if (!worldSettings || setupAttempted === "true") {
      console.log("Setup required: No settings or previous attempt incomplete");
      // Mark that we've attempted setup
      localStorage.setItem("gm-weather-companion-setup-attempted", "true");
      setShowWorldSetup(true);
      return;
    }

    // If settings exist, check if they're valid
    try {
      const parsedSettings = JSON.parse(worldSettings);
      if (
        !parsedSettings ||
        !parsedSettings.gameTime ||
        !parsedSettings.worldName
      ) {
        console.log("Invalid world settings found, showing setup modal");
        localStorage.setItem("gm-weather-companion-setup-attempted", "true");
        setShowWorldSetup(true);
        return;
      }

      // Settings look valid, mark setup as completed
      localStorage.setItem("gm-weather-companion-setup-completed", "true");
      // Also clear the setup attempted flag
      localStorage.removeItem("gm-weather-companion-setup-attempted");
      console.log("Valid world settings found, setup complete");
    } catch (e) {
      console.error("Error parsing world settings:", e);
      localStorage.setItem("gm-weather-companion-setup-attempted", "true");
      setShowWorldSetup(true);
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

              {/* World Setup Modal - more aggressive approach */}
              {showWorldSetup && (
                <WorldSetupModal
                  onClose={() => setShowWorldSetup(false)}
                  forceShow={true} // Add this prop to ensure it shows
                />
              )}

              {/* First-Time Setup */}
              {showFirstTimeSetup && (
                <FirstTimeSetup
                  onComplete={() => {
                    setShowFirstTimeSetup(false);
                    // Mark setup as completed
                    localStorage.setItem(
                      "gm-weather-companion-setup-completed",
                      "true"
                    );
                  }}
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

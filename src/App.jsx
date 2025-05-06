// src/App.jsx - Updated with improved components
import React, { useState, useEffect } from "react";
import { WorldProvider } from "./contexts/WorldContext";
import { RegionProvider } from "./contexts/RegionContext";
import {
  WorldSettingsProvider,
  useWorldSettings,
} from "./contexts/WorldSettings";
import WeatherDashboard from "./components/WeatherDashboard";
import RegionsDropdown from "./components/region/RegionsDropdown";
import RegionFormModal from "./components/forms/RegionFormModal";
import WorldConfigButton from "./components/world/WorldConfigButton";
import WorldSetupModal from "./components/world/WorldSetupModal";

// App content that uses the world settings
const AppContent = () => {
  const [showRegionForm, setShowRegionForm] = useState(false);
  const [showWorldSetup, setShowWorldSetup] = useState(false);
  const { state: worldSettings } = useWorldSettings();

  // Show world setup modal if not configured
  useEffect(() => {
    if (!worldSettings.isConfigured) {
      setShowWorldSetup(true);
    }
  }, [worldSettings.isConfigured]);

  return (
    <div className="app-container">
      <header className="flex justify-between items-center mb-6 p-4 bg-surface rounded-lg">
        <div className="header-content">
          <h1 className="text-2xl font-bold">GM Weather Companion</h1>
        </div>

        <div className="flex items-center gap-3">
          <WorldConfigButton onClick={() => setShowWorldSetup(true)} />
          <RegionsDropdown onShowCreateForm={() => setShowRegionForm(true)} />
        </div>
      </header>

      <main>
        <WeatherDashboard />
      </main>

      {showRegionForm && (
        <RegionFormModal onClose={() => setShowRegionForm(false)} />
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

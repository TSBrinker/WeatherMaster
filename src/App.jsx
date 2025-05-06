// src/App.jsx
import React, { useState, useEffect } from "react";
import { WorldProvider } from "./contexts/WorldContext";
import { RegionProvider } from "./contexts/RegionContext";
import { WorldSettingsProvider } from "./contexts/WorldSettings";
import WeatherDashboard from "./components/WeatherDashboard";
import RegionsDropdown from "./components/region/RegionsDropdown";
import RegionFormModal from "./components/forms/RegionFormModal";
import WorldConfigButton from "./components/world/WorldConfigButton";
import WorldSetupModal from "./components/world/WorldSetupModal";

const AppContent = () => {
  const [showRegionForm, setShowRegionForm] = useState(false);
  const [showWorldSetup, setShowWorldSetup] = useState(false);

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6 p-4 bg-surface rounded-lg">
        <h1 className="text-2xl font-bold">GM Weather Companion</h1>

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

function App() {
  return (
    <WorldSettingsProvider>
      <WorldProvider>
        <RegionProvider>
          <AppContent />
        </RegionProvider>
      </WorldProvider>
    </WorldSettingsProvider>
  );
}

export default App;

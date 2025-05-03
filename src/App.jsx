// src/App.jsx
import React, { useState } from "react";
import { RegionProvider, useRegion } from "./contexts/RegionContext";
import WeatherTestUI from "./components/WeatherTestUI";
import RegionsDropdown from "./components/region/RegionsDropdown";
import RegionFormModal from "./components/forms/RegionFormModal";
import "./index.css";

// Main app content inside providers
const AppContent = () => {
  const { hasRegions, activeRegion } = useRegion();
  const [showRegionForm, setShowRegionForm] = useState(!hasRegions);

  return (
    <div>
      <header className="header mb-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">GM Weather Companion</h1>

          <RegionsDropdown onShowCreateForm={() => setShowRegionForm(true)} />
        </div>
      </header>

      <main className="container mx-auto mb-6">
        {activeRegion ? (
          <WeatherTestUI region={activeRegion} />
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🗺️</div>
            <h2 className="empty-state-title">No Region Selected</h2>
            <p className="empty-state-desc">
              Create a region to get started with weather generation.
            </p>
            <button
              className="btn btn-primary mt-4"
              onClick={() => setShowRegionForm(true)}
            >
              Create Your First Region
            </button>
          </div>
        )}
      </main>

      {showRegionForm && (
        <RegionFormModal onClose={() => setShowRegionForm(false)} />
      )}

      <footer className="footer">
        <div className="container mx-auto">
          <p>GM Weather Companion v1.0.0</p>
        </div>
      </footer>
    </div>
  );
};

// Root App with providers
function App() {
  return (
    <RegionProvider>
      <AppContent />
    </RegionProvider>
  );
}

export default App;

import React, { useState } from "react";
import { WorldProvider } from "./contexts/WorldContext";
import { RegionProvider } from "./contexts/RegionContext";
import WeatherDashboard from "./components/WeatherDashboard";
import RegionsDropdown from "./components/region/RegionsDropdown";
import RegionFormModal from "./components/forms/RegionFormModal";

const AppContent = () => {
  const [showRegionForm, setShowRegionForm] = useState(false);

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6 p-4 bg-surface rounded-lg">
        <h1 className="text-2xl font-bold">GM Weather Companion</h1>
        <RegionsDropdown onShowCreateForm={() => setShowRegionForm(true)} />
      </header>

      <main>
        <WeatherDashboard />
      </main>

      {showRegionForm && (
        <RegionFormModal onClose={() => setShowRegionForm(false)} />
      )}
    </div>
  );
};

function App() {
  return (
    <WorldProvider>
      <RegionProvider>
        <AppContent />
      </RegionProvider>
    </WorldProvider>
  );
}

export default App;

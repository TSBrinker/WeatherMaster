// src/App.jsx

import React, { useState } from "react";
import { WorldProvider } from "./contexts/WorldContext";
import { RegionProvider } from "./contexts/RegionContext";
import WeatherDashboard from "./components/WeatherDashboard";
import RegionsDropdown from "./components/region/RegionsDropdown";
import RegionFormModal from "./components/forms/RegionFormModal";

const AppContent = () => {
  // Implementation continues as before but with WorldContext access
  // ...
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

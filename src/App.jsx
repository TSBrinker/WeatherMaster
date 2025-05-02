// src/App.jsx
import React, { useState } from 'react';
import { RegionProvider, useRegion } from './contexts/RegionContext';
import WeatherTestUI from './components/WeatherTestUI';
import RegionList from './components/region/RegionList';
import RegionCreationForm from './components/forms/RegionCreationForm';
import './index.css';

// Main app content inside providers
const AppContent = () => {
  const { regions, activeRegion } = useRegion();
  const [view, setView] = useState(regions.length === 0 ? 'create-region' : 'weather');

  const renderContent = () => {
    if (view === 'create-region') {
      return (
        <RegionCreationForm
          onComplete={() => setView('weather')}
        />
      );
    }

    if (view === 'region-list') {
      return <RegionList />;
    }

    if (view === 'weather') {
      return <WeatherTestUI region={activeRegion} />;
    }

    return null;
  };

  return (
    <div>
      <header className="header mb-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">GM Weather Companion</h1>
          
          <nav className="nav">
            <button
              className={`nav-item ${view === 'weather' ? 'active' : ''}`}
              onClick={() => setView('weather')}
              disabled={!activeRegion}
            >
              Weather
            </button>
            <button
              className={`nav-item ${view === 'region-list' ? 'active' : ''}`}
              onClick={() => setView('region-list')}
            >
              Regions
            </button>
            <button
              className={`nav-item ${view === 'create-region' ? 'active' : ''}`}
              onClick={() => setView('create-region')}
            >
              + New Region
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto mb-6">
        {renderContent()}
      </main>

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
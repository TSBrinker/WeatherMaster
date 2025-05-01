// App.jsx
import React, { useState, useEffect } from "react";
import { WeatherProvider } from "./contexts/WeatherContext";
import { WorldProvider } from "./contexts/WorldContext";
import WeatherDashboard from "./components/WeatherDashboard";
import WorldManager from "./components/world/WorldManager";
import StorageService from "./services/storage-service";
import "./index.css";

function App() {
  const [view, setView] = useState("weather"); // 'weather', 'world-manager'
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if this is a first-time user
  useEffect(() => {
    const storageService = new StorageService();
    const data = storageService.initialize();

    if (!data.worlds || data.worlds.length === 0) {
      setIsFirstTimeUser(true);
      // Automatically show world manager for first-time users
      setView("world-manager");
    }

    setIsLoading(false);
  }, []);

  // Handler for location selection from world manager
  const handleLocationSelected = (locationId) => {
    // Switch to weather view when a location is selected
    setView("weather");
    setIsFirstTimeUser(false);
  };

  return (
    <WorldProvider>
      <WeatherProvider>
        <div className="app">
          <header className="app-header bg-primary-dark p-4 text-white">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold">GM Weather Companion</h1>

              {!isLoading && (
                <nav className="nav">
                  <button
                    className={`nav-item ${view === "weather" ? "active" : ""}`}
                    onClick={() => setView("weather")}
                  >
                    Weather
                  </button>
                  <button
                    className={`nav-item ${
                      view === "world-manager" ? "active" : ""
                    }`}
                    onClick={() => setView("world-manager")}
                  >
                    Worlds
                  </button>
                </nav>
              )}
            </div>
          </header>

          <main className="app-content container mx-auto">
            {isLoading ? (
              <div className="loading-state text-center py-10">
                <div className="text-xl mb-2">Loading...</div>
              </div>
            ) : view === "weather" ? (
              <WeatherDashboard />
            ) : (
              <WorldManager
                onLocationSelected={handleLocationSelected}
                isFirstTimeUser={isFirstTimeUser}
              />
            )}
          </main>

          <footer className="app-footer bg-primary-dark p-4 text-center text-gray-300 text-sm mt-10">
            <p>GM Weather Companion v1.0.0</p>
            {/* Add a reset button for development testing */}
            <button
              className="btn btn-small mt-2 text-xs"
              onClick={() => {
                const storageService = new StorageService();
                storageService.clearData();
                window.location.reload();
              }}
            >
              Reset App Data
            </button>
          </footer>
        </div>
      </WeatherProvider>
    </WorldProvider>
  );
}

export default App;

// src/components/preferences/PreferencesMenu.jsx - Clean version without weather system selection
import React, { useState } from "react";
import { usePreferences } from "../../contexts/PreferencesContext";

const PreferencesMenu = () => {
  const { 
    state, 
    setDebugMode, 
    togglePreferencesMenu,
    setTemperatureUnit,
    setTimeFormat,
    setWindSpeedUnit,
    setShowFeelsLike
  } = usePreferences();

  // States for various sections
  const [showNuclearConfirm, setShowNuclearConfirm] = useState(false);
  const [nuclearConfirmText, setNuclearConfirmText] = useState("");
  const [showDataManagement, setShowDataManagement] = useState(false);

  // Handle clicking outside to close
  const handleModalClick = (e) => {
    if (e.target.classList.contains("preferences-overlay")) {
      togglePreferencesMenu();
    }
  };

  // Data export function
  const exportData = () => {
    const data = {
      worlds: localStorage.getItem('gm-weather-companion-worlds'),
      regions: localStorage.getItem('gm-weather-companion-regions'),
      worldSettings: localStorage.getItem('gm-weather-companion-world-settings'),
      preferences: localStorage.getItem('gm-weather-companion-preferences'),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skymaster-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Data import function
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (confirm('This will replace all existing data. Continue?')) {
          // Restore each data type
          if (data.worlds) localStorage.setItem('gm-weather-companion-worlds', data.worlds);
          if (data.regions) localStorage.setItem('gm-weather-companion-regions', data.regions);
          if (data.worldSettings) localStorage.setItem('gm-weather-companion-world-settings', data.worldSettings);
          if (data.preferences) localStorage.setItem('gm-weather-companion-preferences', data.preferences);
          
          alert('Data imported successfully. The app will reload.');
          window.location.reload();
        }
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  // Nuclear option - clear all data
  const handleNuclearOption = () => {
    if (nuclearConfirmText === "CLEAR ALL DATA") {
      // Clear all localStorage data
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('gm-weather-companion')
      );
      keys.forEach(key => localStorage.removeItem(key));
      
      alert('All data has been cleared. The app will reload.');
      window.location.reload();
    } else {
      alert('Please type "CLEAR ALL DATA" exactly to confirm.');
    }
  };

  if (!state.isOpen) return null;

  return (
    <div className="preferences-overlay" onClick={handleModalClick}>
      <div className="preferences-menu">
        <div className="preferences-header">
          <h2>Settings</h2>
          <button 
            className="close-button"
            onClick={togglePreferencesMenu}
          >
            ×
          </button>
        </div>

        <div className="preferences-content">
          {/* Display Settings */}
          <section className="preferences-section">
            <h3>Display Settings</h3>
            
            <div className="preference-item">
              <label htmlFor="temperature-unit">Temperature Unit</label>
              <select
                id="temperature-unit"
                value={state.temperatureUnit}
                onChange={(e) => setTemperatureUnit(e.target.value)}
              >
                <option value="fahrenheit">Fahrenheit (°F)</option>
                <option value="celsius">Celsius (°C)</option>
              </select>
            </div>

            <div className="preference-item">
              <label htmlFor="time-format">Time Format</label>
              <select
                id="time-format"
                value={state.timeFormat}
                onChange={(e) => setTimeFormat(e.target.value)}
              >
                <option value="12hour">12-hour (AM/PM)</option>
                <option value="24hour">24-hour</option>
              </select>
            </div>

            <div className="preference-item">
              <label htmlFor="wind-speed-unit">Wind Speed Unit</label>
              <select
                id="wind-speed-unit"
                value={state.windSpeedUnit}
                onChange={(e) => setWindSpeedUnit(e.target.value)}
              >
                <option value="mph">Miles per hour (mph)</option>
                <option value="kph">Kilometers per hour (km/h)</option>
                <option value="knots">Knots</option>
              </select>
            </div>

            <div className="preference-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={state.showFeelsLike}
                  onChange={(e) => setShowFeelsLike(e.target.checked)}
                />
                Show "Feels Like" Temperature
              </label>
            </div>
          </section>

          {/* Weather System Info */}
          <section className="preferences-section">
            <h3>Weather System</h3>
            <div className="weather-system-info">
              <p><strong>Current System:</strong> Meteorological Weather Generation</p>
              <p className="system-description">
                This system uses realistic atmospheric modeling to generate scientifically 
                accurate weather patterns based on temperature, humidity, pressure, and 
                weather systems.
              </p>
            </div>
          </section>

          {/* Developer Settings */}
          <section className="preferences-section">
            <h3>Developer Settings</h3>
            
            <div className="preference-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={state.debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                />
                Enable Debug Mode
              </label>
              <p className="preference-description">
                Shows detailed meteorological data and debug panels for troubleshooting.
              </p>
            </div>
          </section>

          {/* Data Management */}
          <section className="preferences-section">
            <h3>Data Management</h3>
            
            <button
              className="btn btn-secondary"
              onClick={() => setShowDataManagement(!showDataManagement)}
            >
              {showDataManagement ? "Hide" : "Show"} Data Management Options
            </button>

            {showDataManagement && (
              <div className="data-management-section">
                <div className="preference-item">
                  <button className="btn btn-primary" onClick={exportData}>
                    Export All Data
                  </button>
                  <p className="preference-description">
                    Download a backup of all your worlds, regions, and settings.
                  </p>
                </div>

                <div className="preference-item">
                  <label htmlFor="import-data" className="btn btn-secondary">
                    Import Data
                  </label>
                  <input
                    type="file"
                    id="import-data"
                    accept=".json"
                    onChange={importData}
                    style={{ display: 'none' }}
                  />
                  <p className="preference-description">
                    Restore data from a previously exported backup file.
                  </p>
                </div>

                <div className="preference-item danger-zone">
                  <h4>⚠️ Danger Zone</h4>
                  <div className="nuclear-option">
                    <input
                      type="text"
                      placeholder="Type 'CLEAR ALL DATA' to confirm"
                      value={nuclearConfirmText}
                      onChange={(e) => setNuclearConfirmText(e.target.value)}
                      className="nuclear-input"
                    />
                    <button
                      className="btn btn-danger"
                      onClick={handleNuclearOption}
                      disabled={nuclearConfirmText !== "CLEAR ALL DATA"}
                    >
                      Clear All Data
                    </button>
                  </div>
                  <p className="preference-description">
                    This will permanently delete all worlds, regions, weather data, and settings. This action cannot be undone.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* About Section */}
          <section className="preferences-section">
            <h3>About</h3>
            <div className="about-info">
              <p><strong>Skymaster: The GM's Weather Oracle</strong></p>
              <p>A comprehensive weather generation tool for tabletop RPG game masters.</p>
              <p>Version 1.0 - Meteorological Weather System</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PreferencesMenu;
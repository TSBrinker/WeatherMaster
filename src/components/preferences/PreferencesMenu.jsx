// src/components/preferences/PreferencesMenu.jsx
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
  const [showWeatherExplanation, setShowWeatherExplanation] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  
  // New preference states (these would need to be added to PreferencesContext)
  // const [temperatureUnit, setTemperatureUnit] = useState('fahrenheit');
  // const [timeFormat, setTimeFormat] = useState('12hour');
  // const [windSpeedUnit, setWindSpeedUnit] = useState('mph');
  // const [showFeelsLike, setShowFeelsLike] = useState(true);

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
    link.download = `weathermaster-backup-${new Date().toISOString().split('T')[0]}.json`;
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

  // Nuclear reset handlers
  const handleNuclearReset = () => {
    setShowNuclearConfirm(true);
  };

  const confirmNuclearReset = () => {
    if (nuclearConfirmText.toLowerCase() === "yes") {
      localStorage.clear();
      alert("All data has been cleared. The app will now reload.");
      window.location.reload();
    } else {
      alert("Confirmation text doesn't match. Reset canceled.");
      setShowNuclearConfirm(false);
      setNuclearConfirmText("");
    }
  };

  const cancelNuclearReset = () => {
    setShowNuclearConfirm(false);
    setNuclearConfirmText("");
  };

  if (!state.isOpen) return null;

  return (
    <div className="preferences-overlay" onClick={handleModalClick}>
      <div className="preferences-modal">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Settings</h2>
          
          <button
            onClick={togglePreferencesMenu}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
          
        </div>
        

        <div className="p-4">
          {/* Display Preferences */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Display Preferences</h3>
            
            <div className="space-y-3">
              <div className="bg-surface-light p-3 rounded">
                <div className="flex items-center justify-between">
                  <label htmlFor="temperatureUnit" className="font-medium">Temperature Unit</label>
                  <select
                    id="temperatureUnit"
                    value={state.temperatureUnit}
                    onChange={(e) => setTemperatureUnit(e.target.value)}
                    className="p-2 rounded bg-surface text-white border border-border"
                  >
                    <option value="fahrenheit">Fahrenheit (°F)</option>
                    <option value="celsius">Celsius (°C)</option>
                    {/* <option value="both">Both (°F/°C)</option> */}
                  </select>
                </div>
              </div>

              <div className="bg-surface-light p-3 rounded">
                <div className="flex items-center justify-between">
                  <label htmlFor="windSpeedUnit" className="font-medium">Wind Speed Unit</label>
                  <select
                    id="windSpeedUnit"
                    value={state.windSpeedUnit}
                    onChange={(e) => setWindSpeedUnit(e.target.value)}
                    className="p-2 rounded bg-surface text-white border border-border"
                  >
                    <option value="mph">Miles per hour (mph)</option>
                    <option value="kph">Kilometers per hour (kph)</option>
                    <option value="knots">Knots</option>
                  </select>
                </div>
              </div>

              <div className="bg-surface-light p-3 rounded">
                <div className="flex items-center justify-between">
                  <label htmlFor="timeFormat" className="font-medium">Time Format</label>
                  <select
                    id="timeFormat"
                    value={state.timeFormat}
                    onChange={(e) => setTimeFormat(e.target.value)}
                    className="p-2 rounded bg-surface text-white border border-border"
                  >
                    <option value="12hour">12-hour (AM/PM)</option>
                    <option value="24hour">24-hour</option>
                  </select>
                </div>
              </div>

              <div className="bg-surface-light p-3 rounded">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showFeelsLike"
                    checked={state.showFeelsLike}
                    onChange={(e) => setShowFeelsLike(e.target.checked)}
                    className="mr-3"
                  />
                  <label htmlFor="showFeelsLike" className="font-medium">
                    Show "Feels Like" Temperature
                  </label>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Display wind chill and heat index effects
                </p>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="mb-6">
            <button
              className="btn text-left w-full flex justify-between items-center py-3 px-4 bg-surface-light rounded hover:bg-opacity-80 transition-colors"
              onClick={() => setShowDataManagement(!showDataManagement)}
            >
              <span className="font-semibold">Data Management</span>
              <span className="text-gray-400">{showDataManagement ? "▲" : "▼"}</span>
            </button>

            {showDataManagement && (
              <div className="mt-2 p-4 bg-surface rounded space-y-3">
                <div>
                  <h4 className="font-semibold text-accent mb-2">Backup Your Data</h4>
                  <p className="text-sm text-gray-300 mb-2">
                    Export all your worlds, regions, and settings to a file.
                  </p>
                  <button
                    onClick={exportData}
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                  >
                    Export Data
                  </button>
                </div>
                
                <div>
                  <h4 className="font-semibold text-accent mb-2">Restore From Backup</h4>
                  <p className="text-sm text-gray-300 mb-2">
                    Import a previously exported backup file.
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                </div>

                <div className="pt-3 border-t border-gray-700">
                  <h4 className="font-semibold text-danger mb-2">Reset All Data</h4>
                  <p className="text-sm text-gray-300 mb-2">
                    Permanently delete all worlds, regions, and settings.
                  </p>
                  {!showNuclearConfirm ? (
                    <button
                      onClick={handleNuclearReset}
                      className="bg-danger text-white py-2 px-4 rounded hover:bg-opacity-90"
                    >
                      Reset Everything
                    </button>
                  ) : (
                    <div className="nuclear-confirm p-3 bg-surface-dark rounded border border-danger">
                      <p className="text-sm text-gray-200 mb-2">
                        Type "yes" to confirm deletion:
                      </p>
                      <input
                        type="text"
                        value={nuclearConfirmText}
                        onChange={(e) => setNuclearConfirmText(e.target.value)}
                        className="w-full p-2 mb-3 rounded bg-surface text-white border border-danger"
                        placeholder="Type 'yes' to confirm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={cancelNuclearReset}
                          className="bg-surface-light text-white py-1 px-3 rounded hover:bg-opacity-90"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmNuclearReset}
                          className="bg-danger text-white py-1 px-3 rounded hover:bg-opacity-90"
                          disabled={nuclearConfirmText.toLowerCase() !== "yes"}
                        >
                          Confirm Reset
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Developer Options */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Developer Options</h3>
            <div className="bg-surface-light p-3 rounded">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="debugMode"
                  checked={state.debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                  className="mr-3"
                />
                <label htmlFor="debugMode" className="font-medium">
                  Debug Mode
                </label>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Show meteorological parameters and system diagnostics
              </p>
            </div>
          </div>

          {/* How Weather Generation Works */}
          <div className="mb-4">
            <button
              className="btn text-left w-full flex justify-between items-center py-3 px-4 bg-surface-light rounded hover:bg-opacity-80 transition-colors"
              onClick={() => setShowWeatherExplanation(!showWeatherExplanation)}
            >
              <span className="font-semibold">How does weather generation work?</span>
              <span className="text-gray-400">{showWeatherExplanation ? "▲" : "▼"}</span>
            </button>

            {showWeatherExplanation && (
              <div className="mt-2 p-4 bg-surface rounded">
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold text-accent mb-1">Physics-Based Simulation</h4>
                    <p className="text-gray-300">
                      WeatherMaster uses a meteorological model that simulates real atmospheric physics. 
                      Weather patterns emerge from the interaction of temperature, pressure, humidity, 
                      and wind systems.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-accent mb-1">Key Components</h4>
                    <ul className="text-gray-300 space-y-1 ml-4">
                      <li><span className="text-gray-400">Temperature:</span> Calculated from solar radiation, elevation, and regional factors</li>
                      <li><span className="text-gray-400">Pressure Systems:</span> High/low pressure areas and fronts that move and evolve</li>
                      <li><span className="text-gray-400">Humidity:</span> Influenced by temperature, pressure, and recent precipitation</li>
                      <li><span className="text-gray-400">Wind:</span> Generated by pressure differentials and system movements</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-accent mb-1">Regional Factors</h4>
                    <p className="text-gray-300">
                      Each region's unique characteristics affect weather generation:
                    </p>
                    <ul className="text-gray-300 space-y-1 ml-4 mt-1">
                      <li>Latitude determines seasonal intensity and day length</li>
                      <li>Elevation affects temperature and precipitation</li>
                      <li>Maritime influence moderates temperature extremes</li>
                      <li>Special features like permafrost, forests, or geothermal activity</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-accent mb-1">Natural Progression</h4>
                    <p className="text-gray-300">
                      Weather evolves naturally over time. Storms build and dissipate, fronts move 
                      through regions, and conditions change based on the time of day and season. 
                      This creates realistic weather patterns perfect for immersive gameplay.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
};

export default PreferencesMenu;
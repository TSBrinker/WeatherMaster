// components/weather/WeatherControlPanel.jsx
import React from "react";
import useWeather from "../../hooks/useWeather";
import useWorld from "../../hooks/useWorld";
import useWeatherIntegration from "../../hooks/useWeatherIntegration";
import { mapBiomeToClimate } from "../../utils/weatherUtils";

const WeatherControlPanel = () => {
  const {
    biome,
    season,
    currentDate,
    setBiome,
    setSeason,
    applySettings,
    getCurrentSeason,
  } = useWeather();

  const { activeRegion } = useWeatherIntegration();

  // Format date for display
  const formattedDate = currentDate.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Current season if auto-selected
  const currentSeason = season === "auto" ? getCurrentSeason() : null;

  // Handler for biome change
  const handleBiomeChange = (e) => {
    setBiome(e.target.value);
  };

  // Handler for season change
  const handleSeasonChange = (e) => {
    setSeason(e.target.value);
  };

  // Handler for applying settings
  const handleApplySettings = () => {
    applySettings();
  };

  // Get climate display name
  const getClimateDisplayName = (climate) => {
    const climateMap = {
      "temperate-deciduous": "Temperate Forest",
      "temperate-grassland": "Plains/Grassland",
      desert: "Desert",
      tundra: "Arctic/Tundra",
      "tropical-rainforest": "Tropical Rainforest",
      "tropical-seasonal": "Tropical Seasonal/Swamp",
      "temperate-rainforest": "Coastal Rainforest",
      "boreal-forest": "Boreal/Mountain Forest",
    };

    return climateMap[climate] || climate;
  };

  // Get region climate if available
  const getRegionClimateName = () => {
    if (!activeRegion || !activeRegion.climate) return null;

    return getClimateDisplayName(activeRegion.climate);
  };

  return (
    <div className="weather-control-panel card">
      <h3 className="card-title">Weather Settings</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="form-group">
          <label htmlFor="biome-select" className="form-label">
            Biome:
          </label>
          <select
            id="biome-select"
            className="form-select"
            value={biome}
            onChange={handleBiomeChange}
          >
            <option value="temperate">Temperate</option>
            <option value="desert">Desert</option>
            <option value="arctic">Arctic</option>
            <option value="tropical">Tropical</option>
            <option value="coastal">Coastal</option>
            <option value="mountain">Mountain</option>
            <option value="forest">Forest</option>
            <option value="swamp">Swamp</option>
          </select>

          {getRegionClimateName() && (
            <div className="text-xs text-gray-400 mt-1">
              Region Climate: {getRegionClimateName()}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="season-select" className="form-label">
            Season:
          </label>
          <select
            id="season-select"
            className="form-select"
            value={season}
            onChange={handleSeasonChange}
          >
            <option value="auto">Auto (from date)</option>
            <option value="winter">Winter</option>
            <option value="spring">Spring</option>
            <option value="summer">Summer</option>
            <option value="fall">Fall</option>
          </select>

          {season === "auto" && currentSeason && (
            <div className="text-xs text-gray-400 mt-1">
              Current Season: {currentSeason}
            </div>
          )}
        </div>

        <div className="form-group flex items-end">
          <button
            className="btn btn-primary w-full"
            onClick={handleApplySettings}
          >
            Apply Settings
          </button>
        </div>
      </div>

      <div className="current-date text-center">
        <div className="text-sm text-gray-400">Current Date:</div>
        <div className="font-semibold">{formattedDate}</div>
      </div>
    </div>
  );
};

export default WeatherControlPanel;

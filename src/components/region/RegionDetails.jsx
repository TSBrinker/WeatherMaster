// src/components/region/RegionDetails.jsx - Fixed
import React, { useState, useEffect } from "react";
import { usePreferences } from "../../contexts/PreferencesContext";
import MeteorologicalDebugPanel from "../debug/MeteorologicalDebugPanel";
import { getTemplatesForLatitudeBand } from "../../data-tables/region-templates";
import RegionDebug from "../debug/RegionDebug";

const RegionDetails = ({
  region,
  celestialInfo,
  currentSeason,
  season,
  setSeason,
  onRegenerateWeather,
  weatherSystemType,
  onChangeWeatherSystem,
  showDebug,
  setShowDebug,
  currentWeather,
}) => {
  const { state: preferences } = usePreferences();

  if (!region) return null;

  const [showCelestialInfo, setShowCelestialInfo] = useState(false);
  const [showTemplateInfo, setShowTemplateInfo] = useState(true);
  const [templateData, setTemplateData] = useState(null);

  // Fetch template data when component mounts or region changes
  useEffect(() => {
    const fetchTemplateData = () => {
      // Skip if no region or template info
      if (!region) return;

      // Determine if region has template info and get template ID
      let templateId = null;
      let latitudeBand = null;

      // Check for template in profile.template
      if (region.profile && region.profile.template) {
        return setTemplateData(region.profile.template);
      }

      // Check for template in templateInfo
      if (region.templateInfo && region.templateInfo.templateId) {
        templateId = region.templateInfo.templateId;
        latitudeBand = region.templateInfo.latitudeBand;
      }
      // Check for template ID directly (added in new version)
      else if (region.templateId) {
        templateId = region.templateId;
        latitudeBand = getLatitudeBand();
      }

      // If we found a template ID and latitude band, fetch the template data
      if (templateId && latitudeBand) {
        const templatesForBand = getTemplatesForLatitudeBand(latitudeBand);
        if (templatesForBand && templatesForBand[templateId]) {
          setTemplateData(templatesForBand[templateId]);
        }
      } else {
        setTemplateData(null);
      }
    };

    fetchTemplateData();
  }, [region]);

  // Display weather system info from global preferences
  const renderWeatherSystemInfo = () => {
    return (
      <div className="mt-4 p-3 bg-surface-light rounded">
        <h3 className="font-semibold mb-2">Weather Generation System</h3>
        <div className="text-gray-300">
          Using{" "}
          {preferences.weatherSystem === "meteorological"
            ? "Advanced (Meteorological)"
            : "Basic (Dice Tables)"}{" "}
          system for all regions
        </div>
        <div className="text-sm text-gray-400 mt-1">
          Change the weather system in App Preferences (gear icon)
        </div>
      </div>
    );
  };

  // Handle the updated region structure
  const getBiome = () => {
    // Check if we have profile.biome first (new structure)
    if (region.profile && region.profile.biome) {
      return region.profile.biome.replace("-", " ");
    }
    // Fall back to climate (old structure)
    if (region.climate) {
      return region.climate.replace("-", " ");
    }
    // Fallback if neither exists
    return "unknown";
  };

  const getLatitudeBand = () => {
    // Check if we have profile.latitudeBand first (new structure)
    if (region.profile && region.profile.latitudeBand) {
      return region.profile.latitudeBand;
    }
    // Fall back to direct latitudeBand (old structure)
    return region.latitudeBand || "temperate";
  };

  // Check if the region has template info
  const hasTemplateInfo = () => {
    return (
      // Check for template object from useEffect
      templateData !== null ||
      // Check for template in templateInfo property
      (region.templateInfo && region.templateInfo.templateId) ||
      // Check for direct templateId
      region.templateId ||
      // Check for template in profile (direct path)
      (region.profile &&
        region.profile.template &&
        region.profile.template.name)
    );
  };

  // Get template ID for display
  const getTemplateId = () => {
    if (region.templateInfo && region.templateInfo.templateId) {
      return region.templateInfo.templateId;
    }
    if (region.templateId) {
      return region.templateId;
    }
    if (region.profile && region.profile.templateId) {
      return region.profile.templateId;
    }
    return null;
  };

  // Get a human-readable description of the latitude band
  const getLatitudeBandDescription = (band) => {
    const descriptions = {
      equatorial: "Equatorial (0° - 10°)",
      tropical: "Tropical (10° - 30°)",
      temperate: "Temperate (30° - 60°)",
      subarctic: "Subarctic (60° - 75°)",
      polar: "Polar (75° - 90°)",
    };
    return descriptions[band] || band;
  };

  // Get the latitude value used for calculations
  const getLatitudeValue = (band) => {
    const values = {
      equatorial: 5,
      tropical: 20,
      temperate: 45,
      subarctic: 65,
      polar: 80,
    };
    return values[band] || 45;
  };

  return (
    <div className="region-details-section">
      <RegionDebug region={region} />
      <div className="card p-4">
        <h2 className="text-xl font-semibold mb-4">Region Details</h2>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <span className="text-gray-400">Fallback Biome:</span> {getBiome()}
          </div>
          <div>
            <span className="text-gray-400">Season:</span> {currentSeason}
          </div>
          <div className="col-span-2">
            <span className="text-gray-400">Latitude Band:</span>{" "}
            {getLatitudeBandDescription(getLatitudeBand())}
            <div className="text-xs text-gray-500 mt-1">
              Calculated as {getLatitudeValue(getLatitudeBand())}° latitude
            </div>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400">Daylight:</span>{" "}
            {celestialInfo.dayLengthFormatted || "N/A"}
            {getLatitudeBand() === "polar" && (
              <div className="text-xs text-green-400 mt-1">
                Polar regions experience extended daylight in summer and
                darkness in winter
              </div>
            )}
          </div>
        </div>

        {/* Template Info Section (if available) */}
        {hasTemplateInfo() && (
          <div className="mt-4">
            <button
              className="text-left w-full flex justify-between items-center py-2 px-4 bg-accent bg-opacity-20 rounded"
              onClick={() => setShowTemplateInfo(!showTemplateInfo)}
            >
              <span className="font-semibold">
                Template: {templateData ? templateData.name : getTemplateId()}
              </span>
              <span>{showTemplateInfo ? "▲" : "▼"}</span>
            </button>

            {showTemplateInfo && (
              <div className="mt-2 p-3 bg-surface rounded border border-accent border-opacity-50">
                {templateData ? (
                  <>
                    {templateData.description && (
                      <div className="mb-3">
                        <p className="text-sm">{templateData.description}</p>
                      </div>
                    )}

                    {templateData.gameplayImpact && (
                      <div>
                        <h4 className="text-sm font-semibold text-accent mb-1">
                          Gameplay Impact:
                        </h4>
                        <p className="text-sm text-gray-300">
                          {templateData.gameplayImpact}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <p className="text-sm text-gray-400">
                      Template information for "{getTemplateId()}" could not be
                      loaded from the templates database.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collapsible Celestial Info */}
        <div className="mt-4">
          <button
            className="text-left w-full flex justify-between items-center py-2 px-4 bg-surface-light rounded"
            onClick={() => setShowCelestialInfo(!showCelestialInfo)}
          >
            <span>Celestial Information</span>
            <span>{showCelestialInfo ? "▲" : "▼"}</span>
          </button>

          {showCelestialInfo && (
            <div className="mt-2 p-3 bg-surface rounded">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400">Sunrise:</span>{" "}
                  {celestialInfo.sunriseTime || "N/A"}
                </div>
                <div>
                  <span className="text-gray-400">Sunset:</span>{" "}
                  {celestialInfo.sunsetTime || "N/A"}
                </div>
                <div>
                  <span className="text-gray-400">Moonrise:</span>{" "}
                  {celestialInfo.moonriseTime || "N/A"}
                </div>
                <div>
                  <span className="text-gray-400">Moonset:</span>{" "}
                  {celestialInfo.moonsetTime || "N/A"}
                </div>
              </div>

              {getLatitudeBand() === "polar" && (
                <div className="mt-3 p-2 bg-gray-800 rounded text-xs">
                  <div className="font-semibold mb-1">Polar Regions:</div>
                  <p>
                    Near the summer solstice (June 21), polar regions experience
                    24 hours of daylight.
                  </p>
                  <p className="mt-1">
                    Near the winter solstice (December 21), polar regions
                    experience 24 hours of darkness.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Weather System Info (from global preferences) */}
        {renderWeatherSystemInfo()}

        {/* Debug Panel - Only shown if debug mode is enabled */}
        {preferences.debugMode && currentWeather && (
          <div className="mt-4">
            <MeteorologicalDebugPanel
              weatherData={currentWeather}
              region={region}
              weatherService={null}
            />
          </div>
        )}

        <button
          onClick={onRegenerateWeather}
          className="btn btn-primary mt-4 w-full"
        >
          Regenerate Weather
        </button>
      </div>
    </div>
  );
};
export default RegionDetails;

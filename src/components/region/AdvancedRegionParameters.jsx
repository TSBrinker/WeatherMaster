// src/components/region/AdvancedRegionParameters.jsx
import React, { useState } from "react";

/**
 * Component for advanced region parameter editing
 * Provides sliders and controls for fine-tuning meteorological parameters
 */
const AdvancedRegionParameters = ({
  parameters,
  onChange,
  isExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(isExpanded);

  // Handle parameter change
  const handleParameterChange = (name, value) => {
    onChange({
      ...parameters,
      [name]: value,
    });
  };

  // Handle special factor toggle
  const handleSpecialFactorToggle = (factor) => {
    const currentFactors = parameters.specialFactors || {};
    const updatedFactors = {
      ...currentFactors,
      [factor]: !currentFactors[factor],
    };

    onChange({
      ...parameters,
      specialFactors: updatedFactors,
    });
  };

  // Helper to render parameter with tooltip
  const renderParameter = (
    name,
    label,
    description,
    min,
    max,
    step = 0.1,
    unit = ""
  ) => (
    <div className="parameter-control mb-4">
      <div className="parameter-header flex justify-between items-center mb-1">
        <label htmlFor={name} className="font-semibold">
          {label}
        </label>
        <div className="parameter-tooltip relative group">
          <span className="tooltip-icon cursor-help bg-surface-light px-2 py-0.5 rounded-full text-xs">
            ?
          </span>
          <div className="tooltip-content hidden group-hover:block absolute right-0 top-6 bg-surface-light p-2 rounded shadow-lg z-10 w-64 text-sm">
            {description}
          </div>
        </div>
      </div>

      <div className="parameter-input flex items-center gap-4">
        <input
          type="range"
          id={name}
          name={name}
          min={min}
          max={max}
          step={step}
          value={parameters[name] || min}
          onChange={(e) =>
            handleParameterChange(name, parseFloat(e.target.value))
          }
          className="flex-1"
        />
        <span className="parameter-value text-sm min-w-[4rem] text-right">
          {(parameters[name] || min).toFixed(
            String(step).split(".")[1]?.length || 0
          )}
          {unit && <span className="ml-1">{unit}</span>}
        </span>
      </div>
    </div>
  );

  // Helper to render special factor toggles
  const renderSpecialFactor = (factor, label, description) => {
    const isActive =
      parameters.specialFactors && parameters.specialFactors[factor];

    return (
      <div className="special-factor-control mb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`factor-${factor}`}
              checked={!!isActive}
              onChange={() => handleSpecialFactorToggle(factor)}
              className="mr-2"
            />
            <label htmlFor={`factor-${factor}`} className="cursor-pointer">
              {label}
            </label>
          </div>
          <div className="parameter-tooltip relative group">
            <span className="tooltip-icon cursor-help bg-surface-light px-2 py-0.5 rounded-full text-xs">
              ?
            </span>
            <div className="tooltip-content hidden group-hover:block absolute right-0 top-6 bg-surface-light p-2 rounded shadow-lg z-10 w-64 text-sm">
              {description}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Toggle expansion of parameters panel
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Generate natural language region summary
  const generateRegionSummary = () => {
    if (!parameters) return "Configure parameters to see region description.";

    // Latitude description
    let latitudeDesc = "temperate";
    if (parameters.latitude <= 10) latitudeDesc = "equatorial";
    else if (parameters.latitude <= 30) latitudeDesc = "tropical";
    else if (parameters.latitude <= 60) latitudeDesc = "temperate";
    else if (parameters.latitude <= 75) latitudeDesc = "subarctic";
    else latitudeDesc = "polar";

    // Elevation description
    let elevationDesc = "low-elevation";
    if (parameters.elevation >= 5000) elevationDesc = "high mountain";
    else if (parameters.elevation >= 3000) elevationDesc = "mountainous";
    else if (parameters.elevation >= 1500) elevationDesc = "high-elevation";
    else if (parameters.elevation >= 500) elevationDesc = "hilly";
    else elevationDesc = "low-elevation";

    // Maritime influence
    let maritimeDesc = "";
    if (parameters.maritimeInfluence >= 0.8)
      maritimeDesc = "with strong coastal influence";
    else if (parameters.maritimeInfluence >= 0.5)
      maritimeDesc = "with moderate maritime influence";
    else if (parameters.maritimeInfluence >= 0.2)
      maritimeDesc = "with slight maritime influence";
    else maritimeDesc = "with continental (inland) climate";

    // Terrain effect
    let terrainDesc = "";
    if (parameters.terrainRoughness >= 0.8)
      terrainDesc = " and varied, rugged terrain";
    else if (parameters.terrainRoughness >= 0.5)
      terrainDesc = " and hilly, variable terrain";
    else if (parameters.terrainRoughness >= 0.3)
      terrainDesc = " and gently rolling terrain";
    else terrainDesc = " and predominantly flat terrain";

    // Special factors
    let specialDesc = "";
    const factors = parameters.specialFactors || {};

    if (factors.hasMonsoonSeason)
      specialDesc += " This region experiences a strong monsoon season.";
    if (factors.highRainfall)
      specialDesc += " Precipitation is abundant throughout the year.";
    if (factors.hasDrySeason)
      specialDesc += " There is a pronounced dry season.";
    if (factors.polarDay)
      specialDesc += " Summer brings extended daylight periods.";
    if (factors.polarNight) specialDesc += " Winter brings extended darkness.";
    if (factors.hasFog) specialDesc += " Fog is common in this region.";

    // Put it all together
    return `A ${elevationDesc} ${latitudeDesc} region ${maritimeDesc}${terrainDesc}.${specialDesc}`;
  };

  // Create weather prediction based on parameters
  const generateWeatherPrediction = () => {
    if (!parameters) return "";

    const seasonalVariation = parameters.latitude / 90; // Higher latitude = more seasonal variation

    // Temperature description
    let tempDesc = "";
    if (parameters.latitude <= 20) {
      tempDesc = "Consistently warm temperatures throughout the year";
    } else if (parameters.maritimeInfluence >= 0.7) {
      tempDesc = "Moderate temperatures with limited seasonal variation";
    } else if (parameters.latitude >= 60) {
      tempDesc = "Very cold winters and short, cool summers";
    } else {
      tempDesc = "Distinct seasonal temperature changes";
    }

    // Precipitation prediction
    let precipDesc = "";
    if (parameters.maritimeInfluence >= 0.7 && parameters.latitude < 40) {
      precipDesc = " and high humidity with frequent rainfall";
    } else if (parameters.maritimeInfluence >= 0.7) {
      precipDesc = " and regular precipitation throughout the year";
    } else if (
      parameters.maritimeInfluence <= 0.2 &&
      parameters.elevation >= 3000
    ) {
      precipDesc = " and generally dry conditions with sporadic precipitation";
    } else if (parameters.maritimeInfluence <= 0.3) {
      precipDesc = " and limited precipitation, especially in summer";
    } else {
      precipDesc = " and moderate, seasonal precipitation patterns";
    }

    // Wind description
    let windDesc = "";
    if (parameters.terrainRoughness <= 0.3) {
      windDesc = " This flat terrain allows winds to travel unimpeded.";
    } else if (parameters.terrainRoughness >= 0.7) {
      windDesc = " The rugged terrain creates complex wind patterns.";
    }

    return tempDesc + precipDesc + "." + windDesc;
  };

  return (
    <div className="advanced-parameters bg-surface rounded mb-4">
      {/* Header with toggle */}
      <div
        className="header p-3 border-b border-border flex justify-between items-center cursor-pointer"
        onClick={toggleExpanded}
      >
        <h3 className="font-semibold">Advanced Meteorological Parameters</h3>
        <span>{expanded ? "▼" : "▲"}</span>
      </div>

      {/* Parameters section (collapsible) */}
      {expanded && (
        <div className="parameters p-4">
          <p className="text-sm text-gray-400 mb-4">
            Fine-tune the meteorological parameters for more precise weather
            generation. These settings control the physical characteristics of
            your region.
          </p>

          <div className="parameters-grid">
            <h4 className="font-semibold mb-2">Geographic Parameters</h4>

            {renderParameter(
              "latitude",
              "Latitude",
              "Distance from equator in degrees. Higher values mean greater seasonal variation and shorter summer days/longer winter nights.",
              0,
              90,
              5,
              "°"
            )}

            {renderParameter(
              "elevation",
              "Elevation",
              "Height above sea level in feet. Higher elevations have cooler temperatures, with approximately -3.5°F per 1000ft.",
              0,
              10000,
              500,
              "ft"
            )}

            {renderParameter(
              "maritimeInfluence",
              "Maritime Influence",
              "How much oceans affect the climate. Higher values mean more moderate temperatures, less variation between seasons, and often more precipitation.",
              0,
              1,
              0.1
            )}

            {renderParameter(
              "terrainRoughness",
              "Terrain Roughness",
              "How mountainous or variable the terrain is. Affects wind patterns, precipitation distribution, and can create microclimates.",
              0,
              1,
              0.1
            )}

            <h4 className="font-semibold mt-6 mb-2">Weather Tendencies</h4>

            {renderParameter(
              "stormFrequency",
              "Storm Frequency",
              "How often storms form in this region. Higher values mean more frequent low pressure systems and potential precipitation events.",
              0,
              1,
              0.1
            )}

            {renderParameter(
              "stormIntensity",
              "Storm Intensity",
              "How powerful storms typically are when they form. Higher values mean stronger winds, heavier precipitation, and more dramatic weather changes.",
              0,
              1,
              0.1
            )}

            {renderParameter(
              "seasonalExtremes",
              "Seasonal Extremes",
              "How pronounced the difference is between seasons. Higher values mean bigger temperature swings between summer and winter.",
              0,
              1,
              0.1
            )}

            <h4 className="font-semibold mt-6 mb-2">Special Factors</h4>

            <div className="special-factors">
              {renderSpecialFactor(
                "hasMonsoonSeason",
                "Monsoon Season",
                "Region experiences a distinct period of heavy rainfall due to seasonal wind shifts."
              )}

              {renderSpecialFactor(
                "hasDrySeason",
                "Dry Season",
                "Region has a pronounced period with little to no rainfall."
              )}

              {renderSpecialFactor(
                "highRainfall",
                "High Rainfall",
                "Region receives abundant precipitation throughout the year."
              )}

              {renderSpecialFactor(
                "polarDay",
                "Midnight Sun",
                "Region experiences periods where the sun remains visible for 24 hours (high latitudes only)."
              )}

              {renderSpecialFactor(
                "polarNight",
                "Polar Night",
                "Region experiences periods of extended darkness (high latitudes only)."
              )}

              {renderSpecialFactor(
                "hasFog",
                "Frequent Fog",
                "Region commonly experiences fog formation, typically in coastal or valley areas."
              )}

              {renderSpecialFactor(
                "highDiurnalVariation",
                "High Temperature Swings",
                "Region experiences large temperature differences between day and night."
              )}

              {renderSpecialFactor(
                "isValley",
                "Valley Location",
                "Region is in a valley between mountains, affecting wind patterns and temperature."
              )}

              {renderSpecialFactor(
                "hasOrographicEffect",
                "Orographic Effect",
                "Region experiences enhanced precipitation on the windward side of mountains."
              )}

              {renderSpecialFactor(
                "tectonicActivity",
                "Tectonic Activity",
                "Region has significant tectonic activity, with potential for earthquakes."
              )}

              {renderSpecialFactor(
                "volcanicActivity",
                "Volcanic Activity",
                "Region has volcanic features that may occasionally become active."
              )}
            </div>
          </div>

          <div className="region-profile-summary mt-6 p-4 bg-surface-light rounded">
            <h4 className="font-semibold mb-2">Region Profile Summary</h4>
            <p className="mb-3">{generateRegionSummary()}</p>
            <p>{generateWeatherPrediction()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedRegionParameters;

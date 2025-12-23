import React, { useState } from 'react';
import './WeatherDebug.css';

/**
 * Toggle between main app and test harness
 */
const toggleTestMode = () => {
  const currentUrl = new URL(window.location.href);
  const isCurrentlyTest = currentUrl.searchParams.get('test') === 'true';

  if (isCurrentlyTest) {
    currentUrl.searchParams.delete('test');
  } else {
    currentUrl.searchParams.set('test', 'true');
  }

  window.location.href = currentUrl.toString();
};

/**
 * Debug console showing expected vs actual temperature values
 * Helps verify weather generation is working correctly
 */
const WeatherDebug = ({ weatherData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!weatherData || !weatherData._debug || !weatherData._debug.temperatureBreakdown) {
    return null;
  }

  const debug = weatherData._debug;
  const tempDebug = debug.temperatureBreakdown;

  return (
    <div className="weather-debug">
      <div className="weather-debug-header">
        <button
          className="weather-debug-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'} Debug Console
        </button>
        <button
          className="weather-debug-test-toggle"
          onClick={toggleTestMode}
          title="Open Test Harness"
        >
          🧪 Test Harness
        </button>
      </div>

      {isExpanded && (
        <div className="weather-debug-content">
          <div className="debug-section">
            <h5>Weather Pattern</h5>
            <div className="debug-grid">
              <div className="debug-item">
                <span className="debug-label">Current Pattern:</span>
                <span className="debug-value">{weatherData.pattern}</span>
              </div>
              <div className="debug-item">
                <span className="debug-label">Pattern Day:</span>
                <span className="debug-value">Day {debug.dayOfPattern || '?'}</span>
              </div>
            </div>
          </div>

          <h5 className="mt-3">Temperature Analysis</h5>
          <div className="debug-grid">
            <div className="debug-item">
              <span className="debug-label">Current Season:</span>
              <span className="debug-value">{tempDebug.season}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Expected Mean:</span>
              <span className="debug-value">{tempDebug.expectedSeasonMean}°F</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Expected Range:</span>
              <span className="debug-value">{tempDebug.expectedSeasonRange}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Seasonal Base Temp:</span>
              <span className="debug-value">{tempDebug.seasonalBase}°F</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Daily Variation:</span>
              <span className="debug-value">{tempDebug.dailyVariation > 0 ? '+' : ''}{tempDebug.dailyVariation}°F</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Pattern Influence:</span>
              <span className="debug-value">{tempDebug.patternInfluence > 0 ? '+' : ''}{tempDebug.patternInfluence}°F</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Weather Pattern Mod:</span>
              <span className="debug-value">{debug.patternTempMod > 0 ? '+' : ''}{debug.patternTempMod}°F</span>
            </div>
            <div className="debug-item highlight">
              <span className="debug-label">Final Calculated:</span>
              <span className="debug-value">{Math.round(tempDebug.finalTemp + debug.patternTempMod)}°F</span>
            </div>
            <div className="debug-item highlight">
              <span className="debug-label">Actual Display:</span>
              <span className="debug-value">{weatherData.temperature}°F</span>
            </div>
          </div>

          <div className="debug-formula">
            <strong>Formula:</strong> {tempDebug.seasonalBase}°F (seasonal) + {tempDebug.dailyVariation}°F (time of day) + {tempDebug.patternInfluence}°F (temp pattern) + {debug.patternTempMod}°F (weather pattern) = {weatherData.temperature}°F
          </div>

          <h4>Weather Pattern</h4>
          <div className="debug-grid">
            <div className="debug-item">
              <span className="debug-label">Pattern Type:</span>
              <span className="debug-value">{weatherData.pattern}</span>
            </div>
            <div className="debug-item">
              <span className="debug-label">Day of Pattern:</span>
              <span className="debug-value">{debug.dayOfPattern}</span>
            </div>
          </div>

          {debug.atmospheric && (
            <>
              <h5 className="mt-3">Atmospheric Data</h5>
              <div className="debug-grid">
                <div className="debug-item">
                  <span className="debug-label">Pressure:</span>
                  <span className="debug-value">{weatherData.pressure}" {weatherData.pressureTrend}</span>
                </div>
                <div className="debug-item">
                  <span className="debug-label">Base Humidity:</span>
                  <span className="debug-value">{debug.atmospheric.baseHumidity}%</span>
                </div>
                <div className="debug-item">
                  <span className="debug-label">Enhanced Humidity:</span>
                  <span className="debug-value">{debug.atmospheric.enhancedHumidity}%</span>
                </div>
                <div className="debug-item">
                  <span className="debug-label">Cloud Cover:</span>
                  <span className="debug-value">{weatherData.cloudCover}% ({weatherData.cloudCoverType})</span>
                </div>
                <div className="debug-item">
                  <span className="debug-label">Visibility:</span>
                  <span className="debug-value">{weatherData.visibility} mi ({weatherData.visibilityDescription})</span>
                </div>
                <div className="debug-item">
                  <span className="debug-label">Atmospheric Feels-Like Contribution:</span>
                  <span className="debug-value">{debug.atmospheric.atmosphericFeelsLikeContribution > 0 ? '+' : ''}{debug.atmospheric.atmosphericFeelsLikeContribution}°F</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherDebug;

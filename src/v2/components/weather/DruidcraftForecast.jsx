import React, { useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import { GiSpellBook } from 'react-icons/gi';
import weatherService from '../../services/weather/WeatherService';
import './DruidcraftForecast.css';

/**
 * Druidcraft Cantrip - 24 Hour Weather Forecast
 * Shows period-based summary of next 24 hours
 */
const DruidcraftForecast = ({ region, currentDate, currentWeather }) => {
  const [showForecast, setShowForecast] = useState(false);
  const [forecast, setForecast] = useState(null);

  const castDruidcraft = () => {
    if (!region || !currentDate) return;

    // Generate 24-hour forecast
    const hourlyForecast = weatherService.getForecast(region, currentDate, 24);

    // Group into weather periods
    const periods = weatherService.groupIntoPeriods(hourlyForecast);

    setForecast({
      periods,
      pattern: currentWeather?.pattern || 'Unknown',
      warnings: currentWeather?.effects || []
    });

    setShowForecast(true);
  };

  const formatCondition = (condition, precipType) => {
    if (precipType) {
      return `${condition} (${precipType})`;
    }
    return condition;
  };

  const formatTempRange = (min, max) => {
    if (min === max) return `${min}°F`;
    return `${min}-${max}°F`;
  };

  return (
    <Card className="druidcraft-forecast mb-3">
      <Card.Body>
        <div className="section-label">
          <GiSpellBook /> Druidcraft Cantrip
        </div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="forecast-subtitle">24-Hour Prediction</div>
          <Button
            variant={showForecast ? "success" : "outline-success"}
            size="sm"
            onClick={castDruidcraft}
          >
            {showForecast ? "Cast Again" : "Cast Druidcraft"}
          </Button>
        </div>

        {showForecast && forecast && (
          <div className="forecast-content">
            <div className="current-weather mb-3">
              <strong>Current Conditions:</strong>{' '}
              {currentWeather?.condition || 'Unknown'}, {currentWeather?.temperature || '--'}°F
              {currentWeather?.feelsLike !== currentWeather?.temperature && (
                <span> (feels like {currentWeather?.feelsLike}°F)</span>
              )}
            </div>

            <div className="forecast-title mb-2">
              <strong>Next 24 Hours:</strong>
            </div>

            <div className="weather-periods">
              {forecast.periods.map((period, idx) => (
                <div key={idx} className="weather-period">
                  <span className="period-duration">{period.hours} {period.hours === 1 ? 'hr' : 'hrs'}</span>
                  <span className="period-separator">-</span>
                  <span className="period-condition">
                    {formatCondition(period.condition, period.precipitationType)}
                  </span>
                  <span className="period-separator">,</span>
                  <span className="period-temp">{formatTempRange(period.tempMin, period.tempMax)}</span>
                </div>
              ))}
            </div>

            <div className="pattern-info mt-3">
              <small>
                <strong>Pattern:</strong> {forecast.pattern}
              </small>
            </div>

            {forecast.warnings && forecast.warnings.length > 0 && (
              <div className="warnings mt-2 alert alert-warning p-2 mb-0">
                <strong>⚠ Warnings:</strong>
                <ul className="mb-0 mt-1">
                  {forecast.warnings.map((warning, idx) => (
                    <li key={idx}><small>{warning}</small></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="cantrip-note mt-2">
              <small className="text-muted">
                <em>You innately sense the natural patterns of wind, temperature, and precipitation in your immediate surroundings.</em>
              </small>
            </div>
          </div>
        )}

        {!showForecast && (
          <div className="text-muted">
            <small>
              <em>Cast Druidcraft to predict the weather for the next 24 hours at your current location.</em>
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default DruidcraftForecast;

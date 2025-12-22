import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { usePreferences } from '../../contexts/PreferencesContext';
import { formatTemperature, formatWindSpeed } from '../../utils/unitConversions';
import { getWeatherBackground, getTextColor, getWeatherIcon } from '../../utils/weatherTheme';
import './CurrentWeather.css';

/**
 * Current Weather Display - Hero Component
 * Large, beautiful weather card with dynamic backgrounds
 */
const CurrentWeather = ({ weather, celestial }) => {
  const { temperatureUnit, windSpeedUnit, showFeelsLike } = usePreferences();

  if (!weather) {
    return (
      <Card className="current-weather-card">
        <Card.Body>
          <p className="text-muted">No weather data available</p>
        </Card.Body>
      </Card>
    );
  }

  const {
    temperature,
    feelsLike,
    condition,
    windSpeed,
    windDirection,
    humidity,
    precipitation,
    precipitationType,
    precipitationIntensity
  } = weather;

  // Determine if it's daytime and twilight level
  const isDaytime = celestial?.twilightLevel === 'daylight';
  const twilightLevel = celestial?.twilightLevel !== 'daylight' && celestial?.twilightLevel !== 'night'
    ? celestial?.twilightLevel
    : 'none';

  // Get dynamic background and text color
  const backgroundGradient = getWeatherBackground(condition, twilightLevel, isDaytime);
  const textColorClass = getTextColor(condition, twilightLevel, isDaytime);
  const weatherIcon = getWeatherIcon(condition, isDaytime);

  return (
    <Card
      className={`current-weather-hero mb-3 text-${textColorClass}`}
      style={{ background: backgroundGradient }}
    >
      <Card.Body className="p-4">
        {/* Main temperature display */}
        <div className="text-center mb-4">
          <div className="weather-icon-large mb-2">
            {weatherIcon}
          </div>
          <div className="temperature-display">
            {formatTemperature(temperature, temperatureUnit)}
          </div>
          <div className="condition-display mb-2">
            {condition}
          </div>
          {showFeelsLike && feelsLike !== temperature && (
            <div className="feels-like-display">
              Feels like {formatTemperature(feelsLike, temperatureUnit)}
            </div>
          )}
        </div>

        {/* Key details in compact grid */}
        <Row className="weather-details g-3">
          <Col xs={6} md={3}>
            <div className="detail-item">
              <div className="detail-icon">💨</div>
              <div className="detail-label">Wind</div>
              <div className="detail-value">
                {formatWindSpeed(windSpeed, windSpeedUnit)} {windDirection}
              </div>
            </div>
          </Col>

          <Col xs={6} md={3}>
            <div className="detail-item">
              <div className="detail-icon">💧</div>
              <div className="detail-label">Humidity</div>
              <div className="detail-value">{humidity}%</div>
            </div>
          </Col>

          <Col xs={6} md={3}>
            <div className="detail-item">
              <div className="detail-icon">☀️</div>
              <div className="detail-label">Sunrise</div>
              <div className="detail-value">{celestial?.sunriseTime || '--'}</div>
            </div>
          </Col>

          <Col xs={6} md={3}>
            <div className="detail-item">
              <div className="detail-icon">🌙</div>
              <div className="detail-label">Sunset</div>
              <div className="detail-value">{celestial?.sunsetTime || '--'}</div>
            </div>
          </Col>
        </Row>

        {/* Precipitation info if active */}
        {precipitation && (
          <div className="precipitation-banner mt-3">
            <strong>💧 {precipitationIntensity} {precipitationType}</strong>
          </div>
        )}

        {/* Celestial compact info */}
        {celestial && (
          <div className="celestial-compact mt-3">
            <Row className="g-2">
              <Col xs={6}>
                <small>
                  <strong>Day Length:</strong> {celestial.dayLength || '--'}
                </small>
              </Col>
              <Col xs={6}>
                <small>
                  <strong>Moon:</strong> {celestial.moonPhase || '--'} {celestial.moonIcon || ''}
                </small>
              </Col>
            </Row>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default CurrentWeather;

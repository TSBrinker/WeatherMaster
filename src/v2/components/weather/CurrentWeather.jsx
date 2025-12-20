import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { usePreferences } from '../../contexts/PreferencesContext';
import { formatTemperature, formatWindSpeed } from '../../utils/unitConversions';

/**
 * Current Weather Display
 * Shows current temperature, condition, wind, and celestial info
 */
const CurrentWeather = ({ weather, celestial }) => {
  const { temperatureUnit, windSpeedUnit, showFeelsLike, debugMode } = usePreferences();

  if (!weather) {
    return (
      <Card>
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
    windDirection
  } = weather;

  // Get twilight badge color
  const getTwilightBadgeColor = (twilightLevel) => {
    switch (twilightLevel) {
      case 'daylight': return 'warning';
      case 'civil': return 'info';
      case 'nautical': return 'primary';
      case 'astronomical': return 'secondary';
      case 'night': return 'dark';
      default: return 'secondary';
    }
  };

  // Format twilight level for display
  const formatTwilight = (twilightLevel) => {
    if (!twilightLevel) return 'Unknown';
    if (twilightLevel === 'daylight') return 'Daylight';
    if (twilightLevel === 'night') return 'Night';
    return `${twilightLevel.charAt(0).toUpperCase() + twilightLevel.slice(1)} Twilight`;
  };

  return (
    <Card className="mb-3">
      <Card.Body>
        <Row>
          {/* Temperature Section */}
          <Col md={6} className="border-end">
            <div className="text-center">
              <h1 className="display-1 mb-0">
                {formatTemperature(temperature, temperatureUnit)}
              </h1>
              {showFeelsLike && feelsLike !== temperature && (
                <p className="text-muted">
                  Feels like {formatTemperature(feelsLike, temperatureUnit)}
                </p>
              )}
              <h4 className="mt-3">{condition}</h4>

              {/* Twilight State Badge */}
              {celestial?.twilightLevel && (
                <div className="mt-2">
                  <Badge bg={getTwilightBadgeColor(celestial.twilightLevel)}>
                    {formatTwilight(celestial.twilightLevel)}
                  </Badge>
                </div>
              )}
            </div>
          </Col>

          {/* Details Section */}
          <Col md={6}>
            <div className="mt-3 mt-md-0">
              <h5>Conditions</h5>
              <p className="mb-2">
                <strong>Wind:</strong> {formatWindSpeed(windSpeed, windSpeedUnit)} {windDirection}
              </p>

              {celestial && (
                <>
                  <hr />
                  <h5>Sun</h5>
                  {celestial.isPermanentNight ? (
                    <p className="text-muted">
                      <em>Disc center - no sunlight reaches this location</em>
                    </p>
                  ) : (
                    <>
                      <p className="mb-1">
                        <strong>Sunrise:</strong> {celestial.sunriseTime}
                      </p>
                      <p className="mb-1">
                        <strong>Sunset:</strong> {celestial.sunsetTime}
                      </p>
                      <p className="mb-1">
                        <strong>Day Length:</strong> {celestial.dayLength}
                      </p>
                    </>
                  )}

                  {debugMode && (
                    <p className="mb-0 small text-muted">
                      Distance to sun: {celestial.distanceToSun.toLocaleString()} mi
                    </p>
                  )}

                  <hr />
                  <h5>Moon</h5>
                  <p className="mb-1">
                    <strong>Phase:</strong> {celestial.moonIcon} {celestial.moonPhase}
                  </p>
                  <p className="mb-1">
                    <strong>Illumination:</strong> {celestial.moonIllumination}%
                    {celestial.isWaxing ? ' (Waxing)' : ' (Waning)'}
                  </p>
                  <p className="mb-1">
                    <strong>Moonrise:</strong> {celestial.moonriseTime}
                  </p>
                  <p className="mb-1">
                    <strong>Moonset:</strong> {celestial.moonsetTime}
                  </p>
                  <p className="mb-0">
                    <strong>Visible:</strong> {celestial.isMoonVisible ? 'Yes' : 'No'}
                  </p>

                  {debugMode && celestial.phaseAngle !== undefined && (
                    <p className="mb-0 small text-muted">
                      Phase angle: {celestial.phaseAngle}°
                    </p>
                  )}
                </>
              )}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default CurrentWeather;

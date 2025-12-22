import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { WiStrongWind, WiHumidity, WiRaindrop, WiBarometer, WiCloudy, WiFog } from 'react-icons/wi';
import { WiThermometer } from 'react-icons/wi';
import './ConditionsCard.css';

/**
 * ConditionsCard - Detailed weather conditions
 * Wind, Humidity, Precipitation separate from hero
 */
const ConditionsCard = ({ weather }) => {
  if (!weather) {
    return null;
  }

  return (
    <Card className="conditions-card mb-3">
      <Card.Body>
        <div className="section-label">
          <WiThermometer /> CONDITIONS
        </div>

        <Row className="g-3 mb-3">
          {/* Wind */}
          <Col xs={6} md={4}>
            <div className="condition-item">
              <div className="condition-icon"><WiStrongWind /></div>
              <div className="condition-label">WIND</div>
              <div className="condition-value">
                {weather.windSpeed || 0} mph
              </div>
              {weather.windDirection && (
                <div className="condition-detail">
                  {weather.windDirection}
                </div>
              )}
            </div>
          </Col>

          {/* Humidity */}
          <Col xs={6} md={4}>
            <div className="condition-item">
              <div className="condition-icon"><WiHumidity /></div>
              <div className="condition-label">HUMIDITY</div>
              <div className="condition-value">
                {weather.humidity || 0}%
              </div>
            </div>
          </Col>

          {/* Precipitation */}
          <Col xs={6} md={4}>
            <div className="condition-item">
              <div className="condition-icon"><WiRaindrop /></div>
              <div className="condition-label">PRECIP</div>
              <div className="condition-value">
                {weather.precipitation ? 'Yes' : 'No'}
              </div>
              {weather.precipitationType && (
                <div className="condition-detail">
                  {weather.precipitationType}
                </div>
              )}
            </div>
          </Col>

          {/* Pressure */}
          <Col xs={6} md={4}>
            <div className="condition-item">
              <div className="condition-icon"><WiBarometer /></div>
              <div className="condition-label">PRESSURE</div>
              <div className="condition-value">
                {weather.pressure ? `${weather.pressure}"` : 'N/A'}
              </div>
              {weather.pressureTrend && (
                <div className="condition-detail">
                  {weather.pressureTrend === 'rising' && '↑ Rising'}
                  {weather.pressureTrend === 'falling' && '↓ Falling'}
                  {weather.pressureTrend === 'steady' && '→ Steady'}
                </div>
              )}
            </div>
          </Col>

          {/* Cloud Cover */}
          <Col xs={6} md={4}>
            <div className="condition-item">
              <div className="condition-icon"><WiCloudy /></div>
              <div className="condition-label">CLOUDS</div>
              <div className="condition-value">
                {weather.cloudCover !== undefined ? `${weather.cloudCover}%` : 'N/A'}
              </div>
              {weather.cloudCoverType && (
                <div className="condition-detail">
                  {weather.cloudCoverType.replace('_', ' ')}
                </div>
              )}
            </div>
          </Col>

          {/* Visibility */}
          <Col xs={6} md={4}>
            <div className="condition-item">
              <div className="condition-icon"><WiFog /></div>
              <div className="condition-label">VISIBILITY</div>
              <div className="condition-value">
                {weather.visibility !== undefined ? `${weather.visibility} mi` : 'N/A'}
              </div>
              {weather.visibilityDescription && (
                <div className="condition-detail">
                  {weather.visibilityDescription}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default ConditionsCard;

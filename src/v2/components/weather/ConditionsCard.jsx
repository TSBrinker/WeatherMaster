import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { WiStrongWind, WiHumidity, WiRaindrop } from 'react-icons/wi';
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

        <Row className="g-3">
          {/* Wind */}
          <Col xs={4}>
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
          <Col xs={4}>
            <div className="condition-item">
              <div className="condition-icon"><WiHumidity /></div>
              <div className="condition-label">HUMIDITY</div>
              <div className="condition-value">
                {weather.humidity || 0}%
              </div>
            </div>
          </Col>

          {/* Precipitation */}
          <Col xs={4}>
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
        </Row>
      </Card.Body>
    </Card>
  );
};

export default ConditionsCard;

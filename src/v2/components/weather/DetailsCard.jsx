import React, { useState } from 'react';
import { Card, Row, Col, Collapse } from 'react-bootstrap';
import {
  WiHumidity, WiBarometer, WiCloudy, WiFog,
  WiSunrise, WiSunset, WiDaySunny, WiMoonrise, WiMoonset
} from 'react-icons/wi';
import { BsChevronDown, BsChevronUp } from 'react-icons/bs';
import './DetailsCard.css';

/**
 * DetailsCard - Combined Conditions and Celestial Info
 * Collapsed by default, shows:
 * - Conditions: humidity, pressure, clouds, visibility (wind moved to hero)
 * - Celestial: sunrise, sunset, daylight, moonrise, moonset (moon phase moved to header)
 */
const DetailsCard = ({ weather }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!weather) {
    return null;
  }

  const { celestial } = weather;

  // Check for wanderer streak event
  const wanderer = weather?.wanderer;
  const hasStreak = wanderer?.occurred && wanderer?.eventType === 'streak';

  return (
    <Card className="details-card mb-3">
      <Card.Body className="p-0">
        {/* Collapsible Header */}
        <button
          className="details-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="details-content"
        >
          <span className="details-toggle-text">
            {isExpanded ? 'Hide Details' : 'Show Details'}
            {hasStreak && !isExpanded && (
              <span className="wanderer-indicator" title="Celestial event occurred!">✨</span>
            )}
          </span>
          <span className="details-toggle-icon">
            {isExpanded ? <BsChevronUp /> : <BsChevronDown />}
          </span>
        </button>

        <Collapse in={isExpanded}>
          <div id="details-content">
            <div className="details-content-inner">
              {/* Wanderer streak notification */}
              {hasStreak && (
                <div className="wanderer-streak-alert">
                  <span className="streak-icon">✨</span>
                  <span className="streak-text">{wanderer.displaySummary}</span>
                  {!wanderer.wasObservable && (
                    <span className="streak-visibility">({wanderer.visibilityBlocker})</span>
                  )}
                </div>
              )}

              {/* Conditions Section */}
              <div className="details-section">
                <div className="section-sublabel">Conditions</div>
                <Row className="g-2">
                  {/* Humidity */}
                  <Col xs={6} sm={3}>
                    <div className="detail-item">
                      <div className="detail-icon"><WiHumidity /></div>
                      <div className="detail-label">Humidity</div>
                      <div className="detail-value">{weather.humidity || 0}%</div>
                    </div>
                  </Col>

                  {/* Pressure */}
                  <Col xs={6} sm={3}>
                    <div className="detail-item">
                      <div className="detail-icon"><WiBarometer /></div>
                      <div className="detail-label">Pressure</div>
                      <div className="detail-value">
                        {weather.pressure ? `${weather.pressure}"` : 'N/A'}
                      </div>
                      {weather.pressureTrend && (
                        <div className="detail-trend">
                          {weather.pressureTrend === 'rising' && '↑'}
                          {weather.pressureTrend === 'falling' && '↓'}
                          {weather.pressureTrend === 'steady' && '→'}
                        </div>
                      )}
                    </div>
                  </Col>

                  {/* Cloud Cover */}
                  <Col xs={6} sm={3}>
                    <div className="detail-item">
                      <div className="detail-icon"><WiCloudy /></div>
                      <div className="detail-label">Clouds</div>
                      <div className="detail-value">
                        {weather.cloudCover !== undefined ? `${weather.cloudCover}%` : 'N/A'}
                      </div>
                    </div>
                  </Col>

                  {/* Visibility */}
                  <Col xs={6} sm={3}>
                    <div className="detail-item">
                      <div className="detail-icon"><WiFog /></div>
                      <div className="detail-label">Visibility</div>
                      <div className="detail-value">
                        {weather.visibility !== undefined ? `${weather.visibility} mi` : 'N/A'}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Celestial Section */}
              {celestial && (
                <div className="details-section">
                  <div className="section-sublabel">Celestial</div>
                  <Row className="g-2">
                    {/* Sunrise */}
                    <Col xs={6} sm={4} md>
                      <div className="detail-item">
                        <div className="detail-icon"><WiSunrise /></div>
                        <div className="detail-label">Sunrise</div>
                        <div className="detail-value">{celestial.sunriseTime || '--'}</div>
                      </div>
                    </Col>

                    {/* Sunset */}
                    <Col xs={6} sm={4} md>
                      <div className="detail-item">
                        <div className="detail-icon"><WiSunset /></div>
                        <div className="detail-label">Sunset</div>
                        <div className="detail-value">{celestial.sunsetTime || '--'}</div>
                      </div>
                    </Col>

                    {/* Day Length */}
                    <Col xs={6} sm={4} md>
                      <div className="detail-item">
                        <div className="detail-icon"><WiDaySunny /></div>
                        <div className="detail-label">Daylight</div>
                        <div className="detail-value">{celestial.dayLength || '--'}</div>
                      </div>
                    </Col>

                    {/* Moonrise */}
                    <Col xs={6} sm={6} md>
                      <div className="detail-item">
                        <div className="detail-icon"><WiMoonrise /></div>
                        <div className="detail-label">Moonrise</div>
                        <div className="detail-value">{celestial.moonriseTime || '--'}</div>
                      </div>
                    </Col>

                    {/* Moonset */}
                    <Col xs={6} sm={6} md>
                      <div className="detail-item">
                        <div className="detail-icon"><WiMoonset /></div>
                        <div className="detail-label">Moonset</div>
                        <div className="detail-value">{celestial.moonsetTime || '--'}</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  );
};

export default DetailsCard;

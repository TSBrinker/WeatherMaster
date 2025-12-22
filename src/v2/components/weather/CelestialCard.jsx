import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { WiSunrise, WiSunset, WiDaySunny, WiMoonNew, WiMoonWaxingCrescent3, WiMoonFirstQuarter, WiMoonWaxingGibbous3, WiMoonFull, WiMoonWaningGibbous3, WiMoonThirdQuarter, WiMoonWaningCrescent3, WiMoonrise, WiMoonset, WiTime4 } from 'react-icons/wi';
import { BsStars } from 'react-icons/bs';
import './CelestialCard.css';

/**
 * CelestialCard - Sun and Moon information
 * Sunrise, Sunset, Moon Phase, Moonrise, Moonset, Day Length
 */
const CelestialCard = ({ weather }) => {
  if (!weather?.celestial) {
    return null;
  }

  const { celestial } = weather;

  // Format time from 24h to 12h
  const formatTime = (time24) => {
    if (!time24) return '--';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Get moon icon
  const getMoonIcon = (phase) => {
    if (!phase) return <WiMoonNew />;
    const phaseLower = phase.toLowerCase();
    if (phaseLower.includes('new')) return <WiMoonNew />;
    if (phaseLower.includes('waxing crescent')) return <WiMoonWaxingCrescent3 />;
    if (phaseLower.includes('first quarter')) return <WiMoonFirstQuarter />;
    if (phaseLower.includes('waxing gibbous')) return <WiMoonWaxingGibbous3 />;
    if (phaseLower.includes('full')) return <WiMoonFull />;
    if (phaseLower.includes('waning gibbous')) return <WiMoonWaningGibbous3 />;
    if (phaseLower.includes('last quarter') || phaseLower.includes('third quarter')) return <WiMoonThirdQuarter />;
    if (phaseLower.includes('waning crescent')) return <WiMoonWaningCrescent3 />;
    return <WiMoonNew />;
  };

  return (
    <Card className="celestial-card mb-3">
      <Card.Body>
        <div className="section-label">
          <BsStars /> CELESTIAL INFO
        </div>

        <Row className="g-3">
          {/* Sunrise */}
          <Col xs={6} md={4}>
            <div className="celestial-item">
              <div className="celestial-icon"><WiSunrise /></div>
              <div className="celestial-label">SUNRISE</div>
              <div className="celestial-value">
                {celestial.sunriseTime || '--'}
              </div>
            </div>
          </Col>

          {/* Sunset */}
          <Col xs={6} md={4}>
            <div className="celestial-item">
              <div className="celestial-icon"><WiSunset /></div>
              <div className="celestial-label">SUNSET</div>
              <div className="celestial-value">
                {celestial.sunsetTime || '--'}
              </div>
            </div>
          </Col>

          {/* Day Length */}
          <Col xs={6} md={4}>
            <div className="celestial-item">
              <div className="celestial-icon"><WiDaySunny /></div>
              <div className="celestial-label">DAYLIGHT</div>
              <div className="celestial-value">
                {celestial.dayLength || '--'}
              </div>
            </div>
          </Col>

          {/* Moon Phase */}
          <Col xs={6} md={4}>
            <div className="celestial-item">
              <div className="celestial-icon">{getMoonIcon(celestial.moonPhase)}</div>
              <div className="celestial-label">MOON PHASE</div>
              <div className="celestial-value celestial-phase">
                {celestial.moonPhase || 'Unknown'}
              </div>
            </div>
          </Col>

          {/* Moonrise */}
          <Col xs={6} md={4}>
            <div className="celestial-item">
              <div className="celestial-icon"><WiMoonrise /></div>
              <div className="celestial-label">MOONRISE</div>
              <div className="celestial-value">
                {celestial.moonriseTime || '--'}
              </div>
            </div>
          </Col>

          {/* Moonset */}
          <Col xs={6} md={4}>
            <div className="celestial-item">
              <div className="celestial-icon"><WiMoonset /></div>
              <div className="celestial-label">MOONSET</div>
              <div className="celestial-value">
                {celestial.moonsetTime || '--'}
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default CelestialCard;

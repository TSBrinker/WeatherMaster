import React, { useState } from 'react';
import { Card, Row, Col, Badge, Collapse } from 'react-bootstrap';
import { GiWaveSurfer, GiSailboat, GiWindsock, GiCompass } from 'react-icons/gi';
import { WiStormWarning } from 'react-icons/wi';
import { BsChevronDown, BsChevronUp } from 'react-icons/bs';
import { SEA_STATE_LABELS, SAILING_CONDITIONS } from '../../services/weather/SeaStateService';
import './SeaStateCard.css';

/**
 * SeaStateCard - Maritime conditions for ocean regions
 * Wave height, sea state, swell, sailing conditions, hazards
 */
const SeaStateCard = ({ seaState }) => {
  const [showEffects, setShowEffects] = useState(false);

  if (!seaState) {
    return null;
  }

  // Get sailing condition color
  const getSailingColor = (rating) => {
    const colors = {
      excellent: '#28a745',
      good: '#5cb85c',
      fair: '#f0ad4e',
      challenging: '#ff8c00',
      hazardous: '#dc3545',
      dangerous: '#8b0000'
    };
    return colors[rating] || '#6c757d';
  };

  // Get sea state color
  const getSeaStateColor = (condition) => {
    const colors = {
      calm: '#4a90d9',
      smooth: '#5da0e9',
      slight: '#70b0f0',
      moderate: '#f0ad4e',
      rough: '#ff8c00',
      very_rough: '#dc3545',
      high: '#c9302c',
      very_high: '#a02020',
      phenomenal: '#8b0000'
    };
    return colors[condition] || '#6c757d';
  };

  const sailingColor = getSailingColor(seaState.sailingConditions);
  const seaStateColor = getSeaStateColor(seaState.seaCondition);
  const hasHazards = seaState.hazards && seaState.hazards.length > 0;
  const hasEffects = seaState.effects && seaState.effects.length > 0;

  return (
    <Card className="sea-state-card mb-3">
      <Card.Body>
        <div className="section-label">
          <GiWaveSurfer /> SEA STATE
        </div>

        {/* Hero Wave Display */}
        <div className="sea-state-hero">
          <div className="wave-height-display">
            <span className="wave-height-value">{seaState.waveHeight}</span>
            <span className="wave-height-unit">ft</span>
          </div>
          <div className="sea-condition-label" style={{ color: seaStateColor }}>
            {SEA_STATE_LABELS[seaState.seaCondition] || seaState.seaCondition}
          </div>
          <div className="beaufort-info">
            Force {seaState.beaufortScale} - {seaState.beaufortDescription}
          </div>
        </div>

        {/* Hazards Banner */}
        {hasHazards && (
          <div className="hazards-banner">
            <WiStormWarning className="hazard-icon" />
            <div className="hazard-badges">
              {seaState.hazards.map((hazard, idx) => (
                <Badge key={idx} className="hazard-badge">
                  {hazard}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Details Grid */}
        <Row className="g-3 mt-2">
          {/* Swell Info */}
          <Col xs={6} md={4}>
            <div className="sea-state-item">
              <div className="sea-state-icon"><GiWaveSurfer /></div>
              <div className="sea-state-label">SWELL</div>
              <div className="sea-state-value">
                {seaState.swellHeight}ft @ {seaState.swellPeriod}s
              </div>
            </div>
          </Col>

          {/* Swell Direction */}
          <Col xs={6} md={4}>
            <div className="sea-state-item">
              <div className="sea-state-icon"><GiCompass /></div>
              <div className="sea-state-label">SWELL FROM</div>
              <div className="sea-state-value">
                {seaState.swellDirection}
              </div>
            </div>
          </Col>

          {/* Sailing Conditions */}
          <Col xs={6} md={4}>
            <div className="sea-state-item">
              <div className="sea-state-icon"><GiSailboat /></div>
              <div className="sea-state-label">SAILING</div>
              <div className="sea-state-value" style={{ color: sailingColor }}>
                {SAILING_CONDITIONS[seaState.sailingConditions]?.label || seaState.sailingConditions}
              </div>
            </div>
          </Col>

          {/* Combined Sea Height */}
          <Col xs={6} md={4}>
            <div className="sea-state-item">
              <div className="sea-state-icon"><GiWaveSurfer /></div>
              <div className="sea-state-label">COMBINED</div>
              <div className="sea-state-value">
                {seaState.combinedSeaHeight}ft
              </div>
            </div>
          </Col>

          {/* Wave Range */}
          <Col xs={6} md={4}>
            <div className="sea-state-item">
              <div className="sea-state-icon"><GiWindsock /></div>
              <div className="sea-state-label">WAVE RANGE</div>
              <div className="sea-state-value">
                {seaState.waveHeightRange[0]}-{seaState.waveHeightRange[1]}ft
              </div>
            </div>
          </Col>

          {/* Sea Description */}
          <Col xs={6} md={4}>
            <div className="sea-state-item sea-description">
              <div className="sea-state-label">CONDITIONS</div>
              <div className="sea-state-value-small">
                {seaState.beaufortSeaDescription}
              </div>
            </div>
          </Col>
        </Row>

        {/* Sailing Effects (Collapsible) */}
        {hasEffects && (
          <div className="effects-section mt-3">
            <div
              className="effects-header"
              onClick={() => setShowEffects(!showEffects)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setShowEffects(!showEffects)}
            >
              <span>Sailing Effects ({seaState.effects.length})</span>
              {showEffects ? <BsChevronUp /> : <BsChevronDown />}
            </div>
            <Collapse in={showEffects}>
              <div className="effects-list">
                {seaState.effects.map((effect, idx) => (
                  <div key={idx} className="effect-item">
                    {effect}
                  </div>
                ))}
              </div>
            </Collapse>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default SeaStateCard;

import React, { useState } from 'react';
import { OverlayTrigger, Tooltip, Modal, Button } from 'react-bootstrap';
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiDayCloudy } from 'react-icons/wi';
import { BsInfoCircle } from 'react-icons/bs';
import './PrimaryDisplay.css';

/**
 * PrimaryDisplay - iOS Weather-inspired hero component
 * Features HUGE location name, massive temperature, and clean layout
 */
const PrimaryDisplay = ({ region, weather, world }) => {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);

  if (!region || !weather) {
    return (
      <div className="primary-display">
        <div className="location-hero">Select a location to view weather</div>
      </div>
    );
  }

  const template = region.regionalTemplate || region.climate;

  // Weather data is flat, not nested under 'current'
  const temperature = weather.temperature;
  const feelsLike = weather.feelsLike;
  const condition = weather.condition;

  // High/Low would come from daily forecast, but we don't have that yet
  // For now, we'll skip showing high/low
  const high = null;
  const low = null;

  // Determine if feels like is different enough to show
  const showFeelsLike = feelsLike && Math.abs(temperature - feelsLike) >= 3;

  // Get weather gradient based on condition and time
  const getWeatherGradient = () => {
    const conditionLower = condition?.toLowerCase() || '';
    const hour = new Date().getHours();

    // Time of day
    const isNight = hour < 6 || hour >= 20;
    const isTwilight = (hour >= 5 && hour < 7) || (hour >= 19 && hour < 21);

    // Weather-based gradients
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      if (isNight) return 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)';
      if (isTwilight) return 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)';
      return 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)';
    }

    if (conditionLower.includes('cloud')) {
      if (isNight) return 'linear-gradient(135deg, #374151 0%, #1f2937 100%)';
      return 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)';
    }

    if (conditionLower.includes('rain') || conditionLower.includes('storm')) {
      if (isNight) return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
      return 'linear-gradient(135deg, #475569 0%, #64748b 100%)';
    }

    if (conditionLower.includes('snow')) {
      if (isNight) return 'linear-gradient(135deg, #334155 0%, #1e293b 100%)';
      return 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)';
    }

    // Default
    if (isNight) return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
    return 'linear-gradient(135deg, #4a90e2 0%, #87ceeb 100%)';
  };

  // Get weather icon
  const getWeatherIcon = () => {
    const conditionLower = condition?.toLowerCase() || '';
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return <WiDaySunny />;
    if (conditionLower.includes('cloud')) return <WiCloudy />;
    if (conditionLower.includes('rain')) return <WiRain />;
    if (conditionLower.includes('storm') || conditionLower.includes('thunder')) return <WiThunderstorm />;
    if (conditionLower.includes('snow')) return <WiSnow />;
    if (conditionLower.includes('fog') || conditionLower.includes('mist')) return <WiFog />;
    return <WiDayCloudy />;
  };

  // Determine text color based on gradient
  const conditionLower = condition?.toLowerCase() || '';
  const textClass = conditionLower.includes('snow') || conditionLower.includes('fog') ? 'text-dark' : 'text-light';

  // Template tooltip
  const templateTooltip = (
    <Tooltip id="template-tooltip">
      {template?.name || 'Click for details'}
    </Tooltip>
  );

  // Condition tooltip (if has effects)
  const hasConditionEffects = weather.effects && weather.effects.length > 0;
  const conditionTooltip = hasConditionEffects ? (
    <Tooltip id="condition-tooltip">
      Click for condition effects
    </Tooltip>
  ) : null;

  return (
    <>
      <div
        className={`primary-display ${textClass}`}
        style={{ background: getWeatherGradient() }}
      >
        {/* Location Name - HUGE */}
        <div className="location-hero">
          {region.name}
        </div>

        {/* Regional Template with info icon */}
        <div className="template-info">
          <OverlayTrigger placement="bottom" overlay={templateTooltip}>
            <span className="template-name" onClick={() => setShowTemplateModal(true)}>
              {template?.name || world.climate}
              <BsInfoCircle className="info-icon" />
            </span>
          </OverlayTrigger>
        </div>

        {/* Weather Icon */}
        <div className="weather-icon-hero">
          {getWeatherIcon()}
        </div>

        {/* Temperature - MASSIVE */}
        <div className="temperature-hero">
          {Math.round(temperature)}°
        </div>

        {/* Condition with optional info icon */}
        <div className="condition-hero">
          {condition}
          {hasConditionEffects && (
            <OverlayTrigger placement="bottom" overlay={conditionTooltip}>
              <BsInfoCircle className="info-icon clickable" onClick={() => setShowConditionModal(true)} />
            </OverlayTrigger>
          )}
        </div>

        {/* High/Low - iOS style */}
        {high && low && (
          <div className="high-low-display">
            H:{Math.round(high)}° L:{Math.round(low)}°
          </div>
        )}

        {/* Feels Like - if different */}
        {showFeelsLike && (
          <div className="feels-like-hero">
            Feels like {Math.round(feelsLike)}°
          </div>
        )}
      </div>

      {/* Template Modal */}
      <Modal
        show={showTemplateModal}
        onHide={() => setShowTemplateModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{template?.name || 'Regional Template'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {template ? (
            <>
              <p><strong>Description:</strong> {template.description}</p>
              {template.avgTemp && (
                <p><strong>Average Temperature:</strong> {template.avgTemp}</p>
              )}
              {template.precipitation && (
                <p><strong>Precipitation:</strong> {template.precipitation}</p>
              )}
              {template.seasonalVariation && (
                <p><strong>Seasonal Variation:</strong> {template.seasonalVariation}</p>
              )}
            </>
          ) : (
            <p>No template details available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Condition Effects Modal */}
      {hasConditionEffects && (
        <Modal
          show={showConditionModal}
          onHide={() => setShowConditionModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>{condition} - Effects</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {weather.effects && weather.effects.length > 0 && (
              <>
                <h6>Active Effects</h6>
                <ul>
                  {weather.effects.map((effect, idx) => (
                    <li key={idx}>{effect}</li>
                  ))}
                </ul>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConditionModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default PrimaryDisplay;

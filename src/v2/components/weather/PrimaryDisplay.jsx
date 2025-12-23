import React, { useState } from 'react';
import { OverlayTrigger, Tooltip, Modal, Button } from 'react-bootstrap';
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiDayCloudy, WiNightClear, WiNightAltCloudy } from 'react-icons/wi';
import { BsInfoCircle } from 'react-icons/bs';
import { regionTemplates } from '../../data/region-templates';
import { usePreferences } from '../../contexts/PreferencesContext';
import { transformCondition } from '../../utils/conditionPhrasing';
import './PrimaryDisplay.css';

/**
 * PrimaryDisplay - iOS Weather-inspired hero component
 * Features HUGE location name, massive temperature, and clean layout
 */
const PrimaryDisplay = ({ region, weather, world, currentDate }) => {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const { conditionPhrasing } = usePreferences();

  if (!region || !weather) {
    return (
      <div className="primary-display">
        <div className="location-hero">Select a location to view weather</div>
      </div>
    );
  }

  // Get the full template object from the templateId and latitudeBand
  const template = (region.templateId && region.latitudeBand)
    ? regionTemplates[region.latitudeBand]?.[region.templateId]
    : null;

  // Weather data is flat, not nested under 'current'
  const temperature = weather.temperature;
  const feelsLike = weather.feelsLike;
  const rawCondition = weather.condition;
  const condition = transformCondition(rawCondition, conditionPhrasing);

  // High/Low would come from daily forecast, but we don't have that yet
  // For now, we'll skip showing high/low
  const high = null;
  const low = null;

  // Determine if feels like is different enough to show
  const showFeelsLike = feelsLike && Math.abs(temperature - feelsLike) >= 3;

  // Helper function to parse time string like "5:42 AM" to hour number (0-23)
  const parseTimeToHour = (timeString) => {
    if (!timeString || timeString === 'Never' || timeString === 'Always') return null;
    const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;

    let hour = parseInt(match[1]);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return hour;
  };

  // Shared time-of-day calculations
  const hour = currentDate?.hour ?? 12; // Use in-game time, default to noon if not available
  const sunriseHour = parseTimeToHour(weather?.celestial?.sunriseTime);
  const sunsetHour = parseTimeToHour(weather?.celestial?.sunsetTime);

  // Golden hour detection (the hour of sunrise and the hour of sunset)
  const isGoldenHour = (sunriseHour !== null && hour === sunriseHour) ||
                       (sunsetHour !== null && hour === sunsetHour);

  // Night detection: after sunset hour or before sunrise hour
  const isNight = sunsetHour !== null && sunriseHour !== null
    ? (hour > sunsetHour || hour < sunriseHour)
    : (hour < 6 || hour >= 20); // Fallback to static times

  // Get weather gradient based on condition and time
  const getWeatherGradient = () => {
    const conditionLower = condition?.toLowerCase() || '';

    // Twilight is deprecated in favor of golden hour
    const isTwilight = false;

    // Golden hour takes precedence for clear/sunny conditions
    if (isGoldenHour && (conditionLower.includes('clear') || conditionLower.includes('sunny'))) {
      return 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)'; // Warm orange-yellow gradient
    }

    // Weather-based gradients
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      if (isNight) return 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)'; // Deep indigo to dark slate
      return 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'; // Bright sky blue
    }

    if (conditionLower.includes('cloud')) {
      if (isGoldenHour) return 'linear-gradient(135deg, #d97706 0%, #92400e 100%)'; // Muted golden for clouds
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
    if (isGoldenHour) return 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)'; // Golden hour default
    if (isNight) return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
    return 'linear-gradient(135deg, #4a90e2 0%, #87ceeb 100%)';
  };

  // Get weather icon
  const getWeatherIcon = () => {
    const conditionLower = condition?.toLowerCase() || '';

    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return isNight ? <WiNightClear /> : <WiDaySunny />;
    }
    if (conditionLower.includes('cloud')) {
      return isNight ? <WiNightAltCloudy /> : <WiCloudy />;
    }
    if (conditionLower.includes('rain')) return <WiRain />;
    if (conditionLower.includes('storm') || conditionLower.includes('thunder')) return <WiThunderstorm />;
    if (conditionLower.includes('snow')) return <WiSnow />;
    if (conditionLower.includes('fog') || conditionLower.includes('mist')) return <WiFog />;
    return isNight ? <WiNightAltCloudy /> : <WiDayCloudy />;
  };

  // Determine text color based on background gradient brightness
  const conditionLower = condition?.toLowerCase() || '';
  // Use dark text for light backgrounds (daytime snow/fog), light text otherwise
  // Night always needs light text, regardless of condition
  const textClass = !isNight && (conditionLower.includes('snow') || conditionLower.includes('fog'))
    ? 'text-dark'
    : 'text-light';

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

        {/* Biome name below location, with info icon on same line */}
        <div className="template-info">
          <span className="template-name-text">{template?.name || region.climate || 'Unknown Climate'}</span>
          <OverlayTrigger placement="bottom" overlay={templateTooltip}>
            <BsInfoCircle className="info-icon clickable" onClick={() => setShowTemplateModal(true)} />
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
              {template.gameplayImpact && (
                <p><strong>Gameplay Impact:</strong> {template.gameplayImpact}</p>
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

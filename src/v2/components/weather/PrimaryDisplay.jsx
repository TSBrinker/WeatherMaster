import React, { useState } from 'react';
import { OverlayTrigger, Tooltip, Modal, Button, Badge } from 'react-bootstrap';
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiDayCloudy, WiNightClear, WiNightAltCloudy, WiSnowflakeCold } from 'react-icons/wi';
import { BsInfoCircle, BsExclamationTriangleFill, BsSnow2 } from 'react-icons/bs';
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
  const [showEnvironmentalModal, setShowEnvironmentalModal] = useState(false);
  const [showSnowModal, setShowSnowModal] = useState(false);
  const { conditionPhrasing, showSnowAccumulation } = usePreferences();

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

  // Environmental alerts
  const environmental = weather.environmental || { activeAlerts: [], hasActiveAlerts: false };
  const hasEnvironmentalAlerts = environmental.hasActiveAlerts;

  // Get badge variant based on highest severity alert
  const getAlertBadgeVariant = () => {
    if (!hasEnvironmentalAlerts) return 'secondary';
    const maxLevel = Math.max(...environmental.activeAlerts.map(a => a.level));
    if (maxLevel >= 4) return 'danger';
    if (maxLevel >= 3) return 'warning';
    if (maxLevel >= 2) return 'warning';
    return 'info';
  };

  // Get alert type display name
  const getAlertTypeName = (type) => {
    const names = {
      drought: 'Drought',
      flooding: 'Flood Risk',
      heatWave: 'Heat Wave',
      coldSnap: 'Cold Snap',
      wildfireRisk: 'Wildfire Risk'
    };
    return names[type] || type;
  };

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

        {/* Environmental Alerts Badge */}
        {hasEnvironmentalAlerts && (
          <div className="environmental-alerts-badge" onClick={() => setShowEnvironmentalModal(true)}>
            <Badge bg={getAlertBadgeVariant()} className="alerts-badge">
              <BsExclamationTriangleFill className="alert-icon" />
              {environmental.activeAlerts.length} Active Alert{environmental.activeAlerts.length > 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        {/* Snow Accumulation Visual Overlay */}
        {showSnowAccumulation && weather.snowAccumulation && weather.snowAccumulation.snowFillPercent > 0 && (
          <>
            {/* SVG Filter for organic snow edge - defined once */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <filter id="snow-edge-filter" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.04"
                    numOctaves="3"
                    seed="42"
                    result="noise"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale="20"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              </defs>
            </svg>

            {/* Snow fill overlay */}
            <div
              className="snow-accumulation-overlay"
              style={{ height: `${Math.min(weather.snowAccumulation.snowFillPercent, 60)}%` }}
              onClick={() => setShowSnowModal(true)}
              title={`${weather.snowAccumulation.snowDepth}" snow on ground - click for details`}
            >
              <div className="snow-depth-label">
                <BsSnow2 className="snow-icon" />
                {weather.snowAccumulation.snowDepth}"
              </div>
            </div>
          </>
        )}

        {/* Ice Accumulation Warning (if significant ice but little snow) */}
        {showSnowAccumulation && weather.snowAccumulation && weather.snowAccumulation.iceAccumulation >= 0.1 && weather.snowAccumulation.snowFillPercent < 5 && (
          <div className="ice-warning-badge" onClick={() => setShowSnowModal(true)}>
            <Badge bg="info" className="ice-badge">
              <WiSnowflakeCold className="ice-icon" />
              {weather.snowAccumulation.iceAccumulation}" Ice
            </Badge>
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

      {/* Environmental Alerts Modal */}
      <Modal
        show={showEnvironmentalModal}
        onHide={() => setShowEnvironmentalModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <BsExclamationTriangleFill className="me-2" style={{ color: '#f59e0b' }} />
            Environmental Conditions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {environmental.activeAlerts.length > 0 ? (
            environmental.activeAlerts.map((alert, idx) => (
              <div key={idx} className="alert-item mb-4">
                <h5 className="d-flex align-items-center gap-2">
                  <Badge bg={alert.level >= 3 ? 'danger' : alert.level >= 2 ? 'warning' : 'info'}>
                    {alert.name}
                  </Badge>
                  <span className="text-muted fs-6">({getAlertTypeName(alert.type)})</span>
                </h5>
                <p className="mb-2">{alert.description}</p>

                {/* Alert-specific details */}
                {alert.type === 'drought' && (
                  <p className="small text-muted mb-2">
                    Precipitation deficit: {alert.precipDeficitPercent}% below normal over {alert.lookbackDays} days
                    ({alert.actualPrecipDays} precip days vs {alert.expectedPrecipDays} expected)
                  </p>
                )}
                {alert.type === 'flooding' && (
                  <p className="small text-muted mb-2">
                    Precipitation excess: {alert.precipExcessPercent}% above normal over {alert.lookbackDays} days
                    ({alert.heavyPrecipDays} heavy precip days)
                  </p>
                )}
                {alert.type === 'heatWave' && (
                  <p className="small text-muted mb-2">
                    {alert.consecutiveDays} consecutive days averaging {alert.degreesAboveNormal}°F above normal
                  </p>
                )}
                {alert.type === 'coldSnap' && (
                  <p className="small text-muted mb-2">
                    {alert.consecutiveDays} consecutive days averaging {alert.degreesBelowNormal}°F below normal
                  </p>
                )}
                {alert.type === 'wildfireRisk' && (
                  <p className="small text-muted mb-2">
                    Risk score: {alert.riskScore}/100
                    (Drought: +{alert.factors.droughtContribution}, Heat: +{alert.factors.heatContribution},
                    Low humidity: +{alert.factors.humidityContribution}, Wind: +{alert.factors.windContribution},
                    Recent rain: {alert.factors.recentRainReduction})
                  </p>
                )}

                {/* Gameplay impacts */}
                {alert.gameplayImpacts && alert.gameplayImpacts.length > 0 && (
                  <>
                    <strong className="small">Gameplay Impacts:</strong>
                    <ul className="small mb-0">
                      {alert.gameplayImpacts.map((impact, i) => (
                        <li key={i}>{impact}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))
          ) : (
            <p>No active environmental alerts.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEnvironmentalModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Snow & Ground Conditions Modal */}
      <Modal
        show={showSnowModal}
        onHide={() => setShowSnowModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <BsSnow2 className="me-2" style={{ color: '#60a5fa' }} />
            Ground & Snow Conditions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {weather.snowAccumulation ? (
            <>
              {/* Snow Depth */}
              {weather.snowAccumulation.snowDepth > 0 && (
                <div className="snow-detail-section mb-3">
                  <h6>Snow Accumulation</h6>
                  <p className="mb-1">
                    <strong>{weather.snowAccumulation.snowDepth}"</strong> of snow on the ground
                  </p>
                  <p className="small text-muted mb-0">
                    Water equivalent: {weather.snowAccumulation.snowWaterEquivalent}"
                    {weather.snowAccumulation.snowAge > 24 && ` • Snow age: ${Math.floor(weather.snowAccumulation.snowAge / 24)} days`}
                  </p>
                </div>
              )}

              {/* Ice Accumulation */}
              {weather.snowAccumulation.iceAccumulation > 0 && (
                <div className="snow-detail-section mb-3">
                  <h6>Ice Accumulation</h6>
                  <p className="mb-1">
                    <strong>{weather.snowAccumulation.iceAccumulation}"</strong> of ice on surfaces
                  </p>
                  <p className="small text-muted mb-0">
                    {weather.snowAccumulation.iceAccumulation >= 0.25
                      ? 'Severe - extremely treacherous conditions'
                      : 'Moderate - use caution on surfaces'}
                  </p>
                </div>
              )}

              {/* Ground Condition */}
              <div className="snow-detail-section mb-3">
                <h6>Ground Condition</h6>
                <p className="mb-1">
                  <strong>{weather.snowAccumulation.groundCondition.name}</strong>
                </p>
                <p className="small text-muted mb-0">
                  {weather.snowAccumulation.groundCondition.description}
                </p>
              </div>

              {/* Travel Impact */}
              {weather.snowAccumulation.travelImpact && weather.snowAccumulation.travelImpact.length > 0 && (
                <div className="snow-detail-section mb-3">
                  <h6>Travel Conditions</h6>
                  <ul className="small mb-0">
                    {weather.snowAccumulation.travelImpact.map((impact, i) => (
                      <li key={i}>{impact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gameplay Effects */}
              {weather.snowAccumulation.gameplayEffects && weather.snowAccumulation.gameplayEffects.length > 0 && (
                <div className="snow-detail-section">
                  <h6>Gameplay Effects</h6>
                  <ul className="small mb-0">
                    {weather.snowAccumulation.gameplayEffects.map((effect, i) => (
                      <li key={i}>{effect}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* No snow/ice message */}
              {weather.snowAccumulation.snowDepth === 0 && weather.snowAccumulation.iceAccumulation === 0 && (
                <p className="text-muted">No snow or ice accumulation at this time.</p>
              )}
            </>
          ) : (
            <p>Ground condition data not available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSnowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PrimaryDisplay;

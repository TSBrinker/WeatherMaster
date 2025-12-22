import React, { useState } from 'react';
import { Modal, Tab, Nav, Row, Col } from 'react-bootstrap';
import {
  Cloud, Droplet, Wind, Eye, Thermometer, Gauge, CloudRain, CloudSnow
} from 'lucide-react';
import { WiBarometer, WiCloudy } from 'react-icons/wi';
import './WeatherPrimerModal.css';

/**
 * WeatherPrimerModal - Educational content about weather mechanics
 * Explains atmospheric conditions, what values mean, and how they interact
 */
const WeatherPrimerModal = ({ show, onHide }) => {
  const [activeTab, setActiveTab] = useState('atmospheric');

  const renderMetricCard = (icon, title, description, ranges) => {
    const Icon = icon;
    return (
      <div className="metric-card mb-4">
        <div className="metric-header">
          <Icon className="metric-icon" size={24} />
          <h5 className="metric-title">{title}</h5>
        </div>
        <p className="metric-description">{description}</p>

        {ranges && (
          <div className="metric-ranges">
            {ranges.map((range, idx) => (
              <div key={idx} className={`range-item range-${range.level}`}>
                <div className="range-label">{range.label}</div>
                <div className="range-value">{range.value}</div>
                <div className="range-meaning">{range.meaning}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      className="weather-primer-modal"
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <Cloud className="me-2" size={24} style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
          Weather Primer
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Nav variant="pills" className="mb-4 primer-tabs">
            <Nav.Item>
              <Nav.Link eventKey="atmospheric">Atmospheric Conditions</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="patterns">Weather Patterns</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="interactions">How It All Works</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            {/* Atmospheric Conditions Tab */}
            <Tab.Pane eventKey="atmospheric">
              <h4 className="mb-4">Understanding Atmospheric Conditions</h4>

              {/* Temperature */}
              {renderMetricCard(
                Thermometer,
                'Temperature',
                'The measure of warmth in the air. Temperature affects precipitation type, comfort, and survival.',
                [
                  { level: 'low', label: 'Freezing', value: '≤ 32°F', meaning: 'Water freezes. Snow and ice. Risk of frostbite and hypothermia.' },
                  { level: 'neutral', label: 'Mild', value: '33-80°F', meaning: 'Comfortable conditions. Normal travel and activity.' },
                  { level: 'high', label: 'Hot', value: '≥ 90°F', meaning: 'Heat exhaustion risk. Double water consumption required.' },
                ]
              )}

              {/* Pressure */}
              {renderMetricCard(
                WiBarometer,
                'Barometric Pressure',
                'The weight of air pressing down. Pressure systems drive weather patterns and indicate changes ahead.',
                [
                  { level: 'low', label: 'Low Pressure', value: '< 29.80"', meaning: 'Unstable weather. Clouds, precipitation likely. Storms may develop.' },
                  { level: 'neutral', label: 'Normal', value: '29.80-30.20"', meaning: 'Stable conditions. Generally fair weather.' },
                  { level: 'high', label: 'High Pressure', value: '> 30.20"', meaning: 'Clear skies. Calm, dry conditions. Good weather ahead.' },
                ]
              )}

              {/* Pressure Trend */}
              <div className="metric-card mb-4 bg-dark bg-opacity-25">
                <h6 className="mb-2">Pressure Trends</h6>
                <ul className="mb-0">
                  <li><strong>↑ Rising:</strong> Weather improving. Clearing skies, drier conditions ahead.</li>
                  <li><strong>↓ Falling:</strong> Weather deteriorating. Clouds forming, precipitation likely.</li>
                  <li><strong>→ Steady:</strong> Current conditions persisting. No major change expected.</li>
                </ul>
              </div>

              {/* Humidity */}
              {renderMetricCard(
                Droplet,
                'Relative Humidity (RH)',
                'The percentage of moisture in the air relative to what it can hold at current temperature. Affects comfort and precipitation.',
                [
                  { level: 'low', label: 'Dry', value: '< 40%', meaning: 'Dry air. Clear skies likely. Desert conditions.' },
                  { level: 'neutral', label: 'Comfortable', value: '40-70%', meaning: 'Pleasant humidity. Normal conditions.' },
                  { level: 'high', label: 'Humid', value: '> 70%', meaning: 'Moist air. Clouds forming. Precipitation possible. Feels hotter in warm weather.' },
                  { level: 'extreme', label: 'Saturated', value: '95-100%', meaning: 'Air cannot hold more moisture. Precipitation occurring or imminent. Fog likely.' },
                ]
              )}

              {/* Cloud Cover */}
              {renderMetricCard(
                WiCloudy,
                'Cloud Cover',
                'The percentage of sky obscured by clouds. Affects sunlight, navigation, and precipitation.',
                [
                  { level: 'low', label: 'Clear', value: '0-10%', meaning: 'Blue skies. Full sunlight. Excellent visibility.' },
                  { level: 'low', label: 'Few Clouds', value: '10-25%', meaning: 'Mostly clear with scattered clouds. Good visibility.' },
                  { level: 'neutral', label: 'Scattered', value: '25-50%', meaning: 'Partly cloudy. Intermittent sun.' },
                  { level: 'high', label: 'Broken', value: '50-87%', meaning: 'Mostly cloudy. Limited sun. Celestial navigation difficult.' },
                  { level: 'high', label: 'Overcast', value: '87-100%', meaning: 'Complete cloud cover. No direct sunlight. Cannot navigate by stars.' },
                ]
              )}

              {/* Visibility */}
              {renderMetricCard(
                Eye,
                'Visibility',
                'How far you can see clearly. Affected by precipitation, fog, and atmospheric haze.',
                [
                  { level: 'extreme', label: 'Very Poor', value: '< 1 mile', meaning: 'Heavy precipitation or thick fog. Heavily obscured beyond short distance.' },
                  { level: 'high', label: 'Poor', value: '1-3 miles', meaning: 'Moderate precipitation or haze. Navigation difficult.' },
                  { level: 'neutral', label: 'Moderate', value: '3-6 miles', meaning: 'Light precipitation or mist. Some obscurement.' },
                  { level: 'low', label: 'Good', value: '6-10 miles', meaning: 'Clear conditions. Normal visibility.' },
                  { level: 'low', label: 'Excellent', value: '10+ miles', meaning: 'Crystal clear. Can see for miles.' },
                ]
              )}

              {/* Wind Speed */}
              {renderMetricCard(
                Wind,
                'Wind Speed',
                'How fast air is moving. Affects travel, ranged attacks, and flying creatures.',
                [
                  { level: 'low', label: 'Calm/Breezy', value: '0-14 mph', meaning: 'Gentle air movement. No effects on gameplay.' },
                  { level: 'neutral', label: 'Windy', value: '15-25 mph', meaning: 'Noticeable wind. Small branches move. No mechanical effects yet.' },
                  { level: 'high', label: 'Strong', value: '26-39 mph', meaning: 'Strong gusts. Ranged attacks -2. Flying creatures affected.' },
                  { level: 'extreme', label: 'Gale/Storm', value: '40+ mph', meaning: 'Severe wind. Halved range. Flying very difficult. Walking challenging.' },
                ]
              )}
            </Tab.Pane>

            {/* Weather Patterns Tab */}
            <Tab.Pane eventKey="patterns">
              <h4 className="mb-4">Weather Pattern Systems</h4>

              <p className="mb-4">
                Weather doesn't change randomly—it's driven by larger atmospheric systems that
                persist for several days. Understanding these patterns helps predict what's coming.
              </p>

              <div className="pattern-card mb-3">
                <h5><Gauge className="me-2" size={20} />High Pressure System</h5>
                <ul>
                  <li><strong>Pressure:</strong> 30.20-30.70 inHg</li>
                  <li><strong>Characteristics:</strong> Clear skies, calm winds, dry conditions</li>
                  <li><strong>Duration:</strong> 3-5 days typically</li>
                  <li><strong>What it means:</strong> Stable, pleasant weather. Good for travel. Air sinking and spreading outward prevents cloud formation.</li>
                </ul>
              </div>

              <div className="pattern-card mb-3">
                <h5><CloudRain className="me-2" size={20} />Low Pressure System</h5>
                <ul>
                  <li><strong>Pressure:</strong> 29.20-29.70 inHg</li>
                  <li><strong>Characteristics:</strong> Clouds, precipitation, wind, unstable conditions</li>
                  <li><strong>Duration:</strong> 3-5 days typically</li>
                  <li><strong>What it means:</strong> Stormy weather. Challenging travel. Air rising and converging creates clouds and precipitation.</li>
                </ul>
              </div>

              <div className="pattern-card mb-3">
                <h5><Thermometer className="me-2" size={20} />Warm Front</h5>
                <ul>
                  <li><strong>Pressure:</strong> 29.70-30.00 inHg (rising)</li>
                  <li><strong>Characteristics:</strong> Gradual warming, light to moderate precipitation, increasing clouds</li>
                  <li><strong>Duration:</strong> 2-4 days transition</li>
                  <li><strong>What it means:</strong> Warm air mass overtaking cold air. Long period of steady precipitation, then clearing and warming.</li>
                </ul>
              </div>

              <div className="pattern-card mb-3">
                <h5><CloudSnow className="me-2" size={20} />Cold Front</h5>
                <ul>
                  <li><strong>Pressure:</strong> 29.40-29.80 inHg (falling then rising)</li>
                  <li><strong>Characteristics:</strong> Rapid cooling, intense but brief precipitation, strong winds</li>
                  <li><strong>Duration:</strong> 1-2 days transition</li>
                  <li><strong>What it means:</strong> Cold air mass pushing under warm air. Dramatic weather: thunderstorms, heavy rain/snow, then rapid clearing and cold.</li>
                </ul>
              </div>

              <div className="pattern-card mb-3">
                <h5><Cloud className="me-2" size={20} />Stable Pattern</h5>
                <ul>
                  <li><strong>Pressure:</strong> 29.80-30.10 inHg</li>
                  <li><strong>Characteristics:</strong> Mild conditions, partly cloudy, occasional light precipitation</li>
                  <li><strong>Duration:</strong> 3-5 days typically</li>
                  <li><strong>What it means:</strong> Moderate, unremarkable weather. Neither particularly good nor bad for travel.</li>
                </ul>
              </div>
            </Tab.Pane>

            {/* How It All Works Tab */}
            <Tab.Pane eventKey="interactions">
              <h4 className="mb-4">How Weather Systems Interact</h4>

              <div className="interaction-card mb-4">
                <h5>Pressure Drives Everything</h5>
                <p>
                  Barometric pressure is the foundation of weather. Air naturally flows from high
                  pressure to low pressure, creating wind. Where air rises (low pressure), it cools
                  and forms clouds. Where air sinks (high pressure), skies stay clear.
                </p>
              </div>

              <div className="interaction-card mb-4">
                <h5>Temperature + Humidity = Precipitation Type</h5>
                <ul className="mb-0">
                  <li><strong>Below 28°F:</strong> Snow (frozen crystals)</li>
                  <li><strong>28-32°F:</strong> Sleet or Freezing Rain (mixed/frozen on contact)</li>
                  <li><strong>32-35°F:</strong> Sleet (mostly frozen with some liquid)</li>
                  <li><strong>Above 35°F:</strong> Rain (liquid water)</li>
                  <li><strong>High humidity (95-100%):</strong> Required for any precipitation to occur</li>
                </ul>
              </div>

              <div className="interaction-card mb-4">
                <h5>Cloud Cover Affects Visibility</h5>
                <p>
                  Heavy clouds reduce celestial visibility (can't navigate by stars or sun), but
                  ground visibility stays normal unless there's precipitation or fog. Precipitation
                  drastically reduces visibility based on intensity.
                </p>
              </div>

              <div className="interaction-card mb-4">
                <h5>Pressure Trends Predict Weather</h5>
                <ul className="mb-0">
                  <li><strong>Falling Pressure:</strong> Deteriorating weather. Clouds forming, precipitation coming, humidity rising.</li>
                  <li><strong>Rising Pressure:</strong> Improving weather. Skies clearing, precipitation ending, drier air.</li>
                  <li><strong>Steady Pressure:</strong> Current conditions will persist for a while.</li>
                </ul>
              </div>

              <div className="interaction-card mb-4">
                <h5>"Feels Like" Temperature</h5>
                <p>
                  The temperature you actually experience combines several factors:
                </p>
                <ul className="mb-0">
                  <li><strong>Wind Chill:</strong> Wind makes cold feel colder (below 50°F with 5+ mph wind)</li>
                  <li><strong>Heat Index:</strong> Humidity makes heat feel hotter (above 80°F with 60%+ humidity)</li>
                  <li><strong>Atmospheric Effects:</strong> Low pressure makes cold feel colder, high humidity makes heat feel hotter</li>
                </ul>
              </div>

              <div className="interaction-card mb-4 bg-dark bg-opacity-50">
                <h5>Reading the Signs</h5>
                <p className="mb-2">
                  Your characters can predict weather by observing these patterns:
                </p>
                <ul className="mb-0">
                  <li>Falling pressure + increasing clouds + rising humidity = Storm approaching</li>
                  <li>Rising pressure + decreasing clouds + falling humidity = Weather clearing</li>
                  <li>High pressure + low humidity + clear skies = Stable good weather</li>
                  <li>Low pressure + high humidity + overcast = Precipitation likely</li>
                </ul>
              </div>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>
    </Modal>
  );
};

export default WeatherPrimerModal;

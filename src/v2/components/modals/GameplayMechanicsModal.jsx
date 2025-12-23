import React, { useState } from 'react';
import { Modal, Accordion, Badge, Row, Col } from 'react-bootstrap';
import {
  Eye, Footprints, Moon, Shield, AlertTriangle, Map, Wind
} from 'lucide-react';
import { weatherEffects, windIntensityEffects } from '../../data/weather-effects';
import './GameplayMechanicsModal.css';

/**
 * GameplayMechanicsModal - D&D 5e mechanical impacts of weather
 * Displays existing game mechanics from weather-effects.js
 */
const GameplayMechanicsModal = ({ show, onHide }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter weather conditions by search term
  const filteredConditions = Object.entries(weatherEffects).filter(([condition]) =>
    condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderEffectSection = (icon, title, content, variant = 'primary') => {
    if (!content || (Array.isArray(content) && content.length === 0)) return null;
    if (content === 'Normal') return null;

    const Icon = icon;

    return (
      <div className="effect-section mb-3">
        <div className="effect-header">
          <Icon size={18} className="me-2" style={{ color: `var(--bs-${variant})` }} />
          <strong>{title}</strong>
        </div>
        <div className="effect-content">
          {Array.isArray(content) ? (
            <ul className="mb-0">
              {content.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <div>{content}</div>
          )}
        </div>
      </div>
    );
  };

  const renderWeatherCondition = ([condition, effects], idx) => {
    return (
      <Accordion.Item eventKey={idx.toString()} key={condition}>
        <Accordion.Header>
          <div className="d-flex justify-content-between align-items-center w-100 me-3">
            <span className="condition-name">{condition}</span>
            {effects.summary && (
              <Badge bg="secondary" className="condition-badge">
                {effects.summary.split(' ').slice(0, 4).join(' ')}...
              </Badge>
            )}
          </div>
        </Accordion.Header>
        <Accordion.Body>
          {/* Summary */}
          {effects.summary && (
            <div className="mb-3 p-2 bg-dark bg-opacity-25 rounded">
              <em>{effects.summary}</em>
            </div>
          )}

          {/* Effect Sections */}
          {renderEffectSection(Eye, 'Visibility', effects.visibility, 'info')}
          {renderEffectSection(Footprints, 'Movement', effects.movement, 'warning')}
          {renderEffectSection(Moon, 'Rest', effects.rest, 'secondary')}
          {renderEffectSection(Shield, 'Damage Modifiers', effects.damage, 'danger')}
          {renderEffectSection(AlertTriangle, 'Check Modifiers', effects.checks, 'warning')}
          {renderEffectSection(Map, 'Other Effects', effects.other, 'success')}
        </Accordion.Body>
      </Accordion.Item>
    );
  };

  const renderWindIntensity = ([intensity, data], idx) => {
    return (
      <Accordion.Item eventKey={`wind-${idx}`} key={intensity}>
        <Accordion.Header>
          <div className="d-flex justify-content-between align-items-center w-100 me-3">
            <span className="condition-name">
              <Wind size={18} className="me-2" style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
              {intensity}
            </span>
            <Badge bg="info" className="wind-badge">
              {data.min}-{data.max} mph
            </Badge>
          </div>
        </Accordion.Header>
        <Accordion.Body>
          <div className="p-2 bg-dark bg-opacity-25 rounded">
            {data.effect}
          </div>
        </Accordion.Body>
      </Accordion.Item>
    );
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      className="gameplay-mechanics-modal"
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <Shield className="me-2" size={24} style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
          Weather & Gameplay Mechanics
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Introduction */}
        <div className="mb-4 p-3 bg-dark bg-opacity-50 rounded">
          <h5 className="mb-2">D&D 5e Weather Effects</h5>
          <p className="mb-0">
            Weather conditions have significant mechanical impacts on gameplay. Use these rules
            to bring your world to life with challenging environmental hazards, tactical considerations,
            and immersive storytelling moments.
          </p>
        </div>

        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search weather conditions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Weather Conditions */}
        <div className="mb-4">
          <h5 className="mb-3">Weather Conditions</h5>
          <Accordion>
            {filteredConditions.length > 0 ? (
              filteredConditions.map((entry, idx) => renderWeatherCondition(entry, idx))
            ) : (
              <div className="text-center text-muted p-4">
                No weather conditions match "{searchTerm}"
              </div>
            )}
          </Accordion>
        </div>

        {/* Wind Intensity Effects */}
        <div className="mb-3">
          <h5 className="mb-3">
            <Wind className="me-2" size={20} style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
            Wind Intensity Effects
          </h5>
          <Accordion>
            {Object.entries(windIntensityEffects).map((entry, idx) => renderWindIntensity(entry, idx))}
          </Accordion>
        </div>

        {/* Footer Note */}
        <div className="mt-4 p-3 bg-dark bg-opacity-25 rounded">
          <small className="text-muted">
            <strong>DM Tip:</strong> These effects are guidelines. Adjust based on your campaign's
            tone, the party's level, and narrative needs. Weather should enhance the experience,
            not bog down gameplay.
          </small>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default GameplayMechanicsModal;

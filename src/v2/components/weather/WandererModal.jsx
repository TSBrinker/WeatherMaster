/**
 * WandererModal
 * Dramatic full-screen modal for Wanderer (falling star) events
 * Designed to be impossible to miss when a local fall occurs
 */

import React from 'react';
import { Modal, Button, Badge } from 'react-bootstrap';
import { WANDERER_SIZE_DETAILS } from '../../models/constants';
import './WandererModal.css';

const WandererModal = ({ wanderer, onDismiss }) => {
  // Only show for local falls
  if (!wanderer || wanderer.eventType !== 'local_fall') {
    return null;
  }

  const { crash, timeDescription, wasObservable, visibilityBlocker, dmNotes } = wanderer;
  const sizeInfo = WANDERER_SIZE_DETAILS[crash.size];
  const impactEffects = crash.impactEffects;

  // Severity-based styling (uses impact effects severity)
  const getSeverityClass = () => {
    if (!impactEffects) return 'wanderer-minor';
    switch (impactEffects.severity) {
      case 'catastrophic': return 'wanderer-catastrophic';
      case 'major': return 'wanderer-major';
      case 'notable': return 'wanderer-notable';
      default: return 'wanderer-minor';
    }
  };

  return (
    <Modal
      show={true}
      onHide={onDismiss}
      centered
      size="lg"
      className={`wanderer-modal ${getSeverityClass()}`}
      backdrop="static"
    >
      <Modal.Body className="wanderer-modal-body">
        {/* Dramatic icon */}
        <div className="wanderer-icon-container">
          <span className="wanderer-icon">☄️</span>
        </div>

        {/* Main headline */}
        <h1 className="wanderer-headline">WANDERER IMPACT</h1>
        <p className="wanderer-subheadline">{sizeInfo.name}</p>

        {/* Location info */}
        <div className="wanderer-location">
          <span className="wanderer-distance">
            {crash.distance < 1
              ? `~${Math.round(crash.distance * 5280)} feet`
              : `~${crash.distance} mile${crash.distance !== 1 ? 's' : ''}`
            }
          </span>
          <span className="wanderer-direction">{crash.direction}</span>
        </div>

        {/* Impact narrative - the dramatic description */}
        {impactEffects && impactEffects.narrative && (
          <p className="wanderer-narrative">
            {impactEffects.narrative}
          </p>
        )}

        {/* Suggested mechanics for significant impacts */}
        {impactEffects && impactEffects.mechanics && (
          <div className="wanderer-mechanics">
            <strong>Suggested Effects:</strong> {impactEffects.mechanics}
          </div>
        )}

        {/* Details section */}
        <div className="wanderer-details">
          <div className="wanderer-detail-row">
            <span className="detail-label">Estimated Value</span>
            <span className="detail-value">{crash.details.estimatedValue}</span>
          </div>
          <div className="wanderer-detail-row">
            <span className="detail-label">Material</span>
            <span className="detail-value">{crash.details.typicalWeight}</span>
          </div>
          <div className="wanderer-detail-row">
            <span className="detail-label">Terrain</span>
            <span className="detail-value">{crash.details.terrain}</span>
          </div>
          <div className="wanderer-detail-row">
            <span className="detail-label">Interest Level</span>
            <Badge bg={crash.size === 'massive' ? 'danger' : crash.size === 'large' ? 'warning' : 'info'}>
              {crash.details.interestLevel}
            </Badge>
          </div>
        </div>

        {/* Adventure Hooks */}
        {crash.details.hooks && crash.details.hooks.length > 0 && (
          <div className="wanderer-hooks">
            <h5>Adventure Hooks</h5>
            <ul>
              {crash.details.hooks.map((hook, i) => (
                <li key={i}>{hook}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Complications */}
        {crash.details.complications && crash.details.complications.length > 0 && (
          <div className="wanderer-complications">
            <h5>Complications</h5>
            <ul>
              {crash.details.complications.map((comp, i) => (
                <li key={i}>{comp}</li>
              ))}
            </ul>
          </div>
        )}

        {/* DM Notes (collapsible) */}
        <details className="wanderer-dm-notes">
          <summary>DM Notes</summary>
          <p>{dmNotes}</p>
        </details>

        {/* Dismiss button */}
        <Button
          variant="light"
          size="lg"
          className="wanderer-dismiss-btn"
          onClick={onDismiss}
        >
          Continue
        </Button>
      </Modal.Body>
    </Modal>
  );
};

export default WandererModal;

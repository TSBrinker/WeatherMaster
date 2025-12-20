import React from 'react';
import { Card } from 'react-bootstrap';
import { formatDate, getSeason, getSeasonPhase } from '../../utils/dateUtils';
import { usePreferences } from '../../contexts/PreferencesContext';

/**
 * Time Display Component
 * Shows current game date, time, and season
 */
const TimeDisplay = ({ currentDate }) => {
  const { timeFormat } = usePreferences();

  if (!currentDate) {
    return null;
  }

  const season = getSeason(currentDate.month);
  const seasonPhase = getSeasonPhase(currentDate.month, currentDate.day);

  return (
    <Card className="mb-3 bg-primary text-white">
      <Card.Body className="text-center">
        <h2 className="mb-1">{formatDate(currentDate, timeFormat === 24)}</h2>
        <h5 className="mb-0">{seasonPhase}</h5>
      </Card.Body>
    </Card>
  );
};

export default TimeDisplay;

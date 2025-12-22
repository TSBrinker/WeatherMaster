import React, { useState, useEffect } from 'react';
import { Card, Button, Collapse } from 'react-bootstrap';
import { GiScrollQuill } from 'react-icons/gi';
import weatherService from '../../services/weather/WeatherService';
import { getMonthName } from '../../utils/dateUtils';
import './DMForecastPanel.css';

/**
 * DM Planning Panel - 7 Day Weather Forecast
 * Helps DMs plan narrative elements for nature-attuned characters
 */
const DMForecastPanel = ({ region, currentDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [forecast, setForecast] = useState(null);

  const generateForecast = () => {
    if (!region || !currentDate) return;

    const dailyForecast = weatherService.getDailyForecast(region, currentDate, 7);
    setForecast(dailyForecast);
    setIsOpen(true);
  };

  // Auto-refresh forecast when time changes (if forecast is already visible)
  useEffect(() => {
    if (forecast && region && currentDate) {
      const dailyForecast = weatherService.getDailyForecast(region, currentDate, 7);
      setForecast(dailyForecast);
    }
  }, [currentDate, region]);

  const formatDate = (date) => {
    return `${getMonthName(date.month, true)} ${date.day}`;
  };

  const formatPrecipitation = (precip, type) => {
    if (!precip) return 'None';
    return type || 'Yes';
  };

  const getDayLabel = (day) => {
    if (day === 0) return 'Today';
    if (day === 1) return 'Tomorrow';
    return `Day ${day + 1}`;
  };

  return (
    <Card className="dm-forecast-panel mb-3">
      <Card.Body>
        <div className="section-label mb-2">
          <GiScrollQuill /> DM Planning
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div className="forecast-subtitle">7-Day Outlook</div>
          <div>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={generateForecast}
              className="me-2"
            >
              {forecast ? 'Refresh' : 'Generate'}
            </Button>
            {forecast && (
              <Button
                variant={isOpen ? "primary" : "outline-primary"}
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? 'Hide' : 'Show'}
              </Button>
            )}
          </div>
        </div>

        <Collapse in={isOpen}>
          <div className="forecast-table-container mt-3">
            {forecast && (
              <>
                <div className="dm-note mb-2">
                  <small>
                    <strong>DM Note:</strong> Use this forecast to foreshadow weather events for nature-attuned characters.
                    Rangers and Druids may sense upcoming storms or shifts in weather patterns.
                  </small>
                </div>

                <div className="forecast-table">
                  <div className="forecast-header">
                    <div className="col-day">Day</div>
                    <div className="col-date">Date</div>
                    <div className="col-temp">Temp (°F)</div>
                    <div className="col-condition">Condition</div>
                    <div className="col-precip">Precipitation</div>
                    <div className="col-pattern">Pattern</div>
                  </div>

                  {forecast.map((day) => (
                    <div key={day.day} className="forecast-row">
                      <div className="col-day">
                        <strong>{getDayLabel(day.day)}</strong>
                      </div>
                      <div className="col-date">
                        {formatDate(day.date)}
                      </div>
                      <div className="col-temp">
                        <span className="temp-high">{day.high}°</span>
                        {' / '}
                        <span className="temp-low">{day.low}°</span>
                      </div>
                      <div className="col-condition">
                        {day.condition}
                      </div>
                      <div className="col-precip">
                        {formatPrecipitation(day.precipitation, day.precipitationType)}
                      </div>
                      <div className="col-pattern">
                        <small>{day.pattern}</small>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pattern-analysis mt-3">
                  <small className="text-muted">
                    <strong>Pattern Analysis:</strong>{' '}
                    {forecast.filter(d => d.precipitation).length > 0 ? (
                      <>Storm system affecting {forecast.filter(d => d.precipitation).length} of the next 7 days.</>
                    ) : (
                      <>Clear weather pattern expected to continue.</>
                    )}
                  </small>
                </div>
              </>
            )}
          </div>
        </Collapse>

        {!forecast && (
          <div className="text-muted mt-2">
            <small>
              <em>Generate a 7-day forecast to help plan narrative elements and weather-based encounters.</em>
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default DMForecastPanel;

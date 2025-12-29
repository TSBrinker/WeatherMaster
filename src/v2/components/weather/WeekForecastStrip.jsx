import React, { useState, useEffect } from 'react';
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiDayCloudy, WiRaindrop } from 'react-icons/wi';
import weatherService from '../../services/weather/WeatherService';
import { getMonthName } from '../../utils/dateUtils';
import './WeekForecastStrip.css';

/**
 * WeekForecastStrip - Always-visible 7-day horizontal forecast
 * Shows weather icon, high/low temps, and precipitation indicator for each day
 */
const WeekForecastStrip = ({ region, currentDate }) => {
  const [forecast, setForecast] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);

  // Generate forecast on mount and when date/region changes
  useEffect(() => {
    if (region && currentDate) {
      const dailyForecast = weatherService.getDailyForecast(region, currentDate, 7);
      setForecast(dailyForecast);
    }
  }, [region, currentDate]);

  // Get day label using fantasy calendar dates (no weekday names)
  const getDayLabel = (dayIndex, date) => {
    if (dayIndex === 0) return 'Today';
    if (dayIndex === 1) return 'Tmrw';
    // Use abbreviated month + day format for remaining days
    return `${getMonthName(date.month, true)} ${date.day}`;
  };

  const getWeatherIcon = (condition) => {
    const conditionLower = condition?.toLowerCase() || '';
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return <WiDaySunny />;
    if (conditionLower.includes('partly')) return <WiDayCloudy />;
    if (conditionLower.includes('cloud')) return <WiCloudy />;
    if (conditionLower.includes('rain')) return <WiRain />;
    if (conditionLower.includes('storm') || conditionLower.includes('thunder')) return <WiThunderstorm />;
    if (conditionLower.includes('snow')) return <WiSnow />;
    if (conditionLower.includes('fog') || conditionLower.includes('mist')) return <WiFog />;
    return <WiDayCloudy />;
  };

  const handleDayClick = (dayIndex) => {
    setExpandedDay(expandedDay === dayIndex ? null : dayIndex);
  };

  if (!forecast) {
    return null;
  }

  return (
    <div className="week-forecast-strip">
      <div className="forecast-scroll-container">
        {forecast.map((day) => (
          <div
            key={day.day}
            className={`day-card ${expandedDay === day.day ? 'expanded' : ''} ${day.day === 0 ? 'today' : ''}`}
            onClick={() => handleDayClick(day.day)}
          >
            <div className="day-label">{getDayLabel(day.day, day.date)}</div>
            <div className="day-icon">{getWeatherIcon(day.condition)}</div>
            <div className="day-temps">
              <span className="temp-high">{day.high}°</span>
              <span className="temp-low">{day.low}°</span>
            </div>
            {day.precipitation && (
              <div className="day-precip">
                <WiRaindrop />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Expanded day details */}
      {expandedDay !== null && forecast[expandedDay] && (
        <div className="expanded-details">
          <div className="expanded-date">
            {getMonthName(forecast[expandedDay].date.month, true)} {forecast[expandedDay].date.day}
          </div>
          <div className="expanded-condition">
            {forecast[expandedDay].condition}
          </div>
          {forecast[expandedDay].precipitationType && (
            <div className="expanded-precip">
              {forecast[expandedDay].precipitationType}
            </div>
          )}
          <div className="expanded-pattern">
            {forecast[expandedDay].pattern}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeekForecastStrip;

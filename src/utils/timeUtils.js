// src/utils/timeUtils.js
/**
 * Format time with minutes for celestial events
 * @param {Date} date - Date to format
 * @returns {string} - Formatted time string with minutes (e.g., "7:30 AM")
 */
export const formatTimeWithMinutes = (date) => {
    if (!(date instanceof Date)) return "N/A";
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  /**
   * Format just the hour for the main display
   * @param {Date} date - Date to format
   * @returns {string} - Formatted time string with just the hour (e.g., "7 AM")
   */
  export const formatHourOnly = (date) => {
    if (!(date instanceof Date)) return "N/A";
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true
    });
  };
  
  /**
   * Format date for display
   * @param {Date} date - Date to format
   * @returns {string} - Formatted date string (e.g., "May 7, 2023")
   */
  export const formatDate = (date) => {
    if (!(date instanceof Date)) return "N/A";
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  /**
   * Format duration in hours and minutes
   * @param {number} milliseconds - Duration in milliseconds
   * @returns {string} - Formatted duration (e.g., "12 hr 30 min")
   */
  export const formatDuration = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} hr ${minutes} min`;
  };
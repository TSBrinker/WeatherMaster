// src/utils/timeUtils.js

// Format time with minutes
export function formatTimeWithMinutes(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "N/A";
  }
  
  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Format time without minutes
export function formatHour(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "N/A";
  }
  
  return date.toLocaleString("en-US", {
    hour: "numeric",
    hour12: true,
  });
}
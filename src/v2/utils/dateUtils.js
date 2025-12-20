/**
 * Date utilities for fictional earth calendar
 * - Uses earth month names (Jan-Dec)
 * - Supports any year (4832, 256, etc.)
 * - Hour-only time (no minutes)
 * - No leap years (Feb always 28 days)
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const DAYS_PER_MONTH = {
  1: 31,  // January
  2: 28,  // February (no leap years)
  3: 31,  // March
  4: 30,  // April
  5: 31,  // May
  6: 30,  // June
  7: 31,  // July
  8: 31,  // August
  9: 30,  // September
  10: 31, // October
  11: 30, // November
  12: 31  // December
};

/**
 * Get month name from number (1-12)
 */
export const getMonthName = (month, short = false) => {
  const names = short ? MONTH_NAMES_SHORT : MONTH_NAMES;
  return names[month - 1] || 'Unknown';
};

/**
 * Get maximum days in a month
 */
export const getDaysInMonth = (month) => {
  return DAYS_PER_MONTH[month] || 31;
};

/**
 * Validate if a date is valid
 */
export const isValidDate = (year, month, day) => {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > getDaysInMonth(month)) return false;
  return true;
};

/**
 * Format hour as 12-hour or 24-hour time (no minutes)
 */
export const formatHour = (hour, use24Hour = false) => {
  if (use24Hour) {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  // 12-hour format
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

/**
 * Format complete date
 * Example: "August 6, 4832 at 2 PM"
 */
export const formatDate = (gameDate, use24Hour = false) => {
  const { year, month, day, hour } = gameDate;
  const monthName = getMonthName(month);
  const timeStr = formatHour(hour, use24Hour);
  return `${monthName} ${day}, ${year} at ${timeStr}`;
};

/**
 * Format date (short version)
 * Example: "Aug 6, 4832"
 */
export const formatDateShort = (gameDate) => {
  const { year, month, day } = gameDate;
  const monthName = getMonthName(month, true);
  return `${monthName} ${day}, ${year}`;
};

/**
 * Get day of year (1-365, for sunrise/sunset calculations)
 */
export const getDayOfYear = (month, day) => {
  let dayOfYear = 0;
  for (let m = 1; m < month; m++) {
    dayOfYear += getDaysInMonth(m);
  }
  dayOfYear += day;
  return dayOfYear;
};

/**
 * Get season based on month (northern hemisphere)
 */
export const getSeason = (month) => {
  if (month === 12 || month === 1 || month === 2) return 'winter';
  if (month === 3 || month === 4 || month === 5) return 'spring';
  if (month === 6 || month === 7 || month === 8) return 'summer';
  return 'fall';
};

/**
 * Get season phase (early/mid/late based on progress through the season)
 */
export const getSeasonPhase = (month, day) => {
  const season = getSeason(month);

  // Define season start months
  const seasonStarts = {
    winter: 12,
    spring: 3,
    summer: 6,
    fall: 9
  };

  // Calculate days into the current season
  let startMonth = seasonStarts[season];
  let daysIntoSeason = 0;

  // Handle winter wrapping around year boundary
  if (season === 'winter') {
    if (month === 12) {
      daysIntoSeason = day; // Dec 1 = day 1 of winter
    } else {
      // January or February
      daysIntoSeason = getDaysInMonth(12) + // All of December
        (month === 2 ? getDaysInMonth(1) : 0) + // All of January if we're in Feb
        day;
    }
  } else {
    // For other seasons, calculate normally
    for (let m = startMonth; m < month; m++) {
      daysIntoSeason += getDaysInMonth(m);
    }
    daysIntoSeason += day;
  }

  // Total days in season (3 months)
  const totalDaysInSeason = season === 'winter'
    ? getDaysInMonth(12) + getDaysInMonth(1) + getDaysInMonth(2) // Dec + Jan + Feb
    : getDaysInMonth(startMonth) + getDaysInMonth(startMonth + 1) + getDaysInMonth(startMonth + 2);

  // Calculate phase based on thirds
  const seasonCapitalized = season.charAt(0).toUpperCase() + season.slice(1);

  if (daysIntoSeason <= totalDaysInSeason / 3) {
    return `Early ${seasonCapitalized}`;
  } else if (daysIntoSeason <= (totalDaysInSeason * 2) / 3) {
    return `Mid ${seasonCapitalized}`;
  } else {
    return `Late ${seasonCapitalized}`;
  }
};

/**
 * Advance date by hours
 */
export const advanceDate = (gameDate, hours) => {
  let { year, month, day, hour } = { ...gameDate };

  hour += hours;

  // Handle hour overflow into days
  while (hour >= 24) {
    hour -= 24;
    day += 1;

    // Handle day overflow into months
    if (day > getDaysInMonth(month)) {
      day = 1;
      month += 1;

      // Handle month overflow into years
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
  }

  // Handle negative hours (going backwards)
  while (hour < 0) {
    hour += 24;
    day -= 1;

    // Handle day underflow
    if (day < 1) {
      month -= 1;

      // Handle month underflow
      if (month < 1) {
        month = 12;
        year -= 1;
      }

      day = getDaysInMonth(month);
    }
  }

  return { year, month, day, hour };
};

/**
 * Create a new date object
 */
export const createDate = (year = 1, month = 1, day = 1, hour = 0) => {
  // Validate and clamp values
  if (month < 1) month = 1;
  if (month > 12) month = 12;

  const maxDay = getDaysInMonth(month);
  if (day < 1) day = 1;
  if (day > maxDay) day = maxDay;

  if (hour < 0) hour = 0;
  if (hour > 23) hour = 23;

  return { year, month, day, hour };
};

/**
 * Compare two dates (-1 if d1 < d2, 0 if equal, 1 if d1 > d2)
 */
export const compareDates = (d1, d2) => {
  if (d1.year !== d2.year) return d1.year < d2.year ? -1 : 1;
  if (d1.month !== d2.month) return d1.month < d2.month ? -1 : 1;
  if (d1.day !== d2.day) return d1.day < d2.day ? -1 : 1;
  if (d1.hour !== d2.hour) return d1.hour < d2.hour ? -1 : 1;
  return 0;
};

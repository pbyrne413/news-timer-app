// Centralized date utilities using Luxon for consistent date handling
import { DateTime } from 'luxon';

export class DateUtils {
  // Get current date in YYYY-MM-DD format (ISO date)
  static getCurrentDate() {
    return DateTime.now().toISODate();
  }

  // Get current timestamp in ISO format
  static getCurrentTimestamp() {
    return DateTime.now().toISO();
  }

  // Get current timestamp for performance measurement
  static getCurrentTime() {
    return DateTime.now().toMillis();
  }

  // Format date for display
  static formatDate(date, format = 'yyyy-MM-dd') {
    if (typeof date === 'string') {
      return DateTime.fromISO(date).toFormat(format);
    }
    return DateTime.fromJSDate(date).toFormat(format);
  }

  // Parse date string to DateTime object
  static parseDate(dateString) {
    return DateTime.fromISO(dateString);
  }

  // Check if date is today
  static isToday(dateString) {
    const date = DateTime.fromISO(dateString);
    const today = DateTime.now();
    return date.hasSame(today, 'day');
  }

  // Get start of day
  static getStartOfDay(dateString = null) {
    const date = dateString ? DateTime.fromISO(dateString) : DateTime.now();
    return date.startOf('day');
  }

  // Get end of day
  static getEndOfDay(dateString = null) {
    const date = dateString ? DateTime.fromISO(dateString) : DateTime.now();
    return date.endOf('day');
  }

  // Add days to date
  static addDays(dateString, days) {
    const date = DateTime.fromISO(dateString);
    return date.plus({ days }).toISODate();
  }

  // Subtract days from date
  static subtractDays(dateString, days) {
    const date = DateTime.fromISO(dateString);
    return date.minus({ days }).toISODate();
  }

  // Get date range (useful for statistics)
  static getDateRange(startDate, endDate) {
    const start = DateTime.fromISO(startDate);
    const end = DateTime.fromISO(endDate);
    const dates = [];
    
    let current = start;
    while (current <= end) {
      dates.push(current.toISODate());
      current = current.plus({ days: 1 });
    }
    
    return dates;
  }

  // Get relative time (e.g., "2 hours ago")
  static getRelativeTime(dateString) {
    const date = DateTime.fromISO(dateString);
    return date.toRelative();
  }

  // Validate date string
  static isValidDate(dateString) {
    const date = DateTime.fromISO(dateString);
    return date.isValid;
  }

  // Get timezone-aware date
  static getTimezoneDate(timezone = 'local') {
    return DateTime.now().setZone(timezone);
  }

  // Format duration in milliseconds to human readable
  static formatDuration(milliseconds) {
    const duration = DateTime.fromMillis(milliseconds);
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Get business day (Monday = 1, Sunday = 7)
  static getBusinessDay(dateString = null) {
    const date = dateString ? DateTime.fromISO(dateString) : DateTime.now();
    return date.weekday;
  }

  // Check if date is weekend
  static isWeekend(dateString = null) {
    const weekday = this.getBusinessDay(dateString);
    return weekday === 6 || weekday === 7; // Saturday or Sunday
  }

  // Get week number
  static getWeekNumber(dateString = null) {
    const date = dateString ? DateTime.fromISO(dateString) : DateTime.now();
    return date.weekNumber;
  }

  // Get month name
  static getMonthName(dateString = null) {
    const date = dateString ? DateTime.fromISO(dateString) : DateTime.now();
    return date.toFormat('MMMM');
  }

  // Get year
  static getYear(dateString = null) {
    const date = dateString ? DateTime.fromISO(dateString) : DateTime.now();
    return date.year;
  }
}

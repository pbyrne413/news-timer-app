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

  // Format duration in milliseconds to human readable
  static formatDuration(milliseconds) {
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
}

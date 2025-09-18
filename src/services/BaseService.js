// Base service class implementing common patterns
import { DateUtils } from '../utils/DateUtils.js';

export class BaseService {
  constructor(database) {
    if (!database) {
      throw new Error('Database dependency is required');
    }
    this.db = database;
  }

  // Template method for database operations with connection management
  async executeWithConnection(operation) {
    await this.db.ensureInitialized();
    try {
      return await operation();
    } finally {
      // Database connection cleanup handled by Database class
    }
  }

  // Helper method for date operations using Luxon
  getCurrentDate() {
    return DateUtils.getCurrentDate();
  }

  // Helper method for timestamps
  getCurrentTimestamp() {
    return DateUtils.getCurrentTimestamp();
  }
}

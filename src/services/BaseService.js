// Base service class implementing common patterns
import { DateTime } from 'luxon';

export class BaseService {
  constructor(database) {
    if (!database) {
      throw new Error('Database dependency is required');
    }
    this.db = database;
  }

  // Template method for database operations with connection management
  async executeWithConnection(operation, timeoutMs = 5000) {
    const startTime = Date.now();
    console.log('🔄 Starting database operation');

    try {
      // Initialize with timeout
      await Promise.race([
        this.db.ensureInitialized(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database initialization timeout')), 3000))
      ]);

      // Execute operation with timeout
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs))
      ]);

      const duration = Date.now() - startTime;
      console.log(`✅ Database operation completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Database operation failed after ${duration}ms:`, error);
      throw error;
    } finally {
      // Database connection cleanup handled by Database class
    }
  }

  // Helper method for date operations using Luxon
  getCurrentDate() {
    return DateTime.now().toISODate();
  }

  // Helper method for timestamps
  getCurrentTimestamp() {
    return DateTime.now().toISO();
  }
}

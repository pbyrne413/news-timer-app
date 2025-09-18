// Turso-specific optimizations for serverless environments
import { createClient } from '@libsql/client';
import { config } from '../config/index.js';

export class TursoOptimizer {
  // Connection pool for reusing connections across function invocations
  static connectionPool = new Map();
  
  // Optimize Turso connection for serverless
  static getOptimizedClient() {
    
    const connectionKey = `${config.database.url}_${config.database.authToken}`;
    
    if (this.connectionPool.has(connectionKey)) {
      return this.connectionPool.get(connectionKey);
    }
    
    const client = createClient({
      url: config.database.url,
      authToken: config.database.authToken,
      // Turso-specific optimizations
      syncUrl: config.database.url,
      syncInterval: 60, // Sync every 60 seconds
      // Connection pooling for serverless
      intMode: 'number', // Use numbers instead of BigInt for better JSON serialization
    });
    
    this.connectionPool.set(connectionKey, client);
    return client;
  }
  
  // Batch operations for better performance
  static async executeBatch(operations) {
    const client = this.getOptimizedClient();
    
    try {
      // Use Turso's batch API for multiple operations
      return await client.batch(operations);
    } catch (error) {
      console.error('Turso batch operation failed:', error);
      throw error;
    }
  }
  
  // Connection cleanup for serverless environments
  static cleanup() {
    this.connectionPool.clear();
  }
  
  // Health check for Turso connection
  static async healthCheck() {
    try {
      const client = this.getOptimizedClient();
      await client.execute('SELECT 1');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message, 
        timestamp: new Date().toISOString() 
      };
    }
  }
}

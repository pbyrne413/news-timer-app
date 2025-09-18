import { createClient } from '@libsql/client';
import { config } from './src/config/index.js';
import { createLogger } from './src/utils/Logger.js';

const log = createLogger('Database');

class Database {
  constructor() {
    this.client = createClient({
      url: config.database.url,
      authToken: config.database.authToken,
      // Turso optimizations for serverless
      intMode: 'number', // Better JSON serialization
      syncInterval: 60, // Sync every 60 seconds for embedded replicas
    });
    this._initialized = false;
    this._initializing = false; // SECURITY: Prevent race conditions
  }

  async ensureInitialized() {
    // SECURITY: Prevent race conditions during initialization
    if (this._initialized) return;
    
    if (this._initializing) {
      // Wait for ongoing initialization to complete
      while (this._initializing && !this._initialized) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return;
    }
    
    this._initializing = true;
    try {
      await this.initializeTables();
      this._initialized = true;
    } finally {
      this._initializing = false;
    }
  }

  async initializeTables() {
    try {
      // Create news_sources table
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS news_sources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          default_allocation INTEGER DEFAULT 300,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

    // Create daily_usages table
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS daily_usages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER NOT NULL,
        date DATE NOT NULL,
        time_used INTEGER DEFAULT 0,
        sessions INTEGER DEFAULT 0,
        overrun_time INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_id) REFERENCES news_sources (id),
        UNIQUE(source_id, date)
      )
    `);

    // Create user_settings table
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_time_limit INTEGER DEFAULT 1800,
        auto_start BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // Initialize default data
      await this.initializeDefaultData();
      log.info('Database tables initialized successfully');
    } catch (error) {
      log.error('Database initialization error', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async initializeDefaultData() {
    // Check if we already have data
    const existingSources = await this.client.execute('SELECT COUNT(*) as count FROM news_sources');
    if (existingSources.rows[0].count > 0) return;

    // SECURITY: Validate default data to prevent injection
    const validateDefaultSource = (source) => {
      if (!source.key || typeof source.key !== 'string' || source.key.length > 50) {
        throw new Error('Invalid source key');
      }
      if (!source.name || typeof source.name !== 'string' || source.name.length > 100) {
        throw new Error('Invalid source name');
      }
      if (!source.icon || typeof source.icon !== 'string' || source.icon.length > 10) {
        throw new Error('Invalid source icon');
      }
      if (!Number.isInteger(source.defaultAllocation) || source.defaultAllocation < 60 || source.defaultAllocation > 3600) {
        throw new Error('Invalid default allocation');
      }
      return source;
    };

    // Create default news sources with validation
    const defaultSources = [
      { key: 'bbc-football', name: 'BBC Football', icon: '⚽', defaultAllocation: 300 },
      { key: 'bbc-headlines', name: 'BBC Headlines', icon: '📰', defaultAllocation: 300 },
      { key: 'rte-headlines', name: 'RTE Headlines', icon: '📺', defaultAllocation: 300 },
      { key: 'guardian-headlines', name: 'Guardian Headlines', icon: '📰', defaultAllocation: 300 },
      { key: 'guardian-opinion', name: 'Guardian Opinion', icon: '💭', defaultAllocation: 300 },
      { key: 'cnn', name: 'CNN', icon: '🌍', defaultAllocation: 300 }
    ].map(validateDefaultSource);

    for (const sourceData of defaultSources) {
      await this.client.execute({
        sql: 'INSERT INTO news_sources (key, name, icon, default_allocation) VALUES (?, ?, ?, ?)',
        args: [sourceData.key, sourceData.name, sourceData.icon, sourceData.defaultAllocation]
      });
    }

    // Create default user settings
    await this.client.execute({
      sql: 'INSERT INTO user_settings (total_time_limit, auto_start) VALUES (?, ?)',
      args: [1800, false]
    });

    log.info('Default data initialized');
  }

  // News Sources methods
  async getSources() {
    await this.ensureInitialized();
    const result = await this.client.execute('SELECT * FROM news_sources WHERE is_active = 1');
    return result.rows;
  }

  async getSourceByKey(key) {
    await this.ensureInitialized();
    const result = await this.client.execute({
      sql: 'SELECT * FROM news_sources WHERE key = ?',
      args: [key]
    });
    return result.rows[0] || null;
  }

  async addSource(key, name, icon, allocation) {
    await this.ensureInitialized();
    const result = await this.client.execute({
      sql: 'INSERT INTO news_sources (key, name, icon, default_allocation) VALUES (?, ?, ?, ?)',
      args: [key, name, icon, allocation]
    });
    return result.lastInsertRowid;
  }

  async updateSourceAllocation(key, allocation) {
    await this.ensureInitialized();
    return this.client.execute({
      sql: 'UPDATE news_sources SET default_allocation = ? WHERE key = ?',
      args: [allocation, key]
    });
  }

  // Daily Usage methods
  async getDailyUsage(sourceId, date) {
    await this.ensureInitialized();
    const result = await this.client.execute({
      sql: 'SELECT * FROM daily_usages WHERE source_id = ? AND date = ?',
      args: [sourceId, date]
    });
    return result.rows[0] || null;
  }

  async updateDailyUsage(sourceId, date, timeUsed, sessions, overrunTime) {
    await this.ensureInitialized();
    const existing = await this.getDailyUsage(sourceId, date);
    
    if (existing) {
      return this.client.execute({
        sql: 'UPDATE daily_usages SET time_used = ?, sessions = ?, overrun_time = ? WHERE source_id = ? AND date = ?',
        args: [timeUsed, sessions, overrunTime, sourceId, date]
      });
    } else {
      return this.client.execute({
        sql: 'INSERT INTO daily_usages (source_id, date, time_used, sessions, overrun_time) VALUES (?, ?, ?, ?, ?)',
        args: [sourceId, date, timeUsed, sessions, overrunTime]
      });
    }
  }

  async getDailyUsages(date) {
    await this.ensureInitialized();
    const result = await this.client.execute({
      sql: `
        SELECT du.*, ns.key, ns.name, ns.icon, ns.default_allocation
        FROM daily_usages du
        JOIN news_sources ns ON du.source_id = ns.id
        WHERE du.date = ?
      `,
      args: [date]
    });
    return result.rows;
  }

  async clearDailyData(date) {
    await this.ensureInitialized();
    return this.client.execute({
      sql: 'DELETE FROM daily_usages WHERE date = ?',
      args: [date]
    });
  }

  // User Settings methods
  async getSettings() {
    await this.ensureInitialized();
    const result = await this.client.execute('SELECT * FROM user_settings ORDER BY id DESC LIMIT 1');
    return result.rows[0] || null;
  }

  async updateSettings(totalTimeLimit, autoStart) {
    await this.ensureInitialized();
    const existing = await this.getSettings();
    
    if (existing) {
      return this.client.execute({
        sql: 'UPDATE user_settings SET total_time_limit = ?, auto_start = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [totalTimeLimit, autoStart, existing.id]
      });
    } else {
      return this.client.execute({
        sql: 'INSERT INTO user_settings (total_time_limit, auto_start) VALUES (?, ?)',
        args: [totalTimeLimit, autoStart]
      });
    }
  }

  close() {
    // Turso client handles connection lifecycle automatically
    // No explicit close needed
  }
}

export default Database;

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
      console.log('🔄 Database initialization starting...');
      // Add timeout to prevent hanging
      await Promise.race([
        this.initializeTables(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database initialization timeout')), 10000)
        )
      ]);
      this._initialized = true;
      console.log('✅ Database initialization completed');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
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
          url TEXT,
          default_allocation INTEGER DEFAULT 300,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add URL column to existing table if it doesn't exist
      try {
        await this.client.execute(`
          ALTER TABLE news_sources ADD COLUMN url TEXT
        `);
        log.info('Added URL column to news_sources table');
      } catch (error) {
        // Column already exists, ignore error
        if (!error.message.includes('duplicate column name')) {
          log.warn('Error adding URL column:', error.message);
        }
      }

      // Add favicon_url column to existing table if it doesn't exist
      try {
        await this.client.execute(`
          ALTER TABLE news_sources ADD COLUMN favicon_url TEXT
        `);
        log.info('Added favicon_url column to news_sources table');
      } catch (error) {
        // Column already exists, ignore error
        if (!error.message.includes('duplicate column name')) {
          log.warn('Error adding favicon_url column:', error.message);
        }
      }

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
    // No default sources to validate - app starts empty

    // No default sources - app starts completely empty for user customization

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

  async addSource(key, name, icon, url, favicon_url, allocation) {
    console.log('📝 Database.addSource called with:', { key, name, icon, url, favicon_url, allocation });
    
    await this.ensureInitialized();
    
    console.log('🚀 Executing INSERT query...');
    const result = await Promise.race([
      this.client.execute({
        sql: 'INSERT INTO news_sources (key, name, icon, url, favicon_url, default_allocation) VALUES (?, ?, ?, ?, ?, ?)',
        args: [key, name, icon, url, favicon_url, allocation]
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]);
    
    console.log('✅ INSERT query completed, lastInsertRowid:', result.lastInsertRowid);
    return result.lastInsertRowid;
  }

  async updateSourceAllocation(key, allocation) {
    await this.ensureInitialized();
    return this.client.execute({
      sql: 'UPDATE news_sources SET default_allocation = ? WHERE key = ?',
      args: [allocation, key]
    });
  }

  async deleteSource(sourceId) {
    await this.ensureInitialized();
    // Delete associated daily usage data first (cascade delete)
    await this.client.execute({
      sql: 'DELETE FROM daily_usages WHERE source_id = ?',
      args: [sourceId]
    });
    // Then delete the source
    return this.client.execute({
      sql: 'DELETE FROM news_sources WHERE id = ?',
      args: [sourceId]
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

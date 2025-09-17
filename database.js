import sqlite3 from 'sqlite3';
import { promisify } from 'util';

class Database {
  constructor() {
    this.db = new sqlite3.Database(process.env.NODE_ENV === 'production' ? '/tmp/database.sqlite' : './database.sqlite');
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
    this.initializeTables();
  }

  async initializeTables() {
    // Create news_sources table
    await this.run(`
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
    await this.run(`
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
    await this.run(`
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
  }

  async initializeDefaultData() {
    // Check if we already have data
    const existingSources = await this.get('SELECT COUNT(*) as count FROM news_sources');
    if (existingSources.count > 0) return;

    // Create default news sources
    const defaultSources = [
      { key: 'bbc-football', name: 'BBC Football', icon: '⚽', defaultAllocation: 300 },
      { key: 'bbc-headlines', name: 'BBC Headlines', icon: '📰', defaultAllocation: 300 },
      { key: 'rte-headlines', name: 'RTE Headlines', icon: '📺', defaultAllocation: 300 },
      { key: 'guardian-headlines', name: 'Guardian Headlines', icon: '📰', defaultAllocation: 300 },
      { key: 'guardian-opinion', name: 'Guardian Opinion', icon: '💭', defaultAllocation: 300 },
      { key: 'cnn', name: 'CNN', icon: '🌍', defaultAllocation: 300 }
    ];

    for (const sourceData of defaultSources) {
      await this.run(
        'INSERT INTO news_sources (key, name, icon, default_allocation) VALUES (?, ?, ?, ?)',
        [sourceData.key, sourceData.name, sourceData.icon, sourceData.defaultAllocation]
      );
    }

    // Create default user settings
    await this.run(
      'INSERT INTO user_settings (total_time_limit, auto_start) VALUES (?, ?)',
      [1800, false]
    );

    console.log('Default data initialized');
  }

  // News Sources methods
  async getSources() {
    return this.all('SELECT * FROM news_sources WHERE is_active = 1');
  }

  async getSourceByKey(key) {
    return this.get('SELECT * FROM news_sources WHERE key = ?', [key]);
  }

  async addSource(key, name, icon, allocation) {
    const result = await this.run(
      'INSERT INTO news_sources (key, name, icon, default_allocation) VALUES (?, ?, ?, ?)',
      [key, name, icon, allocation]
    );
    return result.lastID;
  }

  async updateSourceAllocation(key, allocation) {
    return this.run(
      'UPDATE news_sources SET default_allocation = ? WHERE key = ?',
      [allocation, key]
    );
  }

  // Daily Usage methods
  async getDailyUsage(sourceId, date) {
    return this.get(
      'SELECT * FROM daily_usages WHERE source_id = ? AND date = ?',
      [sourceId, date]
    );
  }

  async updateDailyUsage(sourceId, date, timeUsed, sessions, overrunTime) {
    const existing = await this.getDailyUsage(sourceId, date);
    
    if (existing) {
      return this.run(
        'UPDATE daily_usages SET time_used = ?, sessions = ?, overrun_time = ? WHERE source_id = ? AND date = ?',
        [timeUsed, sessions, overrunTime, sourceId, date]
      );
    } else {
      return this.run(
        'INSERT INTO daily_usages (source_id, date, time_used, sessions, overrun_time) VALUES (?, ?, ?, ?, ?)',
        [sourceId, date, timeUsed, sessions, overrunTime]
      );
    }
  }

  async getDailyUsages(date) {
    return this.all(`
      SELECT du.*, ns.key, ns.name, ns.icon, ns.default_allocation
      FROM daily_usages du
      JOIN news_sources ns ON du.source_id = ns.id
      WHERE du.date = ?
    `, [date]);
  }

  async clearDailyData(date) {
    return this.run('DELETE FROM daily_usages WHERE date = ?', [date]);
  }

  // User Settings methods
  async getSettings() {
    return this.get('SELECT * FROM user_settings ORDER BY id DESC LIMIT 1');
  }

  async updateSettings(totalTimeLimit, autoStart) {
    const existing = await this.getSettings();
    
    if (existing) {
      return this.run(
        'UPDATE user_settings SET total_time_limit = ?, auto_start = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [totalTimeLimit, autoStart, existing.id]
      );
    } else {
      return this.run(
        'INSERT INTO user_settings (total_time_limit, auto_start) VALUES (?, ?)',
        [totalTimeLimit, autoStart]
      );
    }
  }

  close() {
    this.db.close();
  }
}

export default Database;

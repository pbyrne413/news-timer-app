// Simple storage for Vercel serverless functions
// Uses in-memory storage with JSON files as backup

const fs = require('fs');
const path = require('path');

class Storage {
  constructor() {
    this.dataPath = process.env.NODE_ENV === 'production' ? '/tmp/data.json' : './data.json';
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const fileData = fs.readFileSync(this.dataPath, 'utf8');
        return JSON.parse(fileData);
      }
    } catch (error) {
      console.log('No existing data file, creating new one');
    }

    // Default data structure
    return {
      sources: [
        { id: 1, key: 'bbc-football', name: 'BBC Football', icon: '⚽', default_allocation: 300, is_active: 1 },
        { id: 2, key: 'bbc-headlines', name: 'BBC Headlines', icon: '📰', default_allocation: 300, is_active: 1 },
        { id: 3, key: 'rte-headlines', name: 'RTE Headlines', icon: '🇮🇪', default_allocation: 300, is_active: 1 },
        { id: 4, key: 'guardian-headlines', name: 'Guardian Headlines', icon: '🛡️', default_allocation: 300, is_active: 1 },
        { id: 5, key: 'guardian-opinion', name: 'Guardian Opinion', icon: '💭', default_allocation: 300, is_active: 1 },
        { id: 6, key: 'cnn', name: 'CNN', icon: '🌍', default_allocation: 300, is_active: 1 }
      ],
      dailyUsages: [],
      settings: {
        id: 1,
        total_time_limit: 1800,
        auto_start: false
      },
      nextSourceId: 7
    };
  }

  saveData() {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  // Sources methods
  getSources() {
    return this.data.sources.filter(s => s.is_active);
  }

  getSourceByKey(key) {
    return this.data.sources.find(s => s.key === key);
  }

  addSource(key, name, icon, allocation) {
    const newSource = {
      id: this.data.nextSourceId++,
      key,
      name,
      icon,
      default_allocation: allocation,
      is_active: 1
    };
    this.data.sources.push(newSource);
    this.saveData();
    return newSource.id;
  }

  updateSourceAllocation(key, allocation) {
    const source = this.getSourceByKey(key);
    if (source) {
      source.default_allocation = allocation;
      this.saveData();
    }
  }

  // Daily usage methods
  getDailyUsage(sourceId, date) {
    return this.data.dailyUsages.find(u => u.source_id === sourceId && u.date === date);
  }

  updateDailyUsage(sourceId, date, timeUsed, sessions, overrunTime) {
    let usage = this.getDailyUsage(sourceId, date);
    
    if (usage) {
      usage.time_used = timeUsed;
      usage.sessions = sessions;
      usage.overrun_time = overrunTime;
    } else {
      usage = {
        id: Date.now(), // Simple ID
        source_id: sourceId,
        date,
        time_used: timeUsed,
        sessions,
        overrun_time: overrunTime
      };
      this.data.dailyUsages.push(usage);
    }
    
    this.saveData();
    return usage;
  }

  getDailyUsages(date) {
    return this.data.dailyUsages
      .filter(u => u.date === date)
      .map(usage => {
        const source = this.data.sources.find(s => s.id === usage.source_id);
        return {
          ...usage,
          key: source?.key,
          name: source?.name,
          icon: source?.icon,
          default_allocation: source?.default_allocation
        };
      });
  }

  clearDailyData(date) {
    this.data.dailyUsages = this.data.dailyUsages.filter(u => u.date !== date);
    this.saveData();
  }

  // Settings methods
  getSettings() {
    return this.data.settings;
  }

  updateSettings(totalTimeLimit, autoStart) {
    this.data.settings.total_time_limit = totalTimeLimit;
    this.data.settings.auto_start = autoStart;
    this.saveData();
  }
}

module.exports = Storage;

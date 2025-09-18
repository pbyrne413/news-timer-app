// API service for communicating with the backend
class ApiService {
  constructor() {
    this.baseUrl = '/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get all sources with today's usage
  async getSources() {
    return this.request('/sources');
  }

  // Get user settings
  async getSettings() {
    return this.request('/settings');
  }

  // Update user settings
  async updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: settings,
    });
  }

  // Update source allocation
  async updateSourceAllocation(sourceKey, allocation) {
    return this.request(`/sources/${sourceKey}/allocation`, {
      method: 'PUT',
      body: { allocation },
    });
  }

  // Record timer usage
  async recordUsage(sourceKey, timeUsed, sessions, overrunTime) {
    return this.request('/usage', {
      method: 'POST',
      body: {
        sourceKey,
        timeUsed,
        sessions,
        overrunTime,
      },
    });
  }

  // Get daily stats
  async getStats() {
    return this.request('/stats');
  }

  // Reset daily data
  async resetData() {
    return this.request('/reset', {
      method: 'POST',
    });
  }

  // Add new source
  async addSource(sourceData) {
    return this.request('/sources', {
      method: 'POST',
      body: sourceData,
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create global instance
window.apiService = new ApiService();

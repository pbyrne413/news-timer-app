// API service for communicating with the backend
class ApiService {
  constructor() {
    this.baseUrl = '/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`🌐 API Request to ${endpoint}`, { 
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body 
    });

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const startTime = Date.now();
      const response = await fetch(url, config);
      const duration = Date.now() - startTime;
      
      console.log(`⏱️ API Response from ${endpoint} (${duration}ms)`, { 
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error from ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Success from ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`❌ API Request to ${endpoint} failed:`, {
        error: error.message,
        stack: error.stack
      });
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: sourceData,
    });
  }

  // Delete source
  async deleteSource(sourceKey) {
    return this.request(`/sources/${sourceKey}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create global instance
window.apiService = new ApiService();

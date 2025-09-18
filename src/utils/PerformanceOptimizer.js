// Performance optimizations for Vercel serverless functions
export class PerformanceOptimizer {
  // Edge caching for frequently accessed data
  static cache = new Map();
  static cacheExpiry = new Map();
  
  // Cache with TTL
  static set(key, value, ttlMs = 300000) { // 5 minutes default
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + ttlMs);
  }
  
  static get(key) {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key);
  }
  
  // Preload critical data to reduce cold start impact
  static async preloadCriticalData(container) {
    const cacheKey = 'critical_data';
    const cached = this.get(cacheKey);
    
    if (cached) return cached;
    
    try {
      const sourceService = container.get('sourceService');
      const settingsService = container.get('settingsService');
      
      const [sources, settings] = await Promise.all([
        sourceService.getSourcesWithUsage(),
        settingsService.getSettings()
      ]);
      
      const criticalData = { sources, settings };
      this.set(cacheKey, criticalData, 60000); // 1 minute cache
      
      return criticalData;
    } catch (error) {
      console.warn('Failed to preload critical data:', error);
      return null;
    }
  }
  
  // Optimize JSON responses
  static optimizeResponse(data) {
    return JSON.stringify(data, (key, value) => {
      // Convert BigInt to number for JSON serialization
      if (typeof value === 'bigint') {
        return Number(value);
      }
      return value;
    });
  }
  
  // Memory usage monitoring
  static getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    };
  }
}

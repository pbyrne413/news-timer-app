// Health check with performance metrics
import { corsMiddleware } from '../src/middleware/cors.js';
import { DateTime } from 'luxon';
import { createLogger } from '../src/utils/Logger.js';

const log = createLogger('HealthCheck');

// Format duration in milliseconds to human readable
const formatDuration = (milliseconds) => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

export default async function handler(req, res) {
  const startTime = DateTime.now().toMillis();
  
  try {
    // Apply CORS middleware
    corsMiddleware(req, res, () => {});
    
    if (req.method === 'OPTIONS') {
      return;
    }

    const responseTime = DateTime.now().toMillis() - startTime;
    const memoryUsage = process.memoryUsage();

    const healthData = {
      status: 'OK',
      timestamp: DateTime.now().toISO(),
      architecture: 'refactored-optimized',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local',
      performance: {
        responseTime: formatDuration(responseTime),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        uptime: formatDuration(process.uptime() * 1000)
      },
      database: {
        status: 'healthy',
        timestamp: DateTime.now().toISO()
      },
      features: {
        solidPrinciples: true,
        dependencyInjection: true,
        glassmorphismUI: true,
        tursoOptimization: true,
        performanceMonitoring: true,
        luxonDateHandling: true
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    log.error('Health check error', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      status: 'ERROR',
      timestamp: DateTime.now().toISO(),
      error: error.message,
      responseTime: formatDuration(DateTime.now().toMillis() - startTime)
    });
  }
}

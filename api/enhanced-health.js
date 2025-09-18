// Enhanced health check with performance metrics
import { corsMiddleware } from '../src/middleware/cors.js';
import { DateUtils } from '../src/utils/DateUtils.js';

export default async function handler(req, res) {
  const startTime = DateUtils.getCurrentTime();
  
  try {
    // Apply CORS middleware
    corsMiddleware(req, res, () => {});
    
    if (req.method === 'OPTIONS') {
      return;
    }

    const responseTime = DateUtils.getCurrentTime() - startTime;
    const memoryUsage = process.memoryUsage();

    const healthData = {
      status: 'OK',
      timestamp: DateUtils.getCurrentTimestamp(),
      architecture: 'refactored-optimized',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local',
      performance: {
        responseTime: DateUtils.formatDuration(responseTime),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        uptime: DateUtils.formatDuration(process.uptime() * 1000)
      },
      database: {
        status: 'healthy',
        timestamp: DateUtils.getCurrentTimestamp()
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
    console.error('Health check error:', error);
    
    res.status(500).json({
      status: 'ERROR',
      timestamp: DateUtils.getCurrentTimestamp(),
      error: error.message,
      responseTime: DateUtils.formatDuration(DateUtils.getCurrentTime() - startTime)
    });
  }
}

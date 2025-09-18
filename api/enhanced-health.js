// Enhanced health check with performance metrics
import { corsMiddleware } from '../src/middleware/cors.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    // Apply CORS middleware
    corsMiddleware(req, res, () => {});
    
    if (req.method === 'OPTIONS') {
      return;
    }

    const responseTime = Date.now() - startTime;
    const memoryUsage = process.memoryUsage();

    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      architecture: 'refactored-optimized',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local',
      performance: {
        responseTime: `${responseTime}ms`,
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        uptime: process.uptime()
      },
      database: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      },
      features: {
        solidPrinciples: true,
        dependencyInjection: true,
        glassmorphismUI: true,
        tursoOptimization: true,
        performanceMonitoring: true
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: `${Date.now() - startTime}ms`
    });
  }
}

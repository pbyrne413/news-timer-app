// Enhanced health check with Turso status and performance metrics
import { corsMiddleware } from '../src/middleware/cors.js';
import { TursoOptimizer } from '../src/utils/TursoOptimizer.js';
import { PerformanceOptimizer } from '../src/utils/PerformanceOptimizer.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    // Apply CORS middleware
    corsMiddleware(req, res, () => {});
    
    if (req.method === 'OPTIONS') {
      return;
    }

    // Perform comprehensive health checks
    const [tursoHealth, memoryUsage] = await Promise.all([
      TursoOptimizer.healthCheck(),
      Promise.resolve(PerformanceOptimizer.getMemoryUsage())
    ]);

    const responseTime = Date.now() - startTime;

    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      architecture: 'refactored-optimized',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'local',
      performance: {
        responseTime: `${responseTime}ms`,
        memory: memoryUsage,
        uptime: process.uptime()
      },
      database: tursoHealth,
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

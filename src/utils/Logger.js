// Centralized logging configuration using Winston
import winston from 'winston';
import { DateTime } from 'luxon';

// Custom format for JSON logging with timestamps
const jsonFormat = winston.format.combine(
  winston.format.timestamp({
    format: () => DateTime.now().toISO()
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: jsonFormat,
  defaultMeta: {
    service: 'news-timer-app',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: jsonFormat
    })
  ]
});

// Add file transport in production (but not in Vercel serverless)
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: jsonFormat
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    format: jsonFormat
  }));
}

// Create context-specific loggers
export const createLogger = (context = 'App') => {
  return {
    info: (message, meta = {}) => logger.info(message, { context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { context, ...meta }),
    error: (message, meta = {}) => logger.error(message, { context, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { context, ...meta }),
    
    // Specialized logging methods
    http: (req, res, responseTime) => {
      logger.info('HTTP Request', {
        context: 'HTTP',
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress
      });
    },
    
    security: (event, meta = {}) => {
      logger.warn('Security Event', {
        context: 'Security',
        event,
        ...meta
      });
    },
    
    performance: (operation, duration, meta = {}) => {
      logger.info('Performance Metric', {
        context: 'Performance',
        operation,
        duration: `${duration}ms`,
        ...meta
      });
    },
    
    database: (operation, meta = {}) => {
      logger.debug('Database Operation', {
        context: 'Database',
        operation,
        ...meta
      });
    }
  };
};

// Default logger instance
export const log = createLogger();

// Export winston instance for advanced usage
export { logger };

// Configuration management with enhanced security
import { createLogger } from '../utils/Logger.js';

const log = createLogger('Config');

const getEnvVar = (name, defaultValue = null, required = false) => {
  const value = process.env[name];
  
  if (required && (!value || value.trim() === '')) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  
  return value ? value.trim() : defaultValue;
};

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return defaultValue;
};

export const config = {
  // Server configuration
  server: {
    port: parseInt(getEnvVar('PORT', '3000')),
    env: getEnvVar('NODE_ENV', 'development'),
    host: getEnvVar('HOST', 'localhost'),
    trustProxy: parseBoolean(getEnvVar('TRUST_PROXY', 'false'))
  },

  // Database configuration - Turso support
  database: {
    url: getEnvVar('TURSO_DATABASE_URL', 'file:./database.sqlite'),
    authToken: getEnvVar('TURSO_AUTH_TOKEN'),
    // Vercel deployment considerations
    connectionTimeout: parseInt(getEnvVar('DB_CONNECTION_TIMEOUT', '30000')),
    maxRetries: parseInt(getEnvVar('DB_MAX_RETRIES', '3')),
    // Security: Enable WAL mode for better concurrency
    pragmas: {
      journal_mode: 'WAL',
      synchronous: 'NORMAL',
      cache_size: 1000,
      temp_store: 'MEMORY'
    }
  },

  // Security configuration
  security: {
    maxRequestSize: getEnvVar('MAX_REQUEST_SIZE', '1mb'), // Reduced from 10mb
    rateLimitWindow: parseInt(getEnvVar('RATE_LIMIT_WINDOW', '60000')), // 1 minute
    rateLimitMaxRequests: parseInt(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '100')),
    bcryptRounds: parseInt(getEnvVar('BCRYPT_ROUNDS', '12')),
    sessionSecret: getEnvVar('SESSION_SECRET', 'dev-secret-change-in-production'),
    csrfTokenLength: 32,
    maxLoginAttempts: parseInt(getEnvVar('MAX_LOGIN_ATTEMPTS', '5')),
    lockoutDuration: parseInt(getEnvVar('LOCKOUT_DURATION', '300000')) // 5 minutes
  },

  // Business rules configuration
  businessRules: {
    minAllocation: parseInt(getEnvVar('MIN_ALLOCATION', '60')),        // 1 minute
    maxAllocation: parseInt(getEnvVar('MAX_ALLOCATION', '3600')),      // 1 hour
    minTimeLimit: parseInt(getEnvVar('MIN_TIME_LIMIT', '60')),         // 1 minute
    maxTimeLimit: parseInt(getEnvVar('MAX_TIME_LIMIT', '7200')),       // 2 hours
    defaultAllocation: parseInt(getEnvVar('DEFAULT_ALLOCATION', '300')),   // 5 minutes
    defaultTimeLimit: parseInt(getEnvVar('DEFAULT_TIME_LIMIT', '1800'))    // 30 minutes
  },

  // API configuration
  api: {
    requestSizeLimit: getEnvVar('REQUEST_SIZE_LIMIT', '1mb'), // Reduced for security
    corsOrigins: getEnvVar('CORS_ORIGINS', '*').split(',').map(origin => origin.trim()),
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    // API versioning
    version: 'v1',
    basePath: '/api'
  }
};

// Validation of required configuration with security checks
export const validateConfig = () => {
  const errors = [];
  const warnings = [];
  
  // Required configuration
  if (!config.database.url) {
    errors.push('database.url is required');
  }

  // Security validations
  if (config.server.env === 'production') {
    if (config.security.sessionSecret === 'dev-secret-change-in-production') {
      errors.push('SESSION_SECRET must be set in production');
    }
    
    if (config.api.corsOrigins.includes('*')) {
      warnings.push('Wildcard CORS origin (*) detected in production - this is a security risk');
    }
    
    if (config.security.sessionSecret.length < 32) {
      warnings.push('SESSION_SECRET should be at least 32 characters long');
    }
  }

  // Database security checks
  if (config.database.url.startsWith('file:') && config.server.env === 'production') {
    warnings.push('Using local SQLite file in production - consider using Turso for better scalability');
  }

  // Rate limiting validation
  if (config.security.rateLimitMaxRequests > 1000) {
    warnings.push('Rate limit max requests is very high - consider lowering for better protection');
  }

  // Log warnings
  if (warnings.length > 0) {
    log.warn('Configuration warnings', { warnings });
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }
};

// Environment-specific configuration validation
export const getSecureConfig = () => {
  validateConfig();
  
  // Mask sensitive values in logs
  const safeConfig = JSON.parse(JSON.stringify(config));
  if (safeConfig.database.authToken) {
    safeConfig.database.authToken = '***masked***';
  }
  safeConfig.security.sessionSecret = '***masked***';
  
  return safeConfig;
};

export default config;

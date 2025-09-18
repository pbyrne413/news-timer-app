// Configuration management following Single Responsibility Principle
export const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  // Database configuration - Turso support
  database: {
    url: (process.env.TURSO_DATABASE_URL || 'file:./database.sqlite').trim(),
    authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
    // Vercel deployment considerations
    connectionTimeout: 30000, // 30 seconds
    maxRetries: 3
  },

  // Business rules configuration
  businessRules: {
    minAllocation: 60,        // 1 minute
    maxAllocation: 3600,      // 1 hour
    minTimeLimit: 60,         // 1 minute
    maxTimeLimit: 7200,       // 2 hours
    defaultAllocation: 300,   // 5 minutes
    defaultTimeLimit: 1800    // 30 minutes
  },

  // API configuration
  api: {
    requestSizeLimit: '10mb',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*']
  }
};

// Validation of required configuration
export const validateConfig = () => {
  const required = [];
  
  if (!config.database.url) {
    required.push('database.url');
  }

  if (required.length > 0) {
    throw new Error(`Missing required configuration: ${required.join(', ')}`);
  }
};

export default config;

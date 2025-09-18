import { AppError } from './errorHandler.js';
import { config } from '../config/index.js';
import { DateTime } from 'luxon';

// Enhanced input sanitization utilities
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocols
    .replace(/vbscript:/gi, '') // Remove vbscript: protocols
    .replace(/expression\s*\(/gi, '') // Remove CSS expressions
    .replace(/url\s*\(/gi, '') // Remove CSS url() functions
    .replace(/@import/gi, '') // Remove CSS @import
    .replace(/eval\s*\(/gi, '') // Remove eval() calls
    .replace(/setTimeout\s*\(/gi, '') // Remove setTimeout calls
    .replace(/setInterval\s*\(/gi, '') // Remove setInterval calls
    .replace(/document\./gi, '') // Remove document object access
    .replace(/window\./gi, '') // Remove window object access
    .replace(/\.innerHTML/gi, '') // Remove innerHTML access
    .replace(/\.outerHTML/gi, '') // Remove outerHTML access
    .trim();
};

const sanitizeInput = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return obj;
};

// Validation schemas using configuration
export const schemas = {
  updateSettings: {
    totalTimeLimit: { 
      type: 'number', 
      min: config.businessRules.minTimeLimit, 
      max: config.businessRules.maxTimeLimit, 
      required: true 
    },
    autoStart: { type: 'boolean', required: true }
  },
  
  recordUsage: {
    sourceKey: { type: 'string', required: true, minLength: 1 },
    timeUsed: { type: 'number', min: 0, required: true },
    sessions: { type: 'number', min: 0, required: true },
    overrunTime: { type: 'number', min: 0, required: false }
  },
  
  updateAllocation: {
    allocation: { 
      type: 'number', 
      min: config.businessRules.minAllocation, 
      max: config.businessRules.maxAllocation, 
      required: true 
    }
  },
  
  addSource: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    icon: { type: 'string', required: false, maxLength: 10 },
    url: { type: 'string', required: false, maxLength: 500 },
    allocation: { 
      type: 'number', 
      min: config.businessRules.minAllocation, 
      max: config.businessRules.maxAllocation, 
      required: false 
    }
  }
};

// Generic validator function with enhanced security
const validateField = (value, rules, fieldName) => {
  if (rules.required && (value === undefined || value === null || value === '')) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  if (value !== undefined && value !== null) {
    // Type validation
    if (rules.type === 'string' && typeof value !== 'string') {
      throw new AppError(`${fieldName} must be a string`, 400);
    }
    
    if (rules.type === 'number') {
      if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        throw new AppError(`${fieldName} must be a valid number`, 400);
      }
    }
    
    if (rules.type === 'boolean' && typeof value !== 'boolean') {
      throw new AppError(`${fieldName} must be a boolean`, 400);
    }

    // String validation with enhanced security checks
    if (rules.type === 'string') {
      // Check for potential XSS patterns
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /<form/i,
        /<input/i,
        /<textarea/i,
        /<select/i,
        /<button/i,
        /<link/i,
        /<meta/i,
        /<style/i,
        /<link/i,
        /data:/i,
        /vbscript:/i,
        /expression\s*\(/i,
        /url\s*\(/i,
        /@import/i,
        /eval\s*\(/i,
        /setTimeout\s*\(/i,
        /setInterval\s*\(/i,
        /document\./i,
        /window\./i,
        /\.innerHTML/i,
        /\.outerHTML/i,
        /\.insertAdjacentHTML/i,
        /\.write/i,
        /\.writeln/i
      ];
      
      if (dangerousPatterns.some(pattern => pattern.test(value))) {
        throw new AppError(`${fieldName} contains potentially dangerous content`, 400);
      }
      
      if (rules.minLength && value.length < rules.minLength) {
        throw new AppError(`${fieldName} must be at least ${rules.minLength} characters`, 400);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        throw new AppError(`${fieldName} must be no more than ${rules.maxLength} characters`, 400);
      }
      
      // Additional pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        throw new AppError(`${fieldName} format is invalid`, 400);
      }
    }

    // Number validation with overflow protection
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        throw new AppError(`${fieldName} must be at least ${rules.min}`, 400);
      }
      if (rules.max !== undefined && value > rules.max) {
        throw new AppError(`${fieldName} must be no more than ${rules.max}`, 400);
      }
      
      // Prevent integer overflow
      if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
        throw new AppError(`${fieldName} value is too large`, 400);
      }
    }
  }
};

// Validation middleware factory with sanitization
export const validate = (schemaName) => (req, res, next) => {
  try {
    const schema = schemas[schemaName];
    if (!schema) {
      throw new AppError(`Unknown validation schema: ${schemaName}`, 500);
    }

    // Sanitize all inputs before validation
    req.body = sanitizeInput(req.body || {});
    req.params = sanitizeInput(req.params || {});
    req.query = sanitizeInput(req.query || {});

    const data = { ...req.body, ...req.params, ...req.query };

    // Validate each field
    for (const [fieldName, rules] of Object.entries(schema)) {
      validateField(data[fieldName], rules, fieldName);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting middleware (simple in-memory implementation)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100; // requests per window

export const rateLimit = (req, res, next) => {
  const clientId = req.ip || req.connection.remoteAddress || 'unknown';
  const now = DateTime.now().toMillis();
  
  if (!requestCounts.has(clientId)) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = requestCounts.get(clientId);
  
  if (now > clientData.resetTime) {
    // Reset the counter
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (clientData.count >= MAX_REQUESTS) {
    res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
    return;
  }
  
  clientData.count++;
  next();
};

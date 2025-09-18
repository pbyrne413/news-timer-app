// Security configuration and utilities
import crypto from 'crypto';
import { createLogger } from '../utils/Logger.js';

const log = createLogger('Security');

// Security configuration
export const securityConfig = {
  // Token configuration
  token: {
    length: 32,
    expirationHours: 1,
    algorithm: 'sha256'
  },
  
  // Session configuration
  session: {
    duration: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 60 * 60 * 1000, // 1 hour
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  
  // Password requirements (if implemented)
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  },
  
  // Input validation
  input: {
    maxStringLength: 1000,
    maxNumberValue: Number.MAX_SAFE_INTEGER,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxFileSize: 5 * 1024 * 1024 // 5MB
  },
  
  // CORS configuration
  cors: {
    allowedOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400 // 24 hours
  }
};

// Generate cryptographically secure random string
export const generateSecureRandom = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate secure hash
export const generateHash = (data, salt = null) => {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(data + actualSalt).digest('hex');
  return { hash, salt: actualSalt };
};

// Verify hash
export const verifyHash = (data, hash, salt) => {
  const { hash: computedHash } = generateHash(data, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
};

// Generate secure token
export const generateSecureToken = (data = null) => {
  const payload = data || generateSecureRandom(16);
  const timestamp = Date.now().toString();
  const random = generateSecureRandom(16);
  
  return crypto.createHash('sha256')
    .update(payload + timestamp + random)
    .digest('hex');
};

// Validate token format
export const validateTokenFormat = (token) => {
  if (!token || typeof token !== 'string') return false;
  if (token.length < 32) return false;
  if (!/^[a-f0-9]+$/i.test(token)) return false;
  return true;
};

// Sanitize filename for security
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return 'unnamed';
  
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .substring(0, 255);
};

// Validate email format
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validate URL format
export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

// Check for SQL injection patterns
export const containsSqlInjection = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
    /(UNION\s+SELECT)/i,
    /(DROP\s+TABLE)/i,
    /(DELETE\s+FROM)/i,
    /(INSERT\s+INTO)/i,
    /(UPDATE\s+SET)/i,
    /(EXEC\s*\()/i,
    /(SCRIPT\s*\()/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

// Check for XSS patterns
export const containsXss = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /<style[^>]*>.*?<\/style>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onmouseover\s*=/gi,
    /onfocus\s*=/gi,
    /onblur\s*=/gi,
    /onchange\s*=/gi,
    /onsubmit\s*=/gi,
    /onreset\s*=/gi,
    /onselect\s*=/gi,
    /onkeydown\s*=/gi,
    /onkeyup\s*=/gi,
    /onkeypress\s*=/gi,
    /onmousedown\s*=/gi,
    /onmouseup\s*=/gi,
    /onmousemove\s*=/gi,
    /onmouseout\s*=/gi,
    /onmouseenter\s*=/gi,
    /onmouseleave\s*=/gi,
    /oncontextmenu\s*=/gi,
    /ondblclick\s*=/gi,
    /onwheel\s*=/gi,
    /onabort\s*=/gi,
    /oncanplay\s*=/gi,
    /oncanplaythrough\s*=/gi,
    /ondurationchange\s*=/gi,
    /onemptied\s*=/gi,
    /onended\s*=/gi,
    /onerror\s*=/gi,
    /onloadeddata\s*=/gi,
    /onloadedmetadata\s*=/gi,
    /onloadstart\s*=/gi,
    /onpause\s*=/gi,
    /onplay\s*=/gi,
    /onplaying\s*=/gi,
    /onprogress\s*=/gi,
    /onratechange\s*=/gi,
    /onseeked\s*=/gi,
    /onseeking\s*=/gi,
    /onstalled\s*=/gi,
    /onsuspend\s*=/gi,
    /ontimeupdate\s*=/gi,
    /onvolumechange\s*=/gi,
    /onwaiting\s*=/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /@import/gi,
    /eval\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /document\./gi,
    /window\./gi,
    /\.innerHTML/gi,
    /\.outerHTML/gi,
    /\.insertAdjacentHTML/gi,
    /\.write/gi,
    /\.writeln/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

// Security audit logging
export const logSecurityEvent = (event, details = {}) => {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    ...details
  };
  
  log.warn('Security event', logData);
};

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map();

// Rate limiting middleware
export const rateLimit = (options = {}) => {
  const config = { ...securityConfig.rateLimit, ...options };
  
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Clean up old entries
    for (const [key, data] of rateLimitStore.entries()) {
      if (data.windowStart < windowStart) {
        rateLimitStore.delete(key);
      }
    }
    
    // Get or create client data
    let clientData = rateLimitStore.get(clientId);
    if (!clientData || clientData.windowStart < windowStart) {
      clientData = {
        count: 0,
        windowStart: now
      };
    }
    
    // Check rate limit
    if (clientData.count >= config.maxRequests) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { clientId, count: clientData.count });
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((clientData.windowStart + config.windowMs - now) / 1000)
      });
    }
    
    // Increment counter
    clientData.count++;
    rateLimitStore.set(clientId, clientData);
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - clientData.count));
    res.setHeader('X-RateLimit-Reset', new Date(clientData.windowStart + config.windowMs).toISOString());
    
    next();
  };
};

export default {
  securityConfig,
  generateSecureRandom,
  generateHash,
  verifyHash,
  generateSecureToken,
  validateTokenFormat,
  sanitizeFilename,
  validateEmail,
  validateUrl,
  containsSqlInjection,
  containsXss,
  logSecurityEvent,
  rateLimit
};

import { AppError } from './errorHandler.js';
import { config } from '../config/index.js';
import { DateTime } from 'luxon';

// Simple authentication middleware for sensitive operations
// In a real application, you'd use proper JWT or session-based auth

const ADMIN_TOKENS = new Set();
const FAILED_ATTEMPTS = new Map();

// Generate a simple admin token (in production, use proper JWT)
export const generateAdminToken = () => {
  const token = Math.random().toString(36).substring(2) + DateTime.now().toMillis().toString(36);
  ADMIN_TOKENS.add(token);
  
  // Token expires in 1 hour
  setTimeout(() => {
    ADMIN_TOKENS.delete(token);
  }, 3600000);
  
  return token;
};

// Rate limiting for failed authentication attempts
const checkRateLimit = (clientId) => {
  const now = DateTime.now().toMillis();
  const attempts = FAILED_ATTEMPTS.get(clientId);
  
  if (!attempts) {
    FAILED_ATTEMPTS.set(clientId, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > config.security.lockoutDuration) {
    attempts.count = 1;
    attempts.lastAttempt = now;
    return true;
  }
  
  // Check if locked out
  if (attempts.count >= config.security.maxLoginAttempts) {
    return false;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
};

// Authentication middleware for sensitive operations
export const requireAuth = (req, res, next) => {
  const clientId = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Check rate limiting first
  if (!checkRateLimit(clientId)) {
    const attempts = FAILED_ATTEMPTS.get(clientId);
    const remainingTime = Math.ceil((config.security.lockoutDuration - (Date.now() - attempts.lastAttempt)) / 1000);
    
    throw new AppError(
      `Too many failed authentication attempts. Try again in ${remainingTime} seconds.`,
      429,
      'AUTH_RATE_LIMIT_EXCEEDED'
    );
  }
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required for this operation', 401, 'AUTH_REQUIRED');
  }
  
  const token = authHeader.substring(7);
  
  if (!ADMIN_TOKENS.has(token)) {
    // Record failed attempt
    const attempts = FAILED_ATTEMPTS.get(clientId) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    FAILED_ATTEMPTS.set(clientId, attempts);
    
    throw new AppError('Invalid authentication token', 401, 'AUTH_INVALID_TOKEN');
  }
  
  // Reset failed attempts on successful auth
  FAILED_ATTEMPTS.delete(clientId);
  
  next();
};

// Optional authentication - allows both authenticated and unauthenticated requests
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    req.isAuthenticated = ADMIN_TOKENS.has(token);
    req.authToken = token;
  } else {
    req.isAuthenticated = false;
  }
  
  next();
};

// Development-only endpoint to get admin token
export const getDevToken = (req, res) => {
  if (config.server.env === 'production') {
    throw new AppError('This endpoint is not available in production', 404);
  }
  
  const token = generateAdminToken();
  res.json({
    token,
    message: 'Development admin token generated. Use as: Authorization: Bearer ' + token,
    expiresIn: '1 hour'
  });
};

// Cleanup old failed attempts periodically
setInterval(() => {
  const now = DateTime.now().toMillis();
  for (const [clientId, attempts] of FAILED_ATTEMPTS.entries()) {
    if (now - attempts.lastAttempt > config.security.lockoutDuration * 2) {
      FAILED_ATTEMPTS.delete(clientId);
    }
  }
}, 300000); // Clean up every 5 minutes

import { AppError } from './errorHandler.js';
import { config } from '../config/index.js';
import { DateTime } from 'luxon';
import crypto from 'crypto';

// Enhanced authentication middleware for sensitive operations
// Uses cryptographically secure random token generation

const ADMIN_TOKENS = new Map(); // Store tokens with expiration times
const FAILED_ATTEMPTS = new Map();

// Generate a cryptographically secure admin token
export const generateAdminToken = () => {
  // Use crypto.randomBytes for secure random generation
  const randomBytes = crypto.randomBytes(32);
  const timestamp = DateTime.now().toMillis();
  const token = randomBytes.toString('hex') + timestamp.toString(16);
  
  const expirationTime = DateTime.now().plus({ hours: 1 }).toMillis();
  ADMIN_TOKENS.set(token, expirationTime);
  
  // Clean up expired tokens
  cleanupExpiredTokens();
  
  return token;
};

// Clean up expired tokens
const cleanupExpiredTokens = () => {
  const now = DateTime.now().toMillis();
  for (const [token, expiration] of ADMIN_TOKENS.entries()) {
    if (now > expiration) {
      ADMIN_TOKENS.delete(token);
    }
  }
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
  
  // Check if token exists and is not expired
  const expirationTime = ADMIN_TOKENS.get(token);
  if (!expirationTime || DateTime.now().toMillis() > expirationTime) {
    // Clean up expired token
    if (expirationTime) {
      ADMIN_TOKENS.delete(token);
    }
    
    // Record failed attempt
    const attempts = FAILED_ATTEMPTS.get(clientId) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    FAILED_ATTEMPTS.set(clientId, attempts);
    
    throw new AppError('Invalid or expired authentication token', 401, 'AUTH_INVALID_TOKEN');
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
    const expirationTime = ADMIN_TOKENS.get(token);
    req.isAuthenticated = expirationTime && DateTime.now().toMillis() <= expirationTime;
    req.authToken = token;
    
    // Clean up expired token
    if (expirationTime && DateTime.now().toMillis() > expirationTime) {
      ADMIN_TOKENS.delete(token);
      req.isAuthenticated = false;
    }
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

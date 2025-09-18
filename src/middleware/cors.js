import { config } from '../config/index.js';
import { createLogger } from '../utils/Logger.js';
import crypto from 'crypto';

const log = createLogger('CORS');

// Generate a cryptographically secure nonce for CSP
const generateNonce = () => {
  return crypto.randomBytes(16).toString('base64');
};

// CORS middleware with enhanced security
export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = config.api.corsOrigins;
  
  // Only allow specific origins in production
  if (config.server.env === 'production') {
    if (allowedOrigins.includes('*')) {
      log.security('Wildcard CORS origin detected in production', { 
        origin: origin,
        environment: config.server.env 
      });
    }
    
    if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  } else {
    // Development: allow localhost and configured origins
    const isDevelopmentOrigin = origin && (
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') ||
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*')
    );
    
    if (isDevelopmentOrigin || allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
  }
  
  // Security headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Enhanced security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(self), sync-xhr=()');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  
  // Content Security Policy - Enhanced security without unsafe-inline
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'nonce-" + generateNonce() + "' https://vercel.live",
    "style-src 'self' 'nonce-" + generateNonce() + "'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.vercel.com",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  
  // HSTS in production
  if (config.server.env === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

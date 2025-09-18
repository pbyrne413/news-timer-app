import { config } from '../config/index.js';

// CORS middleware with enhanced security
export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = config.api.corsOrigins;
  
  // Only allow specific origins in production
  if (config.server.env === 'production') {
    if (allowedOrigins.includes('*')) {
      console.warn('SECURITY WARNING: Wildcard CORS origin detected in production');
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
  
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.vercel.com",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
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

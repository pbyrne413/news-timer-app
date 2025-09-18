// Centralized error handling middleware
export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

import { config } from '../config/index.js';
import { DateTime } from 'luxon';

// Secure error logging without exposing sensitive info
const logError = (error, req) => {
  const logData = {
    message: error.message,
    url: req.url,
    method: req.method,
    timestamp: DateTime.now().toISO(),
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    ...(config.server.env === 'development' && { stack: error.stack })
  };
  
  console.error('Error occurred:', logData);
};

export const errorHandler = (error, req, res, next) => {
  // Log error securely
  logError(error, req);

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';

  // Handle known operational errors
  if (error.isOperational) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'OPERATIONAL_ERROR';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid request data';
    code = 'VALIDATION_ERROR';
  } else if (error.code === 'SQLITE_CONSTRAINT') {
    statusCode = 409;
    message = 'Data constraint violation';
    code = 'CONSTRAINT_ERROR';
  } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    statusCode = 400;
    message = 'Invalid JSON format';
    code = 'JSON_PARSE_ERROR';
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service temporarily unavailable';
    code = 'SERVICE_UNAVAILABLE';
  }

  // Security: Never expose stack traces or internal errors in production
  const response = {
    error: message,
    code: code,
    timestamp: new Date().toISOString()
  };

  // Only include debugging info in development
  if (config.server.env === 'development') {
    response.debug = {
      originalMessage: error.message,
      stack: error.stack,
      name: error.name
    };
  }

  res.status(statusCode).json(response);
};

// Async error wrapper to catch async errors
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

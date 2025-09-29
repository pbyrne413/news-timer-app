import { asyncHandler } from '../middleware/errorHandler.js';

// Base controller implementing common patterns
export class BaseController {
  constructor(container) {
    this.container = container;
  }

  // Factory method for creating route handlers with dependency injection
  createHandler(handlerMethod) {
    return async (req, res, next) => {
      console.log('🎯 BaseController.createHandler executing method:', handlerMethod.name);
      try {
        await handlerMethod.call(this, req, res, next);
        console.log('✅ Handler completed successfully');
      } catch (error) {
        console.error('❌ Handler failed:', error);
        if (next) {
          next(error);
        } else {
          throw error;
        }
      }
    };
  }

  // Standardized success response
  sendSuccess(res, data, statusCode = 200) {
    res.status(statusCode).json(data);
  }

  // Method not allowed helper
  sendMethodNotAllowed(res, allowedMethods) {
    res.setHeader('Allow', allowedMethods);
    res.status(405).json({ error: `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}` });
  }
}

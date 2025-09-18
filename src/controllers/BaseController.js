import { asyncHandler } from '../middleware/errorHandler.js';

// Base controller implementing common patterns
export class BaseController {
  constructor(container) {
    this.container = container;
  }

  // Factory method for creating route handlers with dependency injection
  createHandler(handlerMethod) {
    return asyncHandler(async (req, res, next) => {
      await handlerMethod.call(this, req, res, next);
    });
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

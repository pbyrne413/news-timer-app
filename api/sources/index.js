// Vercel serverless function using refactored architecture with enhanced security
import { ServiceContainer } from '../../src/container/ServiceContainer.js';
import { SourceController } from '../../src/controllers/SourceController.js';
import { corsMiddleware } from '../../src/middleware/cors.js';
import { validate, rateLimit } from '../../src/middleware/validation.js';
import { errorHandler, asyncHandler } from '../../src/middleware/errorHandler.js';

// Initialize container for serverless environment
const container = new ServiceContainer();

export default asyncHandler(async function handler(req, res) {
  // Apply CORS middleware
  corsMiddleware(req, res, () => {});
  
  if (req.method === 'OPTIONS') {
    return;
  }

  // Skip rate limiting for now to test if that's causing the issue
  // rateLimit(req, res, () => {});

  // Initialize container if not already done
  await container.initialize();

  // Create controller instance
  const sourceController = new SourceController(container);

  if (req.method === 'GET') {
    await sourceController.getSources(req, res);
  } else if (req.method === 'POST') {
    // Skip validation for now to test if that's causing the issue
    await sourceController.addSource(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ 
      error: `Method ${req.method} Not Allowed`,
      code: 'METHOD_NOT_ALLOWED'
    });
  }
});

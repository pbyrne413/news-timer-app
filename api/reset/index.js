// Vercel serverless function using refactored architecture with enhanced security
import { ServiceContainer } from '../../src/container/ServiceContainer.js';
import { ResetController } from '../../src/controllers/ResetController.js';
import { corsMiddleware } from '../../src/middleware/cors.js';
import { errorHandler, asyncHandler } from '../../src/middleware/errorHandler.js';
import { requireAuth } from '../../src/middleware/auth.js';
import { rateLimit } from '../../src/middleware/validation.js';

// Initialize container for serverless environment
const container = new ServiceContainer();

export default asyncHandler(async function handler(req, res) {
  // Apply CORS middleware
  corsMiddleware(req, res, () => {});
  
  if (req.method === 'OPTIONS') {
    return;
  }

  // Apply rate limiting
  rateLimit(req, res, () => {});

  // Initialize container if not already done
  await container.initialize();

  // Create controller instance
  const resetController = new ResetController(container);

  if (req.method === 'POST') {
    // SECURITY: Require authentication for destructive operations
    requireAuth(req, res, () => {});
    await resetController.resetData(req, res);
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ 
      error: `Method ${req.method} Not Allowed`,
      code: 'METHOD_NOT_ALLOWED'
    });
  }
});

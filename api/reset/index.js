// Vercel serverless function using refactored architecture with enhanced security
import { ServiceContainer } from '../../src/container/ServiceContainer.js';
import { ResetController } from '../../src/controllers/ResetController.js';
import { corsMiddleware } from '../../src/middleware/cors.js';
import { errorHandler, asyncHandler } from '../../src/middleware/errorHandler.js';
import { validateToken } from '../../src/middleware/auth.js';
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
    try {
      // Check authentication manually since we're in serverless
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ 
          error: 'Authentication required for this operation',
          code: 'AUTH_REQUIRED'
        });
        return;
      }
      
      const token = authHeader.substring(7);
      
      // Validate token
      if (!validateToken(token)) {
        res.status(401).json({ 
          error: 'Invalid or expired authentication token',
          code: 'AUTH_INVALID_TOKEN'
        });
        return;
      }
      
      // Authentication successful, proceed with reset
      await resetController.resetData(req, res);
    } catch (error) {
      console.error('Reset error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ 
      error: `Method ${req.method} Not Allowed`,
      code: 'METHOD_NOT_ALLOWED'
    });
  }
});

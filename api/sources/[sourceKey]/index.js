// Vercel serverless function for individual source operations
import { ServiceContainer } from '../../../src/container/ServiceContainer.js';
import { SourceController } from '../../../src/controllers/SourceController.js';
import { corsMiddleware } from '../../../src/middleware/cors.js';
import { errorHandler, asyncHandler } from '../../../src/middleware/errorHandler.js';

// Initialize container for serverless environment
const container = new ServiceContainer();

export default asyncHandler(async function handler(req, res) {
  // Apply CORS middleware
  corsMiddleware(req, res, () => {});
  
  if (req.method === 'OPTIONS') {
    return;
  }

  // Initialize container if not already done
  await container.initialize();

  // Create controller instance
  const sourceController = new SourceController(container);

  if (req.method === 'DELETE') {
    // Move sourceKey from query to params for consistency with controller
    req.params = { sourceKey: req.query.sourceKey };
    
    await sourceController.deleteSource(req, res);
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).json({ 
      error: `Method ${req.method} Not Allowed`,
      code: 'METHOD_NOT_ALLOWED'
    });
  }
});

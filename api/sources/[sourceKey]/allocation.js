// Vercel serverless function using refactored architecture
import { ServiceContainer } from '../../../src/container/ServiceContainer.js';
import { SourceController } from '../../../src/controllers/SourceController.js';
import { corsMiddleware } from '../../../src/middleware/cors.js';
import { validate } from '../../../src/middleware/validation.js';
import { errorHandler } from '../../../src/middleware/errorHandler.js';

// Initialize container for serverless environment
const container = new ServiceContainer();

export default async function handler(req, res) {
  try {
    // Apply CORS middleware
    corsMiddleware(req, res, () => {});
    
    if (req.method === 'OPTIONS') {
      return;
    }

    // Initialize container if not already done
    await container.initialize();

    // Create controller instance
    const sourceController = new SourceController(container);

    if (req.method === 'PUT') {
      // Move sourceKey from query to params for consistency with controller
      req.params = { sourceKey: req.query.sourceKey };
      
      // Apply validation middleware
      await new Promise((resolve, reject) => {
        validate('updateAllocation')(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await sourceController.updateAllocation(req, res);
    } else {
      res.setHeader('Allow', ['PUT']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

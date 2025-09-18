// Vercel serverless function using refactored architecture
import { ServiceContainer } from '../../src/container/ServiceContainer.js';
import { SourceController } from '../../src/controllers/SourceController.js';
import { corsMiddleware } from '../../src/middleware/cors.js';
import { validate } from '../../src/middleware/validation.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

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

    if (req.method === 'GET') {
      await sourceController.getSources(req, res);
    } else if (req.method === 'POST') {
      // Apply validation middleware
      await new Promise((resolve, reject) => {
        validate('addSource')(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await sourceController.addSource(req, res);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

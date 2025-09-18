// Vercel serverless function using refactored architecture
import { ServiceContainer } from '../../src/container/ServiceContainer.js';
import { UsageController } from '../../src/controllers/UsageController.js';
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
    const usageController = new UsageController(container);

    if (req.method === 'POST') {
      // Apply validation middleware
      await new Promise((resolve, reject) => {
        validate('recordUsage')(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Handle the request
      await usageController.recordUsage(req, res);
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

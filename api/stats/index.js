// Vercel serverless function using refactored architecture
import { ServiceContainer } from '../../src/container/ServiceContainer.js';
import { StatsController } from '../../src/controllers/StatsController.js';
import { corsMiddleware } from '../../src/middleware/cors.js';
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
    const statsController = new StatsController(container);

    if (req.method === 'GET') {
      await statsController.getStats(req, res);
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

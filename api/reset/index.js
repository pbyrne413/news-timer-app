// Vercel serverless function using refactored architecture
import { ServiceContainer } from '../../src/container/ServiceContainer.js';
import { ResetController } from '../../src/controllers/ResetController.js';
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
    const resetController = new ResetController(container);

    if (req.method === 'POST') {
      await resetController.resetData(req, res);
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

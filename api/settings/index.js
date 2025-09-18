// Vercel serverless function using refactored architecture
import { ServiceContainer } from '../../src/container/ServiceContainer.js';
import { SettingsController } from '../../src/controllers/SettingsController.js';
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
    const settingsController = new SettingsController(container);

    if (req.method === 'GET') {
      await settingsController.getSettings(req, res);
    } else if (req.method === 'PUT') {
      // Apply validation middleware
      await new Promise((resolve, reject) => {
        validate('updateSettings')(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await settingsController.updateSettings(req, res);
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    errorHandler(error, req, res, () => {});
  }
}

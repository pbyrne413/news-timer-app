// Router factory following Open/Closed Principle
import express from 'express';
import { corsMiddleware } from '../middleware/cors.js';
import { validate } from '../middleware/validation.js';
import { DateTime } from 'luxon';
import { SourceController } from '../controllers/SourceController.js';
import { UsageController } from '../controllers/UsageController.js';
import { StatsController } from '../controllers/StatsController.js';
import { SettingsController } from '../controllers/SettingsController.js';
import { ResetController } from '../controllers/ResetController.js';

export class ApiRouter {
  constructor(container) {
    this.container = container;
    this.router = express.Router();
    this._setupMiddleware();
    this._setupRoutes();
  }

  _setupMiddleware() {
    // Apply CORS to all routes
    this.router.use(corsMiddleware);
  }

  _setupRoutes() {
    // Initialize controllers with dependency injection
    const sourceController = new SourceController(this.container);
    const usageController = new UsageController(this.container);
    const statsController = new StatsController(this.container);
    const settingsController = new SettingsController(this.container);
    const resetController = new ResetController(this.container);

    // Health check endpoint
    this.router.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: DateTime.now().toISO() });
    });

    // Source routes
    this.router.get('/sources', sourceController.getSources);
    this.router.post('/sources', validate('addSource'), sourceController.addSource);
    
    this.router.put('/sources/:sourceKey/allocation', 
      validate('updateAllocation'), 
      sourceController.updateAllocation
    );

    // Usage routes
    this.router.post('/usage', 
      validate('recordUsage'), 
      usageController.recordUsage
    );

    // Stats routes
    this.router.get('/stats', statsController.getStats);

    // Settings routes
    this.router.route('/settings')
      .get(settingsController.getSettings)
      .put(validate('updateSettings'), settingsController.updateSettings);

    // Reset routes
    this.router.post('/reset', resetController.resetData);
  }

  getRouter() {
    return this.router;
  }
}

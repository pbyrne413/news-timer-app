import { BaseController } from './BaseController.js';

export class SettingsController extends BaseController {
  constructor(container) {
    super(container);
    this.settingsService = container.get('settingsService');
  }

  // GET /api/settings - Get user settings
  getSettings = this.createHandler(async (req, res) => {
    const settings = await this.settingsService.getSettings();
    this.sendSuccess(res, settings);
  });

  // PUT /api/settings - Update user settings
  updateSettings = this.createHandler(async (req, res) => {
    const result = await this.settingsService.updateSettings(req.body);
    this.sendSuccess(res, result);
  });

  // Combined handler for both GET and PUT
  handleSettings = this.createHandler(async (req, res) => {
    if (req.method === 'GET') {
      return this.getSettings(req, res);
    } else if (req.method === 'PUT') {
      return this.updateSettings(req, res);
    } else {
      return this.sendMethodNotAllowed(res, ['GET', 'PUT']);
    }
  });
}

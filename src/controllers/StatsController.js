import { BaseController } from './BaseController.js';

export class StatsController extends BaseController {
  constructor(container) {
    super(container);
    this.usageService = container.get('usageService');
  }

  // GET /api/stats - Get daily statistics
  getStats = this.createHandler(async (req, res) => {
    const stats = await this.usageService.getDailyStats();
    this.sendSuccess(res, stats);
  });
}

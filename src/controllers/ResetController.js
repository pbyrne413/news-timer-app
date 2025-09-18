import { BaseController } from './BaseController.js';

export class ResetController extends BaseController {
  constructor(container) {
    super(container);
    this.usageService = container.get('usageService');
  }

  // POST /api/reset - Reset daily data
  resetData = this.createHandler(async (req, res) => {
    const result = await this.usageService.resetDailyData();
    this.sendSuccess(res, result);
  });
}

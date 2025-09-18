import { BaseController } from './BaseController.js';

export class UsageController extends BaseController {
  constructor(container) {
    super(container);
    this.usageService = container.get('usageService');
  }

  // POST /api/usage - Record usage data
  recordUsage = this.createHandler(async (req, res) => {
    const result = await this.usageService.recordUsage(req.body);
    this.sendSuccess(res, result);
  });
}

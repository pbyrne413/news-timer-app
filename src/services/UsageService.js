import { BaseService } from './BaseService.js';
import { AppError } from '../middleware/errorHandler.js';

export class UsageService extends BaseService {
  constructor(database) {
    super(database);
  }

  // Record timer usage - implements business logic encapsulation
  async recordUsage(usageData) {
    return this.executeWithConnection(async () => {
      const { sourceKey, timeUsed, sessions, overrunTime = 0 } = usageData;
      
      // Business rule: Validate usage data
      if (timeUsed < 0 || sessions < 0 || overrunTime < 0) {
        throw new AppError('Usage values cannot be negative', 400);
      }

      // Business rule: Ensure source exists
      const source = await this.db.getSourceByKey(sourceKey);
      if (!source) {
        throw new AppError('Source not found', 404);
      }
      
      const today = this.getCurrentDate();
      await this.db.updateDailyUsage(source.id, today, timeUsed, sessions, overrunTime);
      
      return { success: true };
    });
  }

  // Get comprehensive daily statistics
  async getDailyStats() {
    return this.executeWithConnection(async () => {
      const today = this.getCurrentDate();
      const todayUsages = await this.db.getDailyUsages(today);
      
      return this._calculateStats(todayUsages);
    });
  }

  // Reset daily data with business validation
  async resetDailyData() {
    return this.executeWithConnection(async () => {
      const today = this.getCurrentDate();
      
      // Business rule: Log reset operation for audit
      console.log(`Resetting daily data for ${today}`);
      
      await this.db.clearDailyData(today);
      return { success: true };
    });
  }

  // Private helper method implementing calculation logic
  _calculateStats(usages) {
    return {
      totalTimeUsed: usages.reduce((sum, usage) => sum + usage.time_used, 0),
      totalSessions: usages.reduce((sum, usage) => sum + usage.sessions, 0),
      totalOverrun: usages.reduce((sum, usage) => sum + usage.overrun_time, 0),
      sourcesUsed: usages.length,
      averageSessionTime: usages.length > 0 
        ? Math.round(usages.reduce((sum, usage) => sum + usage.time_used, 0) / usages.reduce((sum, usage) => sum + usage.sessions, 0))
        : 0
    };
  }
}

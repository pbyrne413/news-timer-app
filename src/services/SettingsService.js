import { BaseService } from './BaseService.js';
import { AppError } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';

export class SettingsService extends BaseService {
  constructor(database) {
    super(database);
  }

  // Get user settings with defaults
  async getSettings() {
    return this.executeWithConnection(async () => {
      const settings = await this.db.getSettings();
      
      // Business rule: Always return valid settings, use defaults if none exist
      if (!settings) {
        return this._getDefaultSettings();
      }
      
      return this._mapSettingsToResponse(settings);
    });
  }

  // Update user settings with validation
  async updateSettings(settingsData) {
    return this.executeWithConnection(async () => {
      const { totalTimeLimit, autoStart } = settingsData;
      
      // Business rules: Validate settings
      if (totalTimeLimit < config.businessRules.minTimeLimit || totalTimeLimit > config.businessRules.maxTimeLimit) {
        throw new AppError(`Total time limit must be between ${config.businessRules.minTimeLimit} and ${config.businessRules.maxTimeLimit} seconds`, 400);
      }

      if (typeof autoStart !== 'boolean') {
        throw new AppError('Auto start must be a boolean value', 400);
      }
      
      await this.db.updateSettings(totalTimeLimit, autoStart);
      return { success: true };
    });
  }

  // Private helper methods
  _getDefaultSettings() {
    return {
      totalTimeLimit: config.businessRules.defaultTimeLimit,
      autoStart: false
    };
  }

  _mapSettingsToResponse(settings) {
    return {
      totalTimeLimit: settings.total_time_limit,
      autoStart: settings.auto_start
    };
  }
}

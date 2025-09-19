import { BaseService } from './BaseService.js';
import { AppError } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';

export class SourceService extends BaseService {
  constructor(database) {
    super(database);
  }

  // Get all sources with today's usage - implements Information Expert pattern
  async getSourcesWithUsage() {
    return this.executeWithConnection(async () => {
      const today = this.getCurrentDate();
      const sources = await this.db.getSources();
      
      const sourcesWithUsage = await Promise.all(
        sources.map(async (source) => {
          const usage = await this.db.getDailyUsage(source.id, today);
          
          return this._mapSourceToResponse(source, usage);
        })
      );
      
      return sourcesWithUsage;
    });
  }

  // Add new source with business validation
  async addSource(sourceData) {
    return this.executeWithConnection(async () => {
      const { name, icon = '📰', url, allocation = config.businessRules.defaultAllocation } = sourceData;
      
      const key = this._generateSourceKey(name);
      
      // Business rule: Check if source already exists
      const existingSource = await this.db.getSourceByKey(key);
      if (existingSource) {
        throw new AppError('Source already exists', 400);
      }

      // Business rule: Validate allocation range
      if (allocation < config.businessRules.minAllocation || allocation > config.businessRules.maxAllocation) {
        throw new AppError(`Allocation must be between ${config.businessRules.minAllocation} and ${config.businessRules.maxAllocation} seconds`, 400);
      }

      // Business rule: Validate URL format if provided
      if (url && !this._isValidUrl(url)) {
        throw new AppError('Invalid URL format', 400);
      }
      
      const sourceId = await this.db.addSource(key, name, icon, url, allocation);
      
      return {
        key,
        name,
        icon,
        url,
        allocated: allocation,
        used: 0,
        sessions: 0,
        overrunTime: 0
      };
    });
  }

  // Update source allocation
  async updateSourceAllocation(sourceKey, allocation) {
    return this.executeWithConnection(async () => {
      // Business rule: Validate allocation range
      if (allocation < config.businessRules.minAllocation || allocation > config.businessRules.maxAllocation) {
        throw new AppError(`Allocation must be between ${config.businessRules.minAllocation} and ${config.businessRules.maxAllocation} seconds`, 400);
      }

      // Business rule: Ensure source exists
      const source = await this.db.getSourceByKey(sourceKey);
      if (!source) {
        throw new AppError('Source not found', 404);
      }
      
      await this.db.updateSourceAllocation(sourceKey, allocation);
      return { success: true };
    });
  }

  // Delete source
  async deleteSource(sourceKey) {
    return this.executeWithConnection(async () => {
      // Business rule: Ensure source exists
      const source = await this.db.getSourceByKey(sourceKey);
      if (!source) {
        throw new AppError('Source not found', 404);
      }

      // Business rule: Allow deletion of all sources since we're now fully dynamic
      // No default sources to protect

      await this.db.deleteSource(source.id);
      return { success: true };
    });
  }

  // Private helper methods following Single Responsibility Principle
  _generateSourceKey(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  _mapSourceToResponse(source, usage) {
    return {
      key: source.key,
      name: source.name,
      icon: source.icon,
      url: source.url,
      favicon_url: source.favicon_url,
      allocated: source.default_allocation,
      used: usage ? usage.time_used : 0,
      sessions: usage ? usage.sessions : 0,
      overrunTime: usage ? usage.overrun_time : 0
    };
  }

  _isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

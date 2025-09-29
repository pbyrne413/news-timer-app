// Dependency Injection Container implementing Inversion of Control
import Database from '../../database.js';
import { SourceService } from '../services/SourceService.js';
import { UsageService } from '../services/UsageService.js';
import { SettingsService } from '../services/SettingsService.js';
import { createLogger } from '../utils/Logger.js';

export class ServiceContainer {
  constructor() {
    this._services = new Map();
    this._singletons = new Map();
    this._initialized = false;
  }

  // Register service factory - supports both singleton and transient lifecycles
  register(name, factory, options = { singleton: true }) {
    this._services.set(name, { factory, options });
    return this;
  }

  // Resolve service from container
  get(name) {
    const serviceConfig = this._services.get(name);
    if (!serviceConfig) {
      throw new Error(`Service '${name}' not found in container`);
    }

    const { factory, options } = serviceConfig;

    // Return singleton instance if configured
    if (options.singleton && this._singletons.has(name)) {
      return this._singletons.get(name);
    }

    // Create new instance
    const instance = factory(this);

    // Store singleton instance
    if (options.singleton) {
      this._singletons.set(name, instance);
    }

    return instance;
  }

  // Initialize all services and their dependencies
  async initialize() {
    if (this._initialized) return;

    // Register core services
    this._registerCoreServices();
    
    this._initialized = true;
  }

  _registerCoreServices() {
    // Register logger as singleton
    const logger = createLogger('API');
    this.register('logger', () => logger, { singleton: true });

    // Register database as singleton
    this.register('database', () => new Database(), { singleton: true });

    // Register business services with database dependency
    this.register('sourceService', (container) => 
      new SourceService(container.get('database')), { singleton: true });
    
    this.register('usageService', (container) => 
      new UsageService(container.get('database')), { singleton: true });
    
    this.register('settingsService', (container) => 
      new SettingsService(container.get('database')), { singleton: true });
  }

  // Clean shutdown of all services
  async shutdown() {
    const database = this._singletons.get('database');
    if (database) {
      database.close();
    }
    
    this._singletons.clear();
    this._initialized = false;
  }
}

// Global container instance
export const container = new ServiceContainer();

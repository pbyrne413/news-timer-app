// Application factory following SOLID principles
import express from 'express';
import { container } from './container/ServiceContainer.js';
import { ApiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export class Application {
  constructor() {
    this.app = express();
    this.container = container;
    this._initialized = false;
  }

  async initialize() {
    if (this._initialized) return;

    // Initialize dependency injection container
    await this.container.initialize();

    // Setup middleware
    this._setupMiddleware();

    // Setup routes
    this._setupRoutes();

    // Setup error handling (must be last)
    this._setupErrorHandling();

    this._initialized = true;
  }

  _setupMiddleware() {
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Static file serving
    this.app.use(express.static('.'));
  }

  _setupRoutes() {
    // API routes with dependency injection
    const apiRouter = new ApiRouter(this.container);
    this.app.use('/api', apiRouter.getRouter());

    // Root route
    this.app.get('/', (req, res) => {
      res.sendFile('index.html', { root: '.' });
    });
  }

  _setupErrorHandling() {
    // Global error handler must be last middleware
    this.app.use(errorHandler);
  }

  async start(port = process.env.PORT || 3000) {
    if (!this._initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const server = this.app.listen(port, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Server running on port ${port}`);
          console.log(`Visit http://localhost:${port} to use the app`);
          resolve(server);
        }
      });

      // Graceful shutdown handling
      process.on('SIGTERM', async () => {
        console.log('SIGTERM received, shutting down gracefully');
        server.close(async () => {
          await this.container.shutdown();
          process.exit(0);
        });
      });

      process.on('SIGINT', async () => {
        console.log('SIGINT received, shutting down gracefully');
        server.close(async () => {
          await this.container.shutdown();
          process.exit(0);
        });
      });
    });
  }

  getApp() {
    return this.app;
  }
}

// Utility for adapting Express-style controllers to Vercel serverless functions
export class VercelAdapter {
  // Convert middleware to promise-based execution for serverless
  static async executeMiddleware(middleware, req, res) {
    return new Promise((resolve, reject) => {
      middleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Ensure proper error handling for serverless functions
  static wrapHandler(handler) {
    return async (req, res) => {
      try {
        await handler(req, res);
      } catch (error) {
        console.error('Vercel handler error:', error);
        
        if (!res.headersSent) {
          res.status(500).json({
            error: process.env.NODE_ENV === 'development' 
              ? error.message 
              : 'Internal Server Error',
            timestamp: new Date().toISOString()
          });
        }
      }
    };
  }

  // Helper for cold start optimization
  static createSingletonContainer() {
    let containerInstance = null;
    
    return async () => {
      if (!containerInstance) {
        const { ServiceContainer } = await import('../container/ServiceContainer.js');
        containerInstance = new ServiceContainer();
        await containerInstance.initialize();
      }
      return containerInstance;
    };
  }
}

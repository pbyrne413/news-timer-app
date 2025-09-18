// New clean server entry point following SOLID principles
import { Application } from './src/app.js';
import { createLogger } from './src/utils/Logger.js';

const log = createLogger('Server');

// Create and start application
const app = new Application();

app.start()
  .then((server) => {
    log.info('Application started successfully');
  })
  .catch((error) => {
    log.error('Failed to start application', { error: error.message, stack: error.stack });
    process.exit(1);
  });

export default app;

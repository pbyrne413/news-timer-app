// New clean server entry point following SOLID principles
import { Application } from './src/app.js';

// Create and start application
const app = new Application();

app.start()
  .then((server) => {
    console.log('Application started successfully');
  })
  .catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });

export default app;

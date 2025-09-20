// Test endpoint to check configuration
import { config } from '../src/config/index.js';

export default async function handler(req, res) {
  // Only show non-sensitive config
  const safeConfig = {
    database: {
      url: config.database.url.startsWith('file:') ? 'file:...' : 'turso:...',
      hasAuthToken: Boolean(config.database.authToken),
      connectionTimeout: config.database.connectionTimeout,
      maxRetries: config.database.maxRetries,
      pragmas: config.database.pragmas
    },
    server: {
      env: config.server.env
    }
  };
  
  res.status(200).json(safeConfig);
}

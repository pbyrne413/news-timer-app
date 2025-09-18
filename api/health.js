// Vercel serverless function for health check
import { corsMiddleware } from '../src/middleware/cors.js';

export default function handler(req, res) {
  // Apply CORS middleware
  corsMiddleware(req, res, () => {});
  
  if (req.method === 'OPTIONS') {
    return;
  }

  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    architecture: 'refactored'
  });
}

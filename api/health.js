// Vercel serverless function for health check
import { corsMiddleware } from '../src/middleware/cors.js';
import { DateUtils } from '../src/utils/DateUtils.js';

export default function handler(req, res) {
  // Apply CORS middleware
  corsMiddleware(req, res, () => {});
  
  if (req.method === 'OPTIONS') {
    return;
  }

  res.json({ 
    status: 'OK', 
    timestamp: DateUtils.getCurrentTimestamp(),
    architecture: 'refactored'
  });
}

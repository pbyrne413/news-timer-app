// Global middleware for all API routes in Vercel
import { corsMiddleware } from '../src/middleware/cors.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

export default function middleware(req, res) {
  return new Promise((resolve) => {
    // Apply CORS to all API routes
    corsMiddleware(req, res, () => {
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return resolve();
      }
      
      // Continue to the actual handler
      resolve();
    });
  });
}

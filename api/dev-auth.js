// Development-only authentication endpoint
import { getDevToken } from '../src/middleware/auth.js';
import { corsMiddleware } from '../src/middleware/cors.js';
import { errorHandler, asyncHandler } from '../src/middleware/errorHandler.js';

export default asyncHandler(async function handler(req, res) {
  // Apply CORS middleware
  corsMiddleware(req, res, () => {});
  
  if (req.method === 'OPTIONS') {
    return;
  }

  if (req.method === 'GET') {
    getDevToken(req, res);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ 
      error: `Method ${req.method} Not Allowed`,
      code: 'METHOD_NOT_ALLOWED'
    });
  }
});

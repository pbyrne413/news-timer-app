// Vercel serverless function using refactored architecture with enhanced security
import { ServiceContainer } from '../../src/container/ServiceContainer.js';
import { SourceController } from '../../src/controllers/SourceController.js';
import { corsMiddleware } from '../../src/middleware/cors.js';
import { validate, rateLimit } from '../../src/middleware/validation.js';
import { errorHandler, asyncHandler } from '../../src/middleware/errorHandler.js';

// Initialize container for serverless environment
const container = new ServiceContainer();

export default asyncHandler(async function handler(req, res) {
  // Apply CORS middleware
  corsMiddleware(req, res, () => {});
  
  if (req.method === 'OPTIONS') {
    return;
  }

  // Parse JSON body for POST requests
  if (req.method === 'POST') {
    console.log('📝 Received POST request to /sources');
    console.log('Request headers:', req.headers);
    
    // Get raw body from request
    const rawBody = await new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        resolve(body);
      });
    });
    
    console.log('Raw body received:', rawBody);
    
    try {
      req.body = JSON.parse(rawBody);
      console.log('Parsed request body:', req.body);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      console.error('Raw body was:', rawBody);
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }
  }

  // Skip rate limiting for now to test if that's causing the issue
  // rateLimit(req, res, () => {});

  // Initialize container with timeout
  try {
    await Promise.race([
      container.initialize(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Container initialization timeout')), 5000))
    ]);
  } catch (error) {
    console.error('Container initialization failed:', error);
    res.status(500).json({ error: 'Service initialization failed' });
    return;
  }

  // Create controller instance
  const sourceController = new SourceController(container);

  try {
    if (req.method === 'GET') {
      // GET requests have been working, no need for timeout
      await sourceController.getSources(req, res);
    } else if (req.method === 'POST') {
      console.log('🚀 Processing POST request to /sources');
      console.log('Request body:', req.body);
      
      // Process POST request without additional timeout (already handled in service)
      const startTime = Date.now();
      try {
        await sourceController.addSource(req, res);
        console.log(`✅ Source added successfully in ${Date.now() - startTime}ms`);
      } catch (error) {
        console.error(`❌ Source addition failed after ${Date.now() - startTime}ms:`, error);
        throw error;
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ 
        error: `Method ${req.method} Not Allowed`,
        code: 'METHOD_NOT_ALLOWED'
      });
    }
  } catch (error) {
    console.error('Request failed:', error);
    if (error.message.includes('timeout')) {
      res.status(504).json({ error: 'Request timed out', code: 'TIMEOUT' });
    } else {
      res.status(500).json({ error: error.message, code: 'ERROR' });
    }
  }
});

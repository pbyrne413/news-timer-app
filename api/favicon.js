// Favicon proxy endpoint with caching and CORS handling
import { corsMiddleware } from '../src/middleware/cors.js';

export default async function handler(req, res) {
  try {
    // Apply CORS middleware
    corsMiddleware(req, res, () => {});
    
    if (req.method === 'OPTIONS') {
      return;
    }

    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
      const domain = new URL(url).hostname;
      const faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

      // Fetch the favicon
      const response = await fetch(faviconUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch favicon: ${response.status}`);
      }

      // Get the image data
      const buffer = await response.arrayBuffer();

      // Set caching headers
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.setHeader('Content-Type', 'image/x-icon');
      
      // Remove restrictive CORS headers for this endpoint
      res.removeHeader('Cross-Origin-Resource-Policy');
      res.removeHeader('Cross-Origin-Embedder-Policy');
      
      // Allow image to be used cross-origin
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // Send the favicon
      res.send(Buffer.from(buffer));
    } catch (error) {
      // Return a default favicon on error
      res.redirect('/favicon.ico');
    }
  } catch (error) {
    console.error('Favicon proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch favicon' });
  }
}

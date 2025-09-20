// Simple test endpoint for source addition
import { createClient } from '@libsql/client';
import { config } from '../src/config/index.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('🔄 Creating test source...');
  console.log('Request body:', req.body);
  
  try {
    // Create client with auth token
    const client = createClient({
      url: config.database.url,
      authToken: config.database.authToken,
      headers: {
        'Authorization': `Bearer ${config.database.authToken}`
      }
    });
    
    // Generate a test key
    const key = `test-${Date.now()}`;
    
    // Insert source directly
    console.log('Running INSERT query...');
    const result = await Promise.race([
      client.execute({
        sql: 'INSERT INTO news_sources (key, name, icon, url, default_allocation) VALUES (?, ?, ?, ?, ?)',
        args: [key, 'Test Source', '📰', 'https://example.com', 300]
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 3000))
    ]);
    
    console.log('Query result:', result);
    
    res.status(200).json({
      success: true,
      key,
      lastInsertRowid: Number(result.lastInsertRowid)
    });
  } catch (error) {
    console.error('Failed to add source:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
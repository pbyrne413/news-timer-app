// Simple database test endpoint
import { createClient } from '@libsql/client';
import { config } from '../src/config/index.js';

export default async function handler(req, res) {
  console.log('🔄 Testing database connection...');
  console.log('Database URL type:', config.database.url.startsWith('file:') ? 'file' : 'turso');
  
  try {
    // Create client with auth token
    const client = createClient({
      url: config.database.url,
      authToken: config.database.authToken,
      headers: {
        'Authorization': `Bearer ${config.database.authToken}`
      }
    });
    
    // Try a simple query
    console.log('Running test query...');
    const result = await client.execute('SELECT 1 as test');
    console.log('Query result:', result);
    
    // Try creating a test table
    console.log('Creating test table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_table (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);
    
    // Try inserting data
    console.log('Inserting test data...');
    const insertResult = await client.execute({
      sql: 'INSERT INTO test_table (name) VALUES (?)',
      args: ['test']
    });
    console.log('Insert result:', insertResult);
    
    res.status(200).json({
      success: true,
      testQuery: result.rows[0],
      insertId: Number(insertResult.lastInsertRowid)
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
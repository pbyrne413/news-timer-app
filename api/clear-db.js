// Clear database endpoint for development
import { ServiceContainer } from '../../src/container/ServiceContainer.js';

const container = new ServiceContainer();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    await container.initialize();
    const database = container.get('database');
    
    // Clear all sources
    await database.client.execute('DELETE FROM news_sources');
    
    // Clear all usage data
    await database.client.execute('DELETE FROM daily_usage');
    
    // Clear settings
    await database.client.execute('DELETE FROM user_settings');
    
    // Reinitialize default settings
    await database.client.execute({
      sql: 'INSERT INTO user_settings (total_time_limit, auto_start) VALUES (?, ?)',
      args: [1800, false]
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Database cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

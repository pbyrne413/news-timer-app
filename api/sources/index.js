import Database from '../../database.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const db = new Database();

  try {
    if (req.method === 'GET') {
      const today = new Date().toISOString().split('T')[0];
      const sources = await db.getSources();
      
      const sourcesWithUsage = await Promise.all(
        sources.map(async (source) => {
          const usage = await db.getDailyUsage(source.id, today);
          
          return {
            key: source.key,
            name: source.name,
            icon: source.icon,
            allocated: source.default_allocation,
            used: usage ? usage.time_used : 0,
            sessions: usage ? usage.sessions : 0,
            overrunTime: usage ? usage.overrun_time : 0
          };
        })
      );
      
      res.json(sourcesWithUsage);
    } else if (req.method === 'POST') {
      const { name, icon, allocation } = req.body;
      
      const key = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      // Check if source already exists
      const existingSource = await db.getSourceByKey(key);
      if (existingSource) {
        return res.status(400).json({ error: 'Source already exists' });
      }
      
      const sourceId = await db.addSource(key, name, icon || '📰', allocation || 300);
      
      res.json({
        key,
        name,
        icon: icon || '📰',
        allocated: allocation || 300,
        used: 0,
        sessions: 0,
        overrunTime: 0
      });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database operation failed' });
  } finally {
    db.close();
  }
}

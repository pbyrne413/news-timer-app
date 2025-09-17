import Database from '../../database.js';

const db = new Database();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
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
    } catch (error) {
      console.error('Error fetching sources:', error);
      res.status(500).json({ error: 'Failed to fetch sources' });
    }
  } else if (req.method === 'POST') {
    try {
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
    } catch (error) {
      console.error('Error adding source:', error);
      res.status(500).json({ error: 'Failed to add source' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

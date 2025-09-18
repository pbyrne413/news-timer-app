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
      const todayUsages = await db.getDailyUsages(today);
      
      const totalTimeUsed = todayUsages.reduce((sum, usage) => sum + usage.time_used, 0);
      const totalSessions = todayUsages.reduce((sum, usage) => sum + usage.sessions, 0);
      const totalOverrun = todayUsages.reduce((sum, usage) => sum + usage.overrun_time, 0);
      
      res.json({
        totalTimeUsed,
        totalSessions,
        totalOverrun,
        sourcesUsed: todayUsages.length
      });
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database operation failed' });
  } finally {
    db.close();
  }
}

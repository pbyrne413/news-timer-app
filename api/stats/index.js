import Database from '../../database.js';

const db = new Database();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
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
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

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
      const settings = await db.getSettings();
      
      if (!settings) {
        // Return default settings if none exist
        res.json({
          totalTimeLimit: 1800, // 30 minutes
          autoStart: false
        });
      } else {
        res.json({
          totalTimeLimit: settings.total_time_limit,
          autoStart: settings.auto_start
        });
      }
    } else if (req.method === 'PUT') {
      const { totalTimeLimit, autoStart } = req.body;
      await db.updateSettings(totalTimeLimit, autoStart);
      res.json({ success: true });
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database operation failed' });
  } finally {
    db.close();
  }
}

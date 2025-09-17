import Database from '../../database.js';

const db = new Database();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const settings = await db.getSettings();
      
      if (!settings) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      
      res.json({
        totalTimeLimit: settings.total_time_limit,
        autoStart: settings.auto_start
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { totalTimeLimit, autoStart } = req.body;
      await db.updateSettings(totalTimeLimit, autoStart);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

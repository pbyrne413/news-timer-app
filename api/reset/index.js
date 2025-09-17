import Database from '../../database.js';

const db = new Database();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const today = new Date().toISOString().split('T')[0];
      await db.clearDailyData(today);
      res.json({ success: true });
    } catch (error) {
      console.error('Error resetting data:', error);
      res.status(500).json({ error: 'Failed to reset data' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

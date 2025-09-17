import Database from '../../database.js';

const db = new Database();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { sourceKey, timeUsed, sessions, overrunTime } = req.body;
      
      const source = await db.getSourceByKey(sourceKey);
      if (!source) {
        return res.status(404).json({ error: 'Source not found' });
      }
      
      const today = new Date().toISOString().split('T')[0];
      await db.updateDailyUsage(source.id, today, timeUsed, sessions, overrunTime);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error recording usage:', error);
      res.status(500).json({ error: 'Failed to record usage' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

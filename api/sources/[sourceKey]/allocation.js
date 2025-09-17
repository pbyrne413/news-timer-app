import Database from '../../../database.js';

const db = new Database();

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { sourceKey } = req.query;
      const { allocation } = req.body;
      
      await db.updateSourceAllocation(sourceKey, allocation);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating source allocation:', error);
      res.status(500).json({ error: 'Failed to update source allocation' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

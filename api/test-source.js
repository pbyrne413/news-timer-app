// Simple test endpoint for source addition
export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log('📝 Test endpoint received POST request');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    try {
      // Return mock success response
      res.status(200).json({
        key: 'test-source',
        name: req.body.name || 'Test Source',
        icon: req.body.icon || '📰',
        url: req.body.url,
        allocated: req.body.allocation || 300,
        used: 0,
        sessions: 0,
        overrunTime: 0
      });
    } catch (error) {
      console.error('Test endpoint error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

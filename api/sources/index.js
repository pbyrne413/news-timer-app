module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Return default sources for now (simplified version)
    const defaultSources = [
      { key: 'bbc-football', name: 'BBC Football', icon: '⚽', allocated: 300, used: 0, sessions: 0, overrunTime: 0 },
      { key: 'bbc-headlines', name: 'BBC Headlines', icon: '📰', allocated: 300, used: 0, sessions: 0, overrunTime: 0 },
      { key: 'rte-headlines', name: 'RTE Headlines', icon: '🇮🇪', allocated: 300, used: 0, sessions: 0, overrunTime: 0 },
      { key: 'guardian-headlines', name: 'Guardian Headlines', icon: '🛡️', allocated: 300, used: 0, sessions: 0, overrunTime: 0 },
      { key: 'guardian-opinion', name: 'Guardian Opinion', icon: '💭', allocated: 300, used: 0, sessions: 0, overrunTime: 0 },
      { key: 'cnn', name: 'CNN', icon: '🌍', allocated: 300, used: 0, sessions: 0, overrunTime: 0 }
    ];
    
    res.json(defaultSources);
  } else if (req.method === 'POST') {
    try {
      const { name, icon, allocation } = req.body;
      
      const key = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
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

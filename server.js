import express from 'express';
import cors from 'cors';
import Database from './database.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all sources with today's usage
app.get('/api/sources', async (req, res) => {
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
});

// Get user settings
app.get('/api/settings', async (req, res) => {
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
});

// Update user settings
app.put('/api/settings', async (req, res) => {
  try {
    const { totalTimeLimit, autoStart } = req.body;
    await db.updateSettings(totalTimeLimit, autoStart);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Update source allocation
app.put('/api/sources/:sourceKey/allocation', async (req, res) => {
  try {
    const { sourceKey } = req.params;
    const { allocation } = req.body;
    
    await db.updateSourceAllocation(sourceKey, allocation);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating source allocation:', error);
    res.status(500).json({ error: 'Failed to update source allocation' });
  }
});

// Record timer usage
app.post('/api/usage', async (req, res) => {
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
});

// Get daily stats
app.get('/api/stats', async (req, res) => {
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
});

// Reset daily data
app.post('/api/reset', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await db.clearDailyData(today);
    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting data:', error);
    res.status(500).json({ error: 'Failed to reset data' });
  }
});

// Add new source
app.post('/api/sources', async (req, res) => {
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
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to use the app`);
});

export default app;

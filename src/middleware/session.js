import crypto from 'crypto';
import { DateTime } from 'luxon';
import { createLogger } from '../utils/Logger.js';

const log = createLogger('Session');

// In-memory session store (in production, use Redis or database)
const sessions = new Map();

// Session configuration
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

// Generate a cryptographically secure session ID
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create a new session
export const createSession = (userId, userData = {}) => {
  const sessionId = generateSessionId();
  const expiresAt = DateTime.now().plus({ milliseconds: SESSION_DURATION }).toMillis();
  
  const session = {
    id: sessionId,
    userId,
    userData,
    createdAt: DateTime.now().toMillis(),
    expiresAt,
    lastAccessed: DateTime.now().toMillis(),
    isActive: true
  };
  
  sessions.set(sessionId, session);
  log.info('Session created', { sessionId, userId, expiresAt });
  
  return session;
};

// Get session by ID
export const getSession = (sessionId) => {
  if (!sessionId) return null;
  
  const session = sessions.get(sessionId);
  if (!session) return null;
  
  // Check if session is expired
  if (DateTime.now().toMillis() > session.expiresAt) {
    sessions.delete(sessionId);
    log.info('Session expired', { sessionId });
    return null;
  }
  
  // Update last accessed time
  session.lastAccessed = DateTime.now().toMillis();
  sessions.set(sessionId, session);
  
  return session;
};

// Update session data
export const updateSession = (sessionId, userData) => {
  const session = getSession(sessionId);
  if (!session) return null;
  
  session.userData = { ...session.userData, ...userData };
  session.lastAccessed = DateTime.now().toMillis();
  sessions.set(sessionId, session);
  
  return session;
};

// Destroy session
export const destroySession = (sessionId) => {
  if (!sessionId) return false;
  
  const deleted = sessions.delete(sessionId);
  if (deleted) {
    log.info('Session destroyed', { sessionId });
  }
  
  return deleted;
};

// Destroy all sessions for a user
export const destroyUserSessions = (userId) => {
  let destroyedCount = 0;
  
  for (const [sessionId, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.delete(sessionId);
      destroyedCount++;
    }
  }
  
  log.info('User sessions destroyed', { userId, count: destroyedCount });
  return destroyedCount;
};

// Clean up expired sessions
export const cleanupExpiredSessions = () => {
  const now = DateTime.now().toMillis();
  let cleanedCount = 0;
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    log.info('Expired sessions cleaned up', { count: cleanedCount });
  }
  
  return cleanedCount;
};

// Session middleware
export const sessionMiddleware = (req, res, next) => {
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
  
  if (sessionId) {
    const session = getSession(sessionId);
    if (session) {
      req.session = session;
      req.userId = session.userId;
      req.userData = session.userData;
    }
  }
  
  // Add session management methods to request
  req.createSession = (userId, userData) => {
    const session = createSession(userId, userData);
    res.cookie('sessionId', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DURATION
    });
    return session;
  };
  
  req.destroySession = () => {
    if (sessionId) {
      destroySession(sessionId);
      res.clearCookie('sessionId');
    }
  };
  
  req.updateSession = (userData) => {
    if (sessionId) {
      return updateSession(sessionId, userData);
    }
    return null;
  };
  
  next();
};

// Require authentication middleware
export const requireAuth = (req, res, next) => {
  if (!req.session || !req.userId) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  next();
};

// Optional authentication middleware
export const optionalAuth = (req, res, next) => {
  // Session is already set by sessionMiddleware if available
  next();
};

// Start cleanup interval
setInterval(cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL);

// Export session statistics for monitoring
export const getSessionStats = () => {
  const now = DateTime.now().toMillis();
  const activeSessions = Array.from(sessions.values()).filter(s => s.expiresAt > now);
  
  return {
    totalSessions: sessions.size,
    activeSessions: activeSessions.length,
    expiredSessions: sessions.size - activeSessions.length,
    oldestSession: activeSessions.length > 0 ? Math.min(...activeSessions.map(s => s.createdAt)) : null,
    newestSession: activeSessions.length > 0 ? Math.max(...activeSessions.map(s => s.createdAt)) : null
  };
};

export default {
  createSession,
  getSession,
  updateSession,
  destroySession,
  destroyUserSessions,
  cleanupExpiredSessions,
  sessionMiddleware,
  requireAuth,
  optionalAuth,
  getSessionStats
};

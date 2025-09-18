# Vercel Deployment Guide

## Architecture Overview

The refactored application maintains full compatibility with Vercel's serverless functions while implementing SOLID principles and modern architecture patterns.

## Key Features

### 1. Serverless Function Compatibility
- Each API endpoint is a separate Vercel function
- Shared architecture through dependency injection
- Cold start optimization with singleton containers

### 2. Turso Database Integration
- Configured for Turso cloud database
- Automatic fallback to SQLite for local development
- Environment variable configuration

### 3. Environment Variables

Set these in your Vercel dashboard:

```bash
TURSO_DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your-auth-token
NODE_ENV=production
```

### 4. Architecture Benefits in Serverless

#### Cold Start Optimization
- Singleton service container reduces initialization overhead
- Shared middleware across functions
- Optimized imports

#### Error Handling
- Consistent error responses across all endpoints
- Proper error logging for debugging
- Graceful fallbacks

#### Validation
- Input validation on all endpoints
- Business rule enforcement
- Type safety

## Deployment Commands

```bash
# Deploy to Vercel
npm run build
vercel --prod

# Local development
npm run dev
```

## API Endpoints

All endpoints follow the refactored architecture:

- `GET /api/health` - Health check
- `GET /api/sources` - List sources with usage
- `POST /api/sources` - Add new source
- `PUT /api/sources/[sourceKey]/allocation` - Update allocation
- `POST /api/usage` - Record usage
- `GET /api/stats` - Get daily statistics
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings
- `POST /api/reset` - Reset daily data

## Database Schema

The application automatically initializes the required tables:
- `news_sources` - Source definitions
- `daily_usages` - Usage tracking
- `user_settings` - User preferences

## Monitoring

- All errors are logged with timestamps
- Health endpoint provides status information
- Business logic errors are properly categorized

## Testing

```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Test sources endpoint
curl https://your-app.vercel.app/api/sources
```

# News Timer App

A timer application to help limit daily news reading time with individual source tracking and overrun capabilities.

## Features

- **Individual Source Timers**: Track time spent on different news sources (BBC Football, BBC Headlines, RTE, Guardian, CNN, etc.)
- **Total Daily Limit**: Enforce a 30-minute daily limit across all sources
- **Overrun Support**: Allow sources to go over their allocated time (shown in red) while still enforcing the total daily limit
- **Persistent Storage**: SQLite database for data persistence
- **Settings Management**: Configurable time limits and source allocations
- **Math Challenge**: Discouraged source addition with simultaneous equations
- **Export/Import**: Backup and restore functionality
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Hosting**: Vercel

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open http://localhost:3000 in your browser

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/sources` - Get all sources with today's usage
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings
- `PUT /api/sources/:key/allocation` - Update source allocation
- `POST /api/usage` - Record timer usage
- `GET /api/stats` - Get daily statistics
- `POST /api/reset` - Reset daily data
- `POST /api/sources` - Add new source

## Deployment

The app is configured for Vercel deployment with:
- Static file serving for the frontend
- Serverless functions for the API
- SQLite database (ephemeral in Vercel)

## Usage

1. **Select a Source**: Click on any news source to start its timer
2. **Monitor Progress**: Watch the progress bars and time counters
3. **Overrun Handling**: Sources can exceed their allocated time (shown in red)
4. **Daily Limit**: Total daily time is enforced across all sources
5. **Settings**: Configure time limits and source allocations via the settings modal
6. **Add Sources**: Use the math challenge to add new sources (discouraged)

## Database Schema

- `news_sources`: Source definitions with allocations
- `daily_usages`: Daily usage tracking per source
- `user_settings`: User preferences and limits

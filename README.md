# News Timer App

A modern timer application to help limit daily news reading time with individual source tracking, built with SOLID principles and enterprise-grade security.

## 🚀 Features

- **Individual Source Timers**: Track time spent on different news sources (BBC, RTE, Guardian, CNN, etc.)
- **Total Daily Limit**: Enforce configurable daily limits across all sources
- **Overrun Support**: Allow sources to exceed allocated time while enforcing total limits
- **Modern UI**: Glassmorphism design with responsive layout
- **Persistent Storage**: SQLite/Turso database with global edge distribution
- **Settings Management**: Configurable time limits and source allocations
- **Security**: Authentication, rate limiting, input validation, and security headers
- **Export/Import**: Backup and restore functionality

## 🏗️ Architecture

This application follows **SOLID principles**, **DRY**, and **GRASP patterns** for maintainability and extensibility:

### Architecture Layers
- **Controllers** (`src/controllers/`): HTTP request/response handling
- **Services** (`src/services/`): Business logic and rules
- **Middleware** (`src/middleware/`): CORS, validation, error handling
- **Database** (`database.js`): Data persistence abstraction
- **Container** (`src/container/`): Dependency injection

### Key Benefits
- ✅ **Maintainable**: Clear separation of concerns
- ✅ **Testable**: Dependency injection enables easy mocking
- ✅ **Extensible**: New features can be added with minimal changes
- ✅ **Reliable**: Consistent error handling and validation
- ✅ **Scalable**: Modular architecture supports growth

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite3 (local) / Turso (production)
- **Hosting**: Vercel
- **Architecture**: SOLID principles, dependency injection

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```

3. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/enhanced-health` | Detailed health status |
| `GET` | `/api/sources` | Get all sources with usage |
| `POST` | `/api/sources` | Add new source |
| `PUT` | `/api/sources/:key/allocation` | Update source allocation |
| `GET` | `/api/settings` | Get user settings |
| `PUT` | `/api/settings` | Update user settings |
| `POST` | `/api/usage` | Record timer usage |
| `GET` | `/api/stats` | Get daily statistics |
| `POST` | `/api/reset` | Reset daily data (authenticated) |
| `GET` | `/api/dev-auth` | Get development auth token |

## 🔒 Security Features

- **Authentication**: Token-based auth for sensitive operations
- **Rate Limiting**: 100 requests/minute per IP
- **CORS Protection**: Environment-specific origin validation
- **Input Validation**: XSS protection and sanitization
- **Security Headers**: CSP, HSTS, XSS protection
- **Error Handling**: No information disclosure in production

## 📖 Usage

1. **Select a Source**: Click on any news source to start its timer
2. **Monitor Progress**: Watch progress bars and time counters
3. **Overrun Handling**: Sources can exceed allocated time (shown in red)
4. **Daily Limit**: Total daily time enforced across all sources
5. **Settings**: Configure time limits and source allocations
6. **Add Sources**: Use math challenge to add new sources

## 🗄️ Database Schema

- `news_sources`: Source definitions with allocations
- `daily_usages`: Daily usage tracking per source
- `user_settings`: User preferences and limits

## 📁 Project Structure

```
├── api/                    # Vercel serverless functions
├── src/                    # Refactored application code
│   ├── controllers/        # HTTP request handlers
│   ├── services/          # Business logic
│   ├── middleware/        # Cross-cutting concerns
│   ├── container/         # Dependency injection
│   └── config/            # Configuration management
├── database.js            # Database abstraction
├── index.html             # Frontend application
├── script.js              # Frontend JavaScript
├── style.css              # Application styles
└── vercel.json            # Vercel configuration
```

## 🔧 Development

### Available Scripts

```bash
npm start          # Start development server
npm run dev        # Development with auto-reload
npm run build      # Build for production
npm run deploy     # Deploy to Vercel
```

### Environment Variables

Create `.env.local` for local development:

```bash
NODE_ENV=development
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
SESSION_SECRET=your-32-character-secret
CORS_ORIGINS=http://localhost:3000
```

## 📋 Documentation

- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Complete deployment guide
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Detailed architecture documentation
- [docs/SECURITY.md](./docs/SECURITY.md) - Security implementation guide

## 🤝 Contributing

1. Follow SOLID principles and existing architecture patterns
2. Add tests for new features
3. Update documentation for any changes
4. Ensure security best practices are maintained

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
# 🏗️ Architecture Documentation

This document details the architectural decisions, design patterns, and implementation of the News Timer App following software engineering best practices.

## 🎯 Design Principles

The application follows these core principles:

- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY (Don't Repeat Yourself)**: Eliminate code duplication
- **GRASP Patterns**: General Responsibility Assignment Software Patterns
- **Clean Architecture**: Separation of concerns with clear boundaries

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Controllers  │  Middleware  │  Routes  │  Frontend (HTML)  │
├─────────────────────────────────────────────────────────────┤
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│              Services (Business Rules)                     │
├─────────────────────────────────────────────────────────────┤
│                    Data Access Layer                        │
├─────────────────────────────────────────────────────────────┤
│              Database (SQLite/Turso)                       │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
src/
├── app.js                    # Application factory & entry point
├── config/
│   └── index.js             # Configuration management
├── container/
│   └── ServiceContainer.js  # Dependency injection container
├── controllers/              # HTTP request handlers
│   ├── BaseController.js    # Base controller with common patterns
│   ├── SourceController.js  # Source management endpoints
│   ├── UsageController.js   # Usage tracking endpoints
│   ├── StatsController.js   # Statistics endpoints
│   ├── SettingsController.js # Settings management
│   └── ResetController.js   # Data reset endpoints
├── middleware/               # Cross-cutting concerns
│   ├── auth.js              # Authentication middleware
│   ├── cors.js              # CORS handling
│   ├── errorHandler.js      # Centralized error handling
│   └── validation.js        # Input validation schemas
├── routes/
│   └── index.js             # Route definitions & composition
├── services/                 # Business logic layer
│   ├── BaseService.js       # Base service with common patterns
│   ├── SourceService.js     # Source business logic
│   ├── UsageService.js      # Usage tracking logic
│   └── SettingsService.js   # Settings management logic
└── utils/                    # Shared utilities
```

## 🔧 SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)

**Before**: Monolithic `server.js` handling routing, business logic, error handling, and database operations.

**After**: Each class has one reason to change:
- **Controllers**: Only handle HTTP concerns
- **Services**: Only contain business logic
- **Middleware**: Handle specific cross-cutting concerns
- **Database**: Only handle data access

### 2. Open/Closed Principle (OCP)

**Implementation**:
- New endpoints can be added without modifying existing code
- Services can be extended without modification
- Router supports adding new routes easily
- Plugin architecture for middleware

### 3. Liskov Substitution Principle (LSP)

**Implementation**:
- All services inherit from `BaseService`
- All controllers inherit from `BaseController`
- Substitutable implementations possible
- Consistent interfaces across implementations

### 4. Interface Segregation Principle (ISP)

**Implementation**:
- Small, focused interfaces
- Services have specific responsibilities
- No client depends on methods it doesn't use
- Granular service interfaces

### 5. Dependency Inversion Principle (DIP)

**Implementation**:
- High-level modules don't depend on low-level modules
- Dependencies injected through constructor
- Abstractions (services) used instead of concrete implementations
- ServiceContainer manages all dependencies

## 🎯 GRASP Patterns Applied

### Information Expert
- Services contain the information needed to fulfill responsibilities
- Database operations encapsulated where data resides
- Business rules live in appropriate service classes

### Creator
- ServiceContainer creates and manages service instances
- Factory methods for creating handlers
- Proper object creation and lifecycle management

### Controller (GRASP)
- Controllers coordinate between services and HTTP layer
- Don't contain business logic
- Act as orchestrators, not implementers

### Low Coupling
- Services depend on abstractions, not concrete classes
- Dependency injection reduces coupling
- Minimal dependencies between modules

### High Cohesion
- Each class has focused, related responsibilities
- Services group related business operations
- Clear separation of concerns

## 🔄 DRY Principle Implementation

### Code Reuse
- **Base Classes**: Common functionality in BaseController and BaseService
- **Shared Middleware**: CORS, error handling, validation
- **Centralized Error Handling**: Unified error responses
- **Common Response Patterns**: Standardized through BaseController

### Configuration
- **Single Configuration Source**: `src/config/index.js`
- **Shared Validation Schemas**: Reusable validation logic
- **Centralized Business Rules**: Consistent across application

## 🏗️ Dependency Injection

### ServiceContainer
The `ServiceContainer` class manages all dependencies:

```javascript
class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
  }
  
  register(name, factory, singleton = false) {
    // Register service factory
  }
  
  get(name) {
    // Get service instance (singleton or new)
  }
}
```

### Benefits
- **Testability**: Easy to mock dependencies
- **Flexibility**: Can swap implementations
- **Maintainability**: Clear dependency relationships
- **Performance**: Singleton pattern for expensive objects

## 🚀 Vercel Serverless Compatibility

### Architecture Adaptations
- **Function-per-Endpoint**: Each API route is a separate Vercel function
- **Shared Architecture**: Common patterns through dependency injection
- **Cold Start Optimization**: Singleton containers reduce initialization overhead
- **Stateless Design**: No shared state between function invocations

### Performance Optimizations
- **Connection Pooling**: Reuse database connections
- **Lazy Loading**: Load services only when needed
- **Caching**: In-memory caching for frequently accessed data
- **Batch Operations**: Group related database operations

## 🛡️ Security Architecture

### Authentication Flow
```
Client Request → Auth Middleware → Controller → Service → Database
                     ↓
              Token Validation
                     ↓
              Rate Limiting
                     ↓
              Input Validation
```

### Security Layers
1. **Authentication**: Token-based auth for sensitive operations
2. **Authorization**: Role-based access control
3. **Input Validation**: XSS protection and sanitization
4. **Rate Limiting**: DoS protection
5. **CORS**: Origin validation
6. **Security Headers**: CSP, HSTS, XSS protection

## 📊 Error Handling Architecture

### Error Hierarchy
```
BaseError
├── ValidationError
├── AuthenticationError
├── AuthorizationError
├── DatabaseError
└── BusinessLogicError
```

### Error Flow
1. **Service Layer**: Throws domain-specific errors
2. **Controller Layer**: Catches and maps to HTTP responses
3. **Middleware Layer**: Handles uncaught errors
4. **Client**: Receives appropriate error responses

## 🔧 Configuration Management

### Environment-Based Configuration
```javascript
const config = {
  development: {
    database: { type: 'sqlite', path: './database.sqlite' },
    cors: { origins: ['http://localhost:3000'] },
    security: { rateLimit: { max: 1000, window: 60000 } }
  },
  production: {
    database: { type: 'turso', url: process.env.TURSO_DATABASE_URL },
    cors: { origins: process.env.CORS_ORIGINS?.split(',') },
    security: { rateLimit: { max: 100, window: 60000 } }
  }
};
```

## 📈 Performance Architecture

### Caching Strategy
- **Service Level**: In-memory caching for business data
- **Database Level**: Connection pooling and query optimization
- **HTTP Level**: Appropriate cache headers

### Monitoring
- **Health Checks**: Application and dependency status
- **Metrics**: Response times, error rates, throughput
- **Logging**: Structured logging with correlation IDs

## 🧪 Testing Architecture

### Test Structure
```
tests/
├── unit/           # Service and utility tests
├── integration/    # API endpoint tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data and mocks
```

### Testing Strategy
- **Unit Tests**: Test individual services and utilities
- **Integration Tests**: Test API endpoints with real database
- **E2E Tests**: Test complete user workflows
- **Mocking**: Dependency injection enables easy mocking

## 🔄 Migration Path

### From Legacy to Modern Architecture
1. **Phase 1**: Extract services from monolithic server
2. **Phase 2**: Implement dependency injection
3. **Phase 3**: Add comprehensive error handling
4. **Phase 4**: Implement security middleware
5. **Phase 5**: Add monitoring and logging

### Backward Compatibility
- Legacy `server.js` preserved for comparison
- Gradual migration of endpoints
- Feature flags for new architecture

## 📚 Benefits Achieved

### Maintainability
- Clear separation of concerns
- Consistent code structure
- Easy to understand and modify
- Self-documenting architecture

### Testability
- Dependency injection enables easy mocking
- Isolated business logic
- Standardized error handling
- Comprehensive test coverage

### Extensibility
- New features can be added with minimal changes
- Open/Closed principle enables safe extensions
- Modular architecture supports growth
- Plugin architecture for middleware

### Reliability
- Consistent error handling across all endpoints
- Input validation on all requests
- Business rule enforcement
- Graceful degradation

### Performance
- Singleton service containers reduce initialization overhead
- Optimized for serverless cold starts
- Efficient database connection management
- Intelligent caching strategies

## 🎯 Future Enhancements

### Planned Improvements
1. **Event-Driven Architecture**: Add event bus for loose coupling
2. **CQRS Pattern**: Separate read and write models
3. **Microservices**: Split into focused services
4. **GraphQL API**: Add GraphQL endpoint alongside REST
5. **Real-time Features**: WebSocket support for live updates

This architecture provides a solid foundation for current needs while remaining flexible for future growth and requirements.
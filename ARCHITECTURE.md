# Timer Application Architecture

## Overview
This application has been refactored to follow SOLID principles, DRY (Don't Repeat Yourself), and GRASP (General Responsibility Assignment Software Patterns) for improved maintainability and extensibility.

## Architecture Layers

### 1. Presentation Layer
- **Controllers** (`src/controllers/`): Handle HTTP requests/responses
- **Middleware** (`src/middleware/`): Cross-cutting concerns (CORS, validation, error handling)
- **Routes** (`src/routes/`): Route definitions and middleware composition

### 2. Business Logic Layer
- **Services** (`src/services/`): Business logic and rules
- **Validation** (`src/middleware/validation.js`): Input validation schemas

### 3. Data Access Layer
- **Database** (`database.js`): Data persistence abstraction
- **Models**: Implicit in database methods

### 4. Infrastructure Layer
- **Container** (`src/container/`): Dependency injection
- **Configuration** (`src/config/`): Application configuration
- **Utilities** (`src/utils/`): Shared utilities

## SOLID Principles Applied

### Single Responsibility Principle (SRP)
- Each class has one reason to change
- Controllers only handle HTTP concerns
- Services only handle business logic
- Middleware handles specific cross-cutting concerns

### Open/Closed Principle (OCP)
- New endpoints can be added without modifying existing code
- Services can be extended without modification
- Router supports adding new routes easily

### Liskov Substitution Principle (LSP)
- All services inherit from BaseService
- Controllers inherit from BaseController
- Substitutable implementations possible

### Interface Segregation Principle (ISP)
- Small, focused interfaces
- Services have specific responsibilities
- No client depends on methods it doesn't use

### Dependency Inversion Principle (DIP)
- High-level modules don't depend on low-level modules
- Dependencies injected through constructor
- Abstractions (services) used instead of concrete implementations

## GRASP Principles Applied

### Information Expert
- Services contain the information needed to fulfill responsibilities
- Database operations encapsulated where data resides

### Creator
- ServiceContainer creates and manages service instances
- Factory methods for creating handlers

### Controller
- Controllers coordinate between services and HTTP layer
- Don't contain business logic

### Low Coupling
- Services depend on abstractions, not concrete classes
- Dependency injection reduces coupling

### High Cohesion
- Each class has focused, related responsibilities
- Services group related business operations

## DRY Principle Applied

### Code Reuse
- Base classes for common functionality
- Shared middleware for cross-cutting concerns
- Centralized error handling
- Common response patterns

### Configuration
- Single configuration source
- Shared validation schemas
- Centralized business rules

## Key Benefits

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Dependency injection enables easy mocking
3. **Extensibility**: New features can be added with minimal changes
4. **Reliability**: Consistent error handling and validation
5. **Scalability**: Modular architecture supports growth

## Migration Path

The refactored code is in the `src/` directory. The original `server.js` is preserved for comparison. Use:
- `npm run start` - New refactored server
- `npm run start:legacy` - Original server

## File Structure

```
src/
├── app.js                 # Application factory
├── config/
│   └── index.js          # Configuration management
├── container/
│   └── ServiceContainer.js # Dependency injection
├── controllers/
│   ├── BaseController.js  # Base controller class
│   ├── SourceController.js
│   ├── UsageController.js
│   ├── StatsController.js
│   ├── SettingsController.js
│   └── ResetController.js
├── middleware/
│   ├── cors.js           # CORS middleware
│   ├── errorHandler.js   # Error handling
│   └── validation.js     # Input validation
├── routes/
│   └── index.js          # Route definitions
├── services/
│   ├── BaseService.js    # Base service class
│   ├── SourceService.js  # Source business logic
│   ├── UsageService.js   # Usage business logic
│   └── SettingsService.js # Settings business logic
└── utils/
    └── Logger.js         # Logging utility
```

import { AppError } from './errorHandler.js';
import { config } from '../config/index.js';

// Validation schemas using configuration
export const schemas = {
  updateSettings: {
    totalTimeLimit: { 
      type: 'number', 
      min: config.businessRules.minTimeLimit, 
      max: config.businessRules.maxTimeLimit, 
      required: true 
    },
    autoStart: { type: 'boolean', required: true }
  },
  
  recordUsage: {
    sourceKey: { type: 'string', required: true, minLength: 1 },
    timeUsed: { type: 'number', min: 0, required: true },
    sessions: { type: 'number', min: 0, required: true },
    overrunTime: { type: 'number', min: 0, required: false }
  },
  
  updateAllocation: {
    allocation: { 
      type: 'number', 
      min: config.businessRules.minAllocation, 
      max: config.businessRules.maxAllocation, 
      required: true 
    }
  },
  
  addSource: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    icon: { type: 'string', required: false, maxLength: 10 },
    allocation: { 
      type: 'number', 
      min: config.businessRules.minAllocation, 
      max: config.businessRules.maxAllocation, 
      required: false 
    }
  }
};

// Generic validator function
const validateField = (value, rules, fieldName) => {
  if (rules.required && (value === undefined || value === null)) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  if (value !== undefined && value !== null) {
    if (rules.type === 'string' && typeof value !== 'string') {
      throw new AppError(`${fieldName} must be a string`, 400);
    }
    
    if (rules.type === 'number' && typeof value !== 'number') {
      throw new AppError(`${fieldName} must be a number`, 400);
    }
    
    if (rules.type === 'boolean' && typeof value !== 'boolean') {
      throw new AppError(`${fieldName} must be a boolean`, 400);
    }

    if (rules.type === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        throw new AppError(`${fieldName} must be at least ${rules.minLength} characters`, 400);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        throw new AppError(`${fieldName} must be no more than ${rules.maxLength} characters`, 400);
      }
    }

    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        throw new AppError(`${fieldName} must be at least ${rules.min}`, 400);
      }
      if (rules.max !== undefined && value > rules.max) {
        throw new AppError(`${fieldName} must be no more than ${rules.max}`, 400);
      }
    }
  }
};

// Validation middleware factory
export const validate = (schemaName) => (req, res, next) => {
  try {
    const schema = schemas[schemaName];
    if (!schema) {
      throw new AppError(`Unknown validation schema: ${schemaName}`, 500);
    }

    const data = { ...req.body, ...req.params, ...req.query };

    for (const [fieldName, rules] of Object.entries(schema)) {
      validateField(data[fieldName], rules, fieldName);
    }

    next();
  } catch (error) {
    next(error);
  }
};

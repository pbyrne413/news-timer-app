// Centralized logging utility following Single Responsibility Principle
export class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  _formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] [${this.context}] ${message}${metaStr}`;
  }

  info(message, meta = {}) {
    console.log(this._formatMessage('INFO', message, meta));
  }

  warn(message, meta = {}) {
    console.warn(this._formatMessage('WARN', message, meta));
  }

  error(message, meta = {}) {
    console.error(this._formatMessage('ERROR', message, meta));
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this._formatMessage('DEBUG', message, meta));
    }
  }

  // Factory method for creating context-specific loggers
  static create(context) {
    return new Logger(context);
  }
}

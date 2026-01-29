/**
 * Logger Utility Module
 * Provides comprehensive logging functionality for the application
 * Logs: Info, Warning, Error, Debug
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

const LOG_COLORS = {
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m',  // Green
  WARN: '\x1b[33m',  // Yellow
  ERROR: '\x1b[31m', // Red
  RESET: '\x1b[0m'   // Reset
};

class Logger {
  constructor(moduleName = 'APP') {
    this.moduleName = moduleName;
    this.logs = [];
    this.maxLogs = 1000; // Store max 1000 logs in memory
    this.enableConsole = true;
  }

  /**
   * Format log message with timestamp
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      module: this.moduleName,
      message,
      data,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js'
    };
  }

  /**
   * Add log to internal storage
   */
  addLog(logObject) {
    this.logs.push(logObject);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }
  }

  /**
   * Console output with colors
   */
  logToConsole(level, message, data) {
    const color = LOG_COLORS[level];
    const reset = LOG_COLORS.RESET;
    const timestamp = new Date().toLocaleTimeString();
    
    if (this.enableConsole) {
      if (data) {
        console.log(
          `${color}[${timestamp}] ${level} [${this.moduleName}]${reset}`,
          message,
          data
        );
      } else {
        console.log(
          `${color}[${timestamp}] ${level} [${this.moduleName}]${reset}`,
          message
        );
      }
    }
  }

  /**
   * Debug level logging
   */
  debug(message, data = null) {
    const logObject = this.formatMessage(LOG_LEVELS.DEBUG, message, data);
    this.addLog(logObject);
    this.logToConsole(LOG_LEVELS.DEBUG, message, data);
  }

  /**
   * Info level logging
   */
  info(message, data = null) {
    const logObject = this.formatMessage(LOG_LEVELS.INFO, message, data);
    this.addLog(logObject);
    this.logToConsole(LOG_LEVELS.INFO, message, data);
  }

  /**
   * Warning level logging
   */
  warn(message, data = null) {
    const logObject = this.formatMessage(LOG_LEVELS.WARN, message, data);
    this.addLog(logObject);
    this.logToConsole(LOG_LEVELS.WARN, message, data);
  }

  /**
   * Error level logging
   */
  error(message, data = null) {
    const logObject = this.formatMessage(LOG_LEVELS.ERROR, message, data);
    this.addLog(logObject);
    this.logToConsole(LOG_LEVELS.ERROR, message, data);
  }

  /**
   * Log user actions
   */
  logAction(action, details = {}) {
    const logObject = this.formatMessage(LOG_LEVELS.INFO, `ACTION: ${action}`, details);
    this.addLog(logObject);
    this.logToConsole(LOG_LEVELS.INFO, `ACTION: ${action}`, details);
  }

  /**
   * Log API calls
   */
  logAPI(method, endpoint, status, responseTime = null) {
    const data = { method, endpoint, status, responseTime: `${responseTime}ms` };
    const logObject = this.formatMessage(LOG_LEVELS.INFO, 'API CALL', data);
    this.addLog(logObject);
    this.logToConsole(LOG_LEVELS.INFO, `API ${method} ${endpoint} - ${status}`, data);
  }

  /**
   * Log form submissions
   */
  logFormSubmission(formName, data = {}) {
    const logObject = this.formatMessage(LOG_LEVELS.INFO, `FORM SUBMIT: ${formName}`, { ...data, password: '***' });
    this.addLog(logObject);
    this.logToConsole(LOG_LEVELS.INFO, `FORM SUBMIT: ${formName}`, data);
  }

  /**
   * Log authentication events
   */
  logAuth(event, userId = null, details = {}) {
    const data = { event, userId, ...details };
    const logObject = this.formatMessage(LOG_LEVELS.INFO, `AUTH: ${event}`, data);
    this.addLog(logObject);
    this.logToConsole(LOG_LEVELS.INFO, `AUTH: ${event}`, data);
  }

  /**
   * Get all logs
   */
  getLogs(filter = null) {
    if (!filter) return this.logs;
    
    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.module && log.module !== filter.module) return false;
      if (filter.message && !log.message.includes(filter.message)) return false;
      return true;
    });
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Download logs file
   */
  downloadLogs(filename = 'app-logs.json') {
    const logs = this.exportLogs();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(logs));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}

// Create global logger instance
const logger = new Logger('APP');

export default logger;

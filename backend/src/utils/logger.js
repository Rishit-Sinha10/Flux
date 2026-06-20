// ============================================================
// Simple Logger Utility
// ============================================================
// Provides consistent logging with timestamps and levels
// Used by all backend services for debugging and monitoring

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log levels
const LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Current log level (default: INFO)
let currentLevel =
  process.env.LOG_LEVEL ? LEVELS[process.env.LOG_LEVEL] : LEVELS.INFO;

// Log file path
const logDir = path.join(__dirname, "../../logs");
const logFile = path.join(logDir, "app.log");

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Format log message with timestamp
 */
function formatMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

/**
 * Write log to file
 */
function writeToFile(message) {
  try {
    fs.appendFileSync(logFile, message + "\n");
  } catch (error) {
    console.error("Failed to write to log file:", error);
  }
}

/**
 * Log error
 */
function error(message, error = null) {
  if (currentLevel >= LEVELS.ERROR) {
    const formatted = formatMessage("ERROR", message);
    console.error(formatted);
    if (error) {
      console.error(error);
      writeToFile(formatted + "\n" + error.stack);
    } else {
      writeToFile(formatted);
    }
  }
}

/**
 * Log warning
 */
function warn(message) {
  if (currentLevel >= LEVELS.WARN) {
    const formatted = formatMessage("WARN", message);
    console.warn(formatted);
    writeToFile(formatted);
  }
}

/**
 * Log info
 */
function info(message) {
  if (currentLevel >= LEVELS.INFO) {
    const formatted = formatMessage("INFO", message);
    console.log(formatted);
    writeToFile(formatted);
  }
}

/**
 * Log debug
 */
function debug(message) {
  if (currentLevel >= LEVELS.DEBUG) {
    const formatted = formatMessage("DEBUG", message);
    console.log(formatted);

    // Don't write all debug logs to file (too verbose)
    // Uncomment if needed for debugging:
    // writeToFile(formatted);
  }
}

/**
 * Set log level
 */
function setLevel(level) {
  if (typeof level === "string") {
    currentLevel = LEVELS[level.toUpperCase()] || LEVELS.INFO;
  } else {
    currentLevel = level;
  }
}

/**
 * Get current log level
 */
function getLevel() {
  for (const [name, value] of Object.entries(LEVELS)) {
    if (value === currentLevel) {
      return name;
    }
  }
  return "INFO";
}

// Export logger functions
export {
  error,
  warn,
  info,
  debug,
  setLevel,
  getLevel,
  LEVELS,
  logFile,
};

export default {
  error,
  warn,
  info,
  debug,
  setLevel,
  getLevel,
  LEVELS,
  logFile,
};

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function logger(name) {
  const LOG_FILE = "myapp.log";
  const MAX_BYTES = 2 * 1024 * 1024;
  const BACKUP_COUNT = 5;

  const LEVELS = {
    DEBUG: "DEBUG",
    INFO: "INFO",
    WARNING: "WARNING",
    ERROR: "ERROR",
    CRITICAL: "CRITICAL",
  };

  const COLORS = {
    DEBUG: "\x1b[36m",
    INFO: "\x1b[32m",
    WARNING: "\x1b[33m",
    ERROR: "\x1b[31m",
    CRITICAL: "\x1b[35m",
    RESET: "\x1b[0m",
  };

  function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  function getCallerInfo() {
    const error = new Error();
    const stack = error.stack.split("\n");

    // Stack trace breakdown:
    // [0] = "Error"
    // [1] = "at getCallerInfo (...)"
    // [2] = "at log (...)"
    // [3] = "at debug/info/warn/error (...)" <- This is our wrapper function
    // [4] = "at actualCaller (...)" <- THIS IS WHAT WE WANT!

    const callerLine = stack[4] || stack[3] || "";

    const match = callerLine.match(
      /at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):\d+|(.+?))\)?$/
    );

    let filename = name;
    let funcName = "anonymous";
    let lineNumber = "unknown";

    if (match) {
      funcName = match[1] || "anonymous";
      const fullPath = match[2] || match[4] || "";

      // Extract just the filename, not the full path
      if (fullPath) {
        // Handle both file:// URLs and regular paths
        const cleanPath = fullPath
          .replace("file:///", "")
          .replace("file://", "");
        filename = path.basename(cleanPath);
      } else if (name) {
        filename = path.basename(name);
      }

      lineNumber = match[3] || "unknown";
    }

    return { filename, funcName, lineNumber };
  }

  function formatMessage(level, message, callerInfo) {
    const timestamp = getTimestamp();
    return `[${timestamp} : ${level}] - [${callerInfo.filename}: ${callerInfo.funcName}:${callerInfo.lineNumber}] - ${message}`;
  }

  function rotateLogsIfNeeded() {
    try {
      if (!fs.existsSync(LOG_FILE)) {
        return;
      }

      const stats = fs.statSync(LOG_FILE);
      if (stats.size < MAX_BYTES) {
        return;
      }

      for (let i = BACKUP_COUNT - 1; i >= 1; i--) {
        const oldFile = `${LOG_FILE}.${i}`;
        const newFile = `${LOG_FILE}.${i + 1}`;

        if (fs.existsSync(oldFile)) {
          if (i === BACKUP_COUNT - 1) {
            fs.unlinkSync(oldFile);
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
    } catch (error) {
      console.error("Error rotating logs:", error.message);
    }
  }

  function writeToFile(message) {
    try {
      rotateLogsIfNeeded();
      fs.appendFileSync(LOG_FILE, message + "\n", "utf8");
    } catch (error) {
      console.error("Error writing to log file:", error.message);
    }
  }

  function writeToConsole(level, message) {
    const color = COLORS[level] || COLORS.RESET;
    console.log(`${color}${message}${COLORS.RESET}`);
  }

  function log(level, message) {
    const callerInfo = getCallerInfo();
    const formattedMessage = formatMessage(level, message, callerInfo);

    writeToConsole(level, formattedMessage);
    writeToFile(formattedMessage);
  }

  return {
    debug: (message) => log(LEVELS.DEBUG, message),
    info: (message) => log(LEVELS.INFO, message),
    warn: (message) => log(LEVELS.WARNING, message),
    warning: (message) => log(LEVELS.WARNING, message),
    error: (message) => log(LEVELS.ERROR, message),
    critical: (message) => log(LEVELS.CRITICAL, message),
    crit: (message) => log(LEVELS.CRITICAL, message),
  };
}

export default logger;

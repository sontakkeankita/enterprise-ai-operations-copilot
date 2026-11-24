
const writeLog = (level, message, metadata = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata,
  };

  const serialized = JSON.stringify(logEntry);

  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
};

export const logInfo = (message, metadata) => {
  writeLog("info", message, metadata);
};

export const logWarning = (message, metadata) => {
  writeLog("warn", message, metadata);
};

export const logError = (message, metadata) => {
  writeLog("error", message, metadata);
};

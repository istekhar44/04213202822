// src/utils/logger.js

export const log = (message) => {
  try {
    const logs = JSON.parse(localStorage.getItem('logs')) || [];

    logs.push({
      timestamp: new Date().toISOString(),
      message: String(message),
    });

    localStorage.setItem('logs', JSON.stringify(logs));
  } catch (error) {
    // Fallback (but still avoid console.log, per constraints)
    alert("Logging failed.");
    // Optional: silently ignore or display error to user if needed
  }
};

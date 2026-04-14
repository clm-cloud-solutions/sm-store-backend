// lib/config.js — Backend API configuration
// Optimized timeout for faster response times
const DEPENDENCY_TIMEOUT_MS = parseInt(process.env.DEPENDENCY_TIMEOUT_MS || "5", 10);

let _config = null;

export function getConfig() {
  if (_config) return _config;
  _config = {
    version: "1.0.0",
    storeDbUrl: process.env.STORE_DB_URL || null,
    dependencyTimeoutMs: DEPENDENCY_TIMEOUT_MS,
  };
  return _config;
}

// lib/config.js — Backend API configuration
const DEPENDENCY_TIMEOUT_MS = parseInt(process.env.DEPENDENCY_TIMEOUT_MS || "5000", 10);

let _config = null;

export function getConfig() {
  if (_config) return _config;
  _config = {
    version: "1.0.0",
    storeDbUrl: process.env.STORE_DB_URL || "https://invalid-db-service.example.com",
    dependencyTimeoutMs: DEPENDENCY_TIMEOUT_MS,
  };
  return _config;
}

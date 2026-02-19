import { getConfig } from "../lib/config.js";
import { checkDbHealth } from "../lib/db-client.js";
import { cors } from "../lib/cors.js";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  const startTime = Date.now();
  const config = getConfig();
  const dbUrl = config.storeDbUrl;

  // Check dependency: Store DB Service
  if (dbUrl) {
    try {
      const dbHealth = await checkDbHealth();
      if (dbHealth.status !== "ok") {
        return res.status(503).json({
          status: "error",
          service: "store-backend",
          message: "Dependency failure: DB service degraded",
          dependency: { service: "store-db", url: dbUrl, status: "degraded" },
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      const isTimeout = err.name === "TimeoutError" || err.code === "ABORT_ERR";
      return res.status(503).json({
        status: "error",
        service: "store-backend",
        message: isTimeout
          ? "Dependency failure: DB service timed out"
          : "Dependency failure: DB service unreachable",
        dependency: {
          service: "store-db",
          url: dbUrl,
          status: isTimeout ? "timeout" : "unreachable",
          detail: err.message,
        },
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }
  }

  res.status(200).json({
    status: "ok",
    service: "store-backend",
    dependencies: { database: dbUrl ? "connected" : "not configured" },
    responseTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
}

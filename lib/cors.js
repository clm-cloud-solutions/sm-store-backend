// lib/cors.js — CORS helper for Vercel Serverless Functions
// Refactored: restrict origins to known services instead of wildcard
const ALLOWED_ORIGINS = [
  "https://gitlab-sm-store-backend.vercel.app",   // self (for health checks)
  "https://gitlab-sm-store-db.vercel.app",         // DB service
  "https://admin.uptimebolt.com",                  // admin panel
];

export function cors(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  // No Access-Control-Allow-Origin header if origin not in list
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

import { cors } from "../lib/cors.js";

export default function handler(req, res) {
  if (cors(req, res)) return;
  res.status(200).json({
    service: "store-backend",
    status: "ok",
    endpoints: ["/api/health", "/api/products", "/api/products/[id]", "/api/auth", "/api/cart/validate", "/api/checkout", "/api/orders"],
    version: "1.0.0",
  });
}

// lib/db-client.js — HTTP client for the Store DB service
import { getConfig } from "./config.js";

async function dbFetch(path, options = {}) {
  const config = getConfig();
  const baseUrl = config.storeDbUrl;
  if (!baseUrl) {
    throw new Error("STORE_DB_URL not configured");
  }
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(config.dependencyTimeoutMs),
    headers: { "Content-Type": "application/json", "Accept": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `DB service returned ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function fetchProducts(category) {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return dbFetch(`/api/products${qs}`);
}

export async function fetchProduct(id) {
  return dbFetch(`/api/products/${id}`);
}

export async function reserveStock(productId, qty) {
  return dbFetch("/api/inventory", {
    method: "PUT",
    body: JSON.stringify({ productId, action: "reserve", qty }),
  });
}

export async function releaseStock(productId, qty) {
  return dbFetch("/api/inventory", {
    method: "PUT",
    body: JSON.stringify({ productId, action: "release", qty }),
  });
}

export async function authenticateUser(email, password) {
  return dbFetch("/api/users/auth", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function createOrder(userId, items, shipping) {
  return dbFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify({ userId, items, shipping }),
  });
}

export async function fetchOrders(userId) {
  return dbFetch(`/api/orders?userId=${encodeURIComponent(userId)}`);
}

export async function fetchOrder(orderId) {
  return dbFetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`);
}

export async function checkDbHealth() {
  return dbFetch("/api/health");
}

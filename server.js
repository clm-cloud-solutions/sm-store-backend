// server.js — minimal HTTP server that serves the Vercel-style api/ handlers on Kubernetes.
// Zero dependencies. Mirrors Vercel's file-based routing: api/products/[id].js -> /api/products/:id
// and the vercel.json rewrite "/" -> /api/index.
import http from "node:http";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PORT = parseInt(process.env.PORT || "3000", 10);
const API_DIR = join(fileURLToPath(new URL(".", import.meta.url)), "api");

// Build the route table at boot: [{ segments: ["api","products","[id]"], handler }]
function collectFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return collectFiles(p);
    return e.name.endsWith(".js") ? [p] : [];
  });
}

const routes = [];
for (const file of collectFiles(API_DIR)) {
  const rel = relative(API_DIR, file).replace(/\.js$/, "");
  let segments = ["api", ...rel.split("/")];
  if (segments[segments.length - 1] === "index") segments = segments.slice(0, -1);
  const mod = await import(pathToFileURL(file).href);
  routes.push({ segments, handler: mod.default });
}
// vercel.json rewrite: "/" -> /api/index
const root = routes.find((r) => r.segments.length === 1 && r.segments[0] === "api");
if (root) routes.push({ segments: [], handler: root.handler });

function match(pathSegments) {
  for (const route of routes) {
    if (route.segments.length !== pathSegments.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < route.segments.length; i++) {
      const rs = route.segments[i];
      const m = rs.match(/^\[(.+)\]$/);
      if (m) params[m[1]] = decodeURIComponent(pathSegments[i]);
      else if (rs !== pathSegments[i]) { ok = false; break; }
    }
    if (ok) return { handler: route.handler, params };
  }
  return null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try { resolve(JSON.parse(raw)); } catch { resolve(raw); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Vercel-style response helpers used by the handlers
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    if (!res.headersSent) res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = (body) => { res.end(typeof body === "string" ? body : JSON.stringify(body)); return res; };

  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const found = match(pathSegments);
    if (!found) return res.status(404).json({ error: "Not found", path: url.pathname });

    req.query = { ...found.params };
    for (const [k, v] of url.searchParams) req.query[k] = v;
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) req.body = await readBody(req);

    await found.handler(req, res);
    if (!res.writableEnded) res.end();
  } catch (err) {
    console.error(`[server] ${req.method} ${req.url} failed:`, err);
    if (!res.headersSent) res.status(500).json({ error: "Internal server error", detail: err.message });
    else res.end();
  }
});

server.listen(PORT, () => {
  console.log(`[server] listening on :${PORT} with ${routes.length} routes`);
  for (const r of routes) console.log(`  /${r.segments.join("/")}`);
});

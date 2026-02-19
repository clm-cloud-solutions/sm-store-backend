import { fetchProduct } from "../../lib/db-client.js";
import { cors } from "../../lib/cors.js";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { id } = req.query;
    const result = await fetchProduct(id);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message });
  }
}

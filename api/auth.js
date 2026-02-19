import { authenticateUser } from "../lib/db-client.js";
import { cors } from "../lib/cors.js";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }
    const result = await authenticateUser(email, password);
    // Generate a simple token (for testing — NOT production-grade)
    const token = Buffer.from(`${result.data.id}:${Date.now()}`).toString("base64");
    res.status(200).json({ data: { ...result.data, token } });
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message });
  }
}

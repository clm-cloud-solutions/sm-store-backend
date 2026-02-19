import { fetchOrders, fetchOrder } from "../lib/db-client.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { userId, orderId } = req.query;
    if (orderId) {
      const result = await fetchOrder(orderId);
      return res.status(200).json(result);
    }
    if (!userId) {
      return res.status(400).json({ error: "userId query param required" });
    }
    const result = await fetchOrders(userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message });
  }
}
